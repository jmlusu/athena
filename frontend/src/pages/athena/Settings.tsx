import React, { useEffect, useState } from 'react';
import {
  User,
  Save,
  Loader2,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/athena/utils';
import { listProfiles, createProfile, updateProfile, processJobs } from '@/lib/athena/api';
import type { UserProfile, Skill, Experience } from '@/lib/athena/types';

interface ProfileForm {
  email: string;
  full_name: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  github_url: string;
  headline: string;
  summary: string;
  skills_text: string;
  languages_text: string;
  certifications_text: string;
  keywords_text: string;
  remote_only: boolean;
}

const emptyForm: ProfileForm = {
  email: '',
  full_name: '',
  phone: '',
  location: '',
  linkedin_url: '',
  portfolio_url: '',
  github_url: '',
  headline: '',
  summary: '',
  skills_text: '',
  languages_text: '',
  certifications_text: '',
  keywords_text: '',
  remote_only: true,
};

function parseList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSkills(text: string): Skill[] {
  return parseList(text).map((name) => ({ name }));
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone || '',
    location: profile.location || '',
    linkedin_url: profile.linkedin_url || '',
    portfolio_url: profile.portfolio_url || '',
    github_url: profile.github_url || '',
    headline: profile.headline || '',
    summary: profile.summary || '',
    skills_text: (profile.skills || []).map((s) => s.name).join(', '),
    languages_text: (profile.languages || []).join(', '),
    certifications_text: (profile.certifications || []).join(', '),
    keywords_text: (profile.preferences?.keywords || []).join(', '),
    remote_only: profile.preferences?.remote_only ?? true,
  };
}

function buildPayload(form: ProfileForm) {
  return {
    email: form.email.trim(),
    full_name: form.full_name.trim(),
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    linkedin_url: form.linkedin_url.trim() || undefined,
    portfolio_url: form.portfolio_url.trim() || undefined,
    github_url: form.github_url.trim() || undefined,
    headline: form.headline.trim(),
    summary: form.summary.trim(),
    skills: parseSkills(form.skills_text),
    languages: parseList(form.languages_text),
    certifications: parseList(form.certifications_text),
    preferences: {
      keywords: parseList(form.keywords_text),
      excluded_keywords: [],
      locations: form.location.trim() ? [form.location.trim()] : [],
      job_types: [],
      preferred_sources: [],
      remote_only: form.remote_only,
      visa_sponsorship_required: false,
    },
    experience: [] as Experience[],
    education: [],
  };
}

const fieldClass =
  'w-full px-3 py-2.5 sunken rounded-lg border border-white/8 text-sm text-ls-navy placeholder:text-ls-grey-light-text focus:outline-none focus:ring-2 focus:ring-ls-red font-body';

const labelClass = 'block font-body text-xs font-medium text-ls-grey-light-text mb-1.5 uppercase tracking-wider';

