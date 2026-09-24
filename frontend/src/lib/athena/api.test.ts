import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listJobs } from './api';

function stubFetch(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
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
