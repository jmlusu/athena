import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyToJob, flagJob, generateCoverLetter, listJobs, tailorResume } from './api';

function stubFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

function expectPostCall(mock: ReturnType<typeof vi.fn>, path: string): RequestInit {
  expect(mock).toHaveBeenCalledTimes(1);
  const [url, init] = mock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe(`/api/v1/athena${path}`);
  expect(init?.method).toBe('POST');
  const headers = (init?.headers ?? {}) as Record<string, string>;
  expect(headers['Content-Type']).toBe('application/json');
  expect(headers['X-API-Key']).toBeTruthy();
  return init;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('listJobs response normalisation', () => {
  it('passes a canonical {jobs, total, limit, offset} body through unchanged', async () => {
    const body = {
      jobs: [
        { id: 'job-1', title: 'Engineer' },
        { id: 'job-2', title: 'Designer' },
      ],
      total: 2,
      limit: 20,
      offset: 40,
    };
    stubFetch(body);

    const result = await listJobs({ limit: 20, offset: 40 });

    expect(result).toEqual(body);
    expect(Array.isArray(result.jobs)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(typeof result.limit).toBe('number');
    expect(typeof result.offset).toBe('number');
  });

  it('normalises a bare JSON array into a well-formed response', async () => {
    stubFetch([
      { id: 'job-1', title: 'Engineer' },
      { id: 'job-2', title: 'Designer' },
    ]);

    const result = await listJobs();

    expect(result.jobs).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(2);
    expect(result.offset).toBe(0);
    expect(Array.isArray(result.jobs)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  it('normalises an empty object into an empty response', async () => {
    stubFetch({});

    const result = await listJobs();

    expect(result).toMatchObject({ jobs: [], total: 0 });
    expect(Array.isArray(result.jobs)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(typeof result.limit).toBe('number');
    expect(typeof result.offset).toBe('number');
  });

  it('returns a well-formed response for a 200 body with neither jobs nor totals', async () => {
    stubFetch({ detail: 'preview environment' });

    const result = await listJobs();

    expect(Array.isArray(result.jobs)).toBe(true);
    expect(result.jobs).toHaveLength(0);
    expect(typeof result.total).toBe('number');
    expect(result.total).toBe(0);
    expect(typeof result.limit).toBe('number');
    expect(typeof result.offset).toBe('number');
  });

  it('falls back to the requested filters for limit and offset', async () => {
    stubFetch({ jobs: [{ id: 'job-1', title: 'Engineer' }] });

    const result = await listJobs({ limit: 5, offset: 10 });

    expect(Array.isArray(result.jobs)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(result.total).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });
});

describe('applyToJob', () => {
  it('POSTs the payload to /jobs/{id}/apply and returns the Application', async () => {
    const body = { id: 'app-1', job_id: 'job-1', status: 'pending' };
    const mock = stubFetch(body);

    const result = await applyToJob('job-1', { user_profile_id: 'prof-1', resume_id: 'res-1' });

    const init = expectPostCall(mock, '/jobs/job-1/apply');
    expect(JSON.parse(init.body as string)).toEqual({ user_profile_id: 'prof-1', resume_id: 'res-1' });
    expect(result).toEqual(body);
  });

  it('includes cover_letter_id when provided', async () => {
    const mock = stubFetch({ id: 'app-1' });

    await applyToJob('job-1', { user_profile_id: 'prof-1', resume_id: 'res-1', cover_letter_id: 'cl-1' });

    const init = expectPostCall(mock, '/jobs/job-1/apply');
    expect(JSON.parse(init.body as string)).toEqual({
      user_profile_id: 'prof-1',
      resume_id: 'res-1',
      cover_letter_id: 'cl-1',
    });
  });

  it('surfaces the backend error detail on a failed response', async () => {
    stubFetch({ detail: 'resume not found' }, 400);

    await expect(
      applyToJob('job-1', { user_profile_id: 'prof-1', resume_id: 'res-1' }),
    ).rejects.toThrow('resume not found');
  });
});

describe('tailorResume', () => {
  it('POSTs to /jobs/{id}/tailor-resume and parses the generated document', async () => {
    const body = { filename: 'resume.docx', path: '/tmp/resume.docx', warnings: ['Missing date'] };
    const mock = stubFetch(body);

    const result = await tailorResume('job-1', { user_profile_id: 'prof-1' });

    const init = expectPostCall(mock, '/jobs/job-1/tailor-resume');
    expect(JSON.parse(init.body as string)).toEqual({ user_profile_id: 'prof-1' });
    expect(result).toEqual(body);
    expect(result.filename).toBe('resume.docx');
    expect(result.path).toBe('/tmp/resume.docx');
    expect(result.warnings).toEqual(['Missing date']);
  });

  it('passes output_format through when given', async () => {
    const mock = stubFetch({ filename: 'resume.pdf', path: null, warnings: [] });

    const result = await tailorResume('job-1', { user_profile_id: 'prof-1', output_format: 'pdf' });

    const init = expectPostCall(mock, '/jobs/job-1/tailor-resume');
    expect(JSON.parse(init.body as string)).toEqual({ user_profile_id: 'prof-1', output_format: 'pdf' });
    expect(result.path).toBeNull();
    expect(result.warnings).toEqual([]);
  });
});

describe('generateCoverLetter', () => {
  it('POSTs to /jobs/{id}/cover-letter and parses the generated document', async () => {
    const body = { filename: 'cover-letter.docx', path: '/tmp/cover-letter.docx', warnings: [] };
    const mock = stubFetch(body);

    const result = await generateCoverLetter('job-1', { user_profile_id: 'prof-1', output_format: 'both' });

    const init = expectPostCall(mock, '/jobs/job-1/cover-letter');
    expect(JSON.parse(init.body as string)).toEqual({ user_profile_id: 'prof-1', output_format: 'both' });
    expect(result).toEqual(body);
    expect(result.filename).toBe('cover-letter.docx');
  });

  it('handles a null path and warnings list', async () => {
    stubFetch({ filename: 'cover.pdf', path: null, warnings: ['Tone softened'] });

    const result = await generateCoverLetter('job-1', { user_profile_id: 'prof-1' });

    expect(result.path).toBeNull();
    expect(result.warnings).toEqual(['Tone softened']);
  });
});

describe('flagJob', () => {
  it('POSTs to /jobs/{id}/flag and returns the flagged Job', async () => {
    const body = { id: 'job-1', title: 'Engineer', status: 'flagged' };
    const mock = stubFetch(body);

    const result = await flagJob('job-1');

    const init = expectPostCall(mock, '/jobs/job-1/flag');
    expect(JSON.parse(init.body as string)).toEqual({});
    expect(result.status).toBe('flagged');
    expect(result).toEqual(body);
  });

  it('sends the optional reason', async () => {
    const mock = stubFetch({ id: 'job-1', status: 'flagged' });

    await flagJob('job-1', { reason: 'Salary looks off' });

    const init = expectPostCall(mock, '/jobs/job-1/flag');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'Salary looks off' });
  });
});