export const Settings: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const list = await listProfiles();
      setProfiles(list);
      if (list.length > 0) {
        setActiveId(list[0].id);
        setForm(toForm(list[0]));
      }
      setMessage(null);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setMessage({ type: 'error', text: 'Failed to load profiles from the API.' });
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNew = () => {
    setActiveId(null);
    setForm(emptyForm);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.full_name.trim()) {
      setMessage({ type: 'error', text: 'Email and full name are required.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildPayload(form);
      let saved: UserProfile;
      if (activeId) {
        saved = await updateProfile(activeId, payload as Partial<UserProfile>);
        setMessage({ type: 'success', text: 'Profile updated.' });
      } else {
        saved = await createProfile(payload as unknown as Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>);
        setActiveId(saved.id);
        setMessage({ type: 'success', text: 'Profile created.' });
      }
      const list = await listProfiles();
      setProfiles(list);
      setForm(toForm(saved));

      // Re-score all scraped jobs against the profile
      setScoring(true);
      try {
        const result = await processJobs();
        setMessage({
          type: 'success',
          text: `Profile saved. Scored ${result.scored} of ${result.total_jobs} jobs.`,
        });
      } catch (scoreErr) {
        console.error('Scoring failed:', scoreErr);
        setMessage({
          type: 'success',
          text: 'Profile saved. Scoring will run on the next scheduler pass (or retry Process now).',
        });
      } finally {
        setScoring(false);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async () => {
    setScoring(true);
    setMessage(null);
    try {
      const result = await processJobs();
      setMessage({
        type: 'success',
        text: `Processed jobs — ${result.scored} scored of ${result.total_jobs} total.`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Processing failed.' });
    } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-ls-red" aria-hidden="true" />
        <span className="ml-3 font-body text-ls-grey-dark">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-ls-navy">Settings</h2>
          <p className="font-body text-sm text-ls-grey-light-text mt-1">
            Your profile drives match ranking and ATS scoring for scraped jobs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleProcess}
            disabled={scoring}
            className="tactile flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-ls-white text-ls-grey-dark hover:border-ls-red/40 hover:text-ls-red text-sm font-body font-medium disabled:opacity-40"
          >
            {scoring ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            )}
            Re-score jobs
          </button>
          <button
            type="button"
            onClick={handleNew}
            className="tactile flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ls-red text-[#14161A] font-bold text-sm hover:brightness-110 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            New profile
          </button>
        </div>
      </div>

      {profiles.length > 1 && (
        <div className="raised bg-ls-white border border-white/7 rounded-xl p-4">
          <label htmlFor="profile-select" className={labelClass}>
            Active profile
          </label>
          <select
            id="profile-select"
            value={activeId || ''}
            onChange={(e) => {
              const p = profiles.find((x) => x.id === e.target.value);
              if (p) {
                setActiveId(p.id);
                setForm(toForm(p));
                setMessage(null);
              }
            }}
            className={fieldClass}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} — {p.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div
          role="status"
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4',
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <p className="font-body text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="raised bg-ls-white border border-white/7 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b seam">
          <User className="w-4 h-4 text-ls-red" aria-hidden="true" />
          <h3 className="font-display font-bold text-base text-ls-navy">Identity</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Full name *
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className={fieldClass}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={fieldClass}
              placeholder="jane@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={fieldClass}
              placeholder="+1 555 000 0000"
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={fieldClass}
              placeholder="Lilongwe, Malawi / Remote"
            />
          </div>
        </div>

        <div>
          <label htmlFor="headline" className={labelClass}>
            Headline
          </label>
          <input
            id="headline"
            type="text"
            value={form.headline}
            onChange={(e) => set('headline', e.target.value)}
            className={fieldClass}
            placeholder="Full-stack engineer · React · Python"
          />
        </div>

        <div>
          <label htmlFor="summary" className={labelClass}>
            Summary
          </label>
          <textarea
            id="summary"
            rows={4}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            className={cn(fieldClass, 'resize-y min-h-24')}
            placeholder="Short professional summary used for semantic matching…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="linkedin_url" className={labelClass}>
              LinkedIn
            </label>
            <input
              id="linkedin_url"
              type="url"
              value={form.linkedin_url}
              onChange={(e) => set('linkedin_url', e.target.value)}
              className={fieldClass}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
          <div>
            <label htmlFor="github_url" className={labelClass}>
              GitHub
            </label>
            <input
              id="github_url"
              type="url"
              value={form.github_url}
              onChange={(e) => set('github_url', e.target.value)}
              className={fieldClass}
              placeholder="https://github.com/…"
            />
          </div>
          <div>
            <label htmlFor="portfolio_url" className={labelClass}>
              Portfolio
            </label>
            <input
              id="portfolio_url"
              type="url"
              value={form.portfolio_url}
              onChange={(e) => set('portfolio_url', e.target.value)}
              className={fieldClass}
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="pt-2 pb-1 border-t seam flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-ls-red" aria-hidden="true" />
          <h3 className="font-display font-bold text-base text-ls-navy">Matching signals</h3>
        </div>

        <div>
          <label htmlFor="skills_text" className={labelClass}>
            Skills (comma-separated)
          </label>
          <input
            id="skills_text"
            type="text"
            value={form.skills_text}
            onChange={(e) => set('skills_text', e.target.value)}
            className={fieldClass}
            placeholder="Python, React, TypeScript, Docker, SQL"
          />
          <p className="font-body text-[11px] text-ls-grey-light-text mt-1.5">
            Primary driver for keyword + semantic match scores.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="keywords_text" className={labelClass}>
              Preferred job keywords
            </label>
            <input
              id="keywords_text"
              type="text"
              value={form.keywords_text}
              onChange={(e) => set('keywords_text', e.target.value)}
              className={fieldClass}
              placeholder="remote, full-time, backend"
            />
          </div>
          <div>
            <label htmlFor="languages_text" className={labelClass}>
              Languages
            </label>
            <input
              id="languages_text"
              type="text"
              value={form.languages_text}
              onChange={(e) => set('languages_text', e.target.value)}
              className={fieldClass}
              placeholder="English, Chichewa"
            />
          </div>
        </div>

        <div>
          <label htmlFor="certifications_text" className={labelClass}>
            Certifications (comma-separated)
          </label>
          <input
            id="certifications_text"
            type="text"
            value={form.certifications_text}
            onChange={(e) => set('certifications_text', e.target.value)}
            className={fieldClass}
            placeholder="AWS SAA, PMP"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.remote_only}
            onChange={(e) => set('remote_only', e.target.checked)}
            className="w-4 h-4 rounded accent-ls-red"
          />
          <span className="font-body text-sm text-ls-grey-dark">Prefer remote roles</span>
        </label>

        <div className="flex justify-end pt-2 border-t seam">
          <button
            type="submit"
            disabled={saving || scoring}
            className="tactile flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ls-red text-[#14161A] font-bold text-sm hover:brightness-110 disabled:opacity-40"
          >
            {saving || scoring ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="w-4 h-4" aria-hidden="true" />
            )}
            {saving ? 'Saving…' : scoring ? 'Scoring…' : activeId ? 'Update profile' : 'Create profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
