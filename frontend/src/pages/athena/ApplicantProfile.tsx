import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link2 as LinkedinIcon,
  GitBranch as GithubIcon,
  Briefcase,
  GraduationCap,
  Award,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  DollarSign,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { ApplicantProfile as AIApplicantProfile, JobPreferences } from "../../lib/athena/aiTypes";
import { cn } from "../../lib/athena/utils";
import { Button, GhostButton, PrimaryButton, OutlineButton, AccentButton, DangerButton } from "@/components/athena/ui/Button";
import { Badge } from "@/components/athena/ui/Badge";

interface ApplicantProfileProps {
  profile: AIApplicantProfile;
  onUpdateProfile: (updated: AIApplicantProfile) => void;
}

const INITIAL_EXPERIENCE = {
  role: "",
  company: "",
  period: "",
  location: "",
  bullets: [""],
};

const INITIAL_EDUCATION = {
  degree: "",
  institution: "",
  year: "",
};

const DEFAULT_PREFERENCES: JobPreferences = {
  keywords: [],
  excluded_keywords: [],
  locations: [],
  job_types: [],
  preferred_sources: [],
  remote_only: false,
  visa_sponsorship_required: false,
};

const normalizeProfile = (p: AIApplicantProfile): AIApplicantProfile => ({
  ...p,
  skills: p.skills ?? [],
  experience: (p.experience ?? []).map((e) => ({ ...e, bullets: e.bullets ?? [] })),
  education: p.education ?? [],
  certifications: p.certifications ?? [],
  preferences: {
    ...DEFAULT_PREFERENCES,
    ...p.preferences,
    keywords: p.preferences?.keywords ?? [],
    excluded_keywords: p.preferences?.excluded_keywords ?? [],
    locations: p.preferences?.locations ?? [],
    job_types: p.preferences?.job_types ?? [],
    preferred_sources: p.preferences?.preferred_sources ?? [],
    remote_only: p.preferences?.remote_only ?? false,
    visa_sponsorship_required: p.preferences?.visa_sponsorship_required ?? false,
  },
});

export const ApplicantProfile: React.FC<ApplicantProfileProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<AIApplicantProfile>(normalizeProfile(profile));
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "education" | "skills" | "certifications" | "preferences">("overview");

  useEffect(() => {
    setLocalProfile(normalizeProfile(profile));
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setLocalProfile((prev: AIApplicantProfile) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (arrayName: string, index: number, field: string, value: any) => {
    setLocalProfile((prev: AIApplicantProfile) => {
      const arr = [...(prev[arrayName as keyof AIApplicantProfile] as any[])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [arrayName]: arr };
    });
  };

  const addArrayItem = (arrayName: string) => {
    setLocalProfile((prev: AIApplicantProfile) => {
      const arr = [...(prev[arrayName as keyof AIApplicantProfile] as any[])];
      if (arrayName === "experience") {
        arr.push({ ...INITIAL_EXPERIENCE });
      } else if (arrayName === "education") {
        arr.push({ ...INITIAL_EDUCATION });
      } else {
        arr.push("");
      }
      return { ...prev, [arrayName]: arr };
    });
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setLocalProfile((prev: AIApplicantProfile) => {
      const arr = [...(prev[arrayName as keyof AIApplicantProfile] as any[])];
      arr.splice(index, 1);
      return { ...prev, [arrayName]: arr };
    });
  };

  const handleSave = () => {
    onUpdateProfile(localProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalProfile(normalizeProfile(profile));
    setIsEditing(false);
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Identity Card */}
      <div className="bg-surface-white border border-slate rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-ink">Identity</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.full_name}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={localProfile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.email}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Phone</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Location</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.location}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Headline</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.headline}
                onChange={(e) => handleChange("headline", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.headline}</p>
            )}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-text-secondary font-medium">Summary</label>
            {isEditing ? (
              <textarea
                rows={3}
                value={localProfile.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none leading-relaxed sunken"
              />
            ) : (
              <p className="text-text-secondary leading-relaxed">{localProfile.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-surface-muted/50 border border-slate rounded-lg p-4 space-y-2">
        <h5 className="font-semibold text-xs text-ink uppercase tracking-wider">Links</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">LinkedIn</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.linkedin_url}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <a href={localProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline text-sm">
                {localProfile.linkedin_url}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Portfolio</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.portfolio_url}
                onChange={(e) => handleChange("portfolio_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <a href={localProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline text-sm">
                {localProfile.portfolio_url}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">GitHub</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.github_url}
                onChange={(e) => handleChange("github_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <a href={localProfile.github_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline text-sm">
                {localProfile.github_url}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Compensation Preferences */}
      <div className="bg-surface-white border border-slate rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-ink">Compensation Preferences</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Hourly Rate (USD)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.hourly_rate_usd}
                onChange={(e) => handleChange("hourly_rate_usd", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">${localProfile.hourly_rate_usd}/hr</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Monthly Expectation (MWK)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.expected_monthly_mwk}
                onChange={(e) => handleChange("expected_monthly_mwk", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">MWK {localProfile.expected_monthly_mwk.toLocaleString()}/month</p>
            )}
          </div>
        </div>
      </div>

      {/* Legal Authorized Signer */}
      <div className="bg-red-50 border-2 border-signoff-red/30 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-signoff-red font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-signoff-red" />
          <span>Legal Authorized Signer</span>
        </div>
        <p className="text-xs text-red-950">
          This name will be used for digital signature on all submissions.
        </p>
        <div className="space-y-1">
          <label className="text-xs text-signoff-red font-mono uppercase font-bold">Type Legal Signature Name</label>
          {isEditing ? (
            <input
              type="text"
              value={localProfile.legal_authorized_signer}
              onChange={(e) => handleChange("legal_authorized_signer", e.target.value)}
              placeholder="e.g. Chifuniro Phiri"
              className="w-full px-3 py-2 bg-surface-white border border-signoff-red/50 rounded-md text-ink font-heading font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-signoff-red sunken"
            />
          ) : (
            <p className="font-heading font-semibold text-signoff-red">{localProfile.legal_authorized_signer}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderExperienceTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-ink">Professional Experience</h4>
        {isEditing && (
          <AccentButton size="sm" onClick={() => addArrayItem("experience")}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </AccentButton>
        )}
      </div>
      {localProfile.experience.map((exp, idx) => (
        <div key={idx} className="bg-surface-white border border-slate rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-ink">Experience #{idx + 1}</h5>
            {isEditing && (
              <button
                onClick={() => removeArrayItem("experience", idx)}
                className="p-1 text-text-secondary hover:text-signoff-red hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Role</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => handleArrayChange("experience", idx, "role", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{exp.role}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleArrayChange("experience", idx, "company", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{exp.company}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Period</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => handleArrayChange("experience", idx, "period", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{exp.period}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.location}
                  onChange={(e) => handleArrayChange("experience", idx, "location", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{exp.location}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Bullets (one per line)</label>
            {isEditing ? (
              <textarea
                rows={4}
                value={exp.bullets.join("\n")}
                onChange={(e) => handleArrayChange("experience", idx, "bullets", e.target.value.split("\n"))}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none font-mono text-xs sunken"
                placeholder="• Led team of 10 engineers\n• Reduced costs by 20%"
              />
            ) : (
              <ul className="space-y-1 text-xs text-text-secondary list-disc list-inside">
                {exp.bullets.map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
      {isEditing && localProfile.experience.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No experience entries yet. Click "Add Experience" to start.
        </div>
      )}
    </div>
  );

  const renderEducationTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-ink">Education</h4>
        {isEditing && (
          <AccentButton size="sm" onClick={() => addArrayItem("education")}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </AccentButton>
        )}
      </div>
      {localProfile.education.map((edu, idx) => (
        <div key={idx} className="bg-surface-white border border-slate rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-ink">Education #{idx + 1}</h5>
            {isEditing && (
              <button
                onClick={() => removeArrayItem("education", idx)}
                className="p-1 text-text-secondary hover:text-signoff-red hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Degree</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleArrayChange("education", idx, "degree", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{edu.degree}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Institution</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleArrayChange("education", idx, "institution", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{edu.institution}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => handleArrayChange("education", idx, "year", e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
                />
              ) : (
                <p className="text-ink">{edu.year}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {isEditing && localProfile.education.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No education entries yet. Click "Add Education" to start.
        </div>
      )}
    </div>
  );

  const renderSkillsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-ink">Core Competencies</h4>
        {isEditing && (
          <AccentButton size="sm" onClick={() => addArrayItem("skills")}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </AccentButton>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {localProfile.skills.map((skill, idx) => (
          <Badge
            key={idx}
            variant="job"
            size="standard"
            className={cn(isEditing && "bg-brand-orange/10 text-brand-orange")}
          >
            {isEditing ? (
              <input
                type="text"
                value={skill}
                onChange={(e) => {
                  const arr = [...localProfile.skills];
                  arr[idx] = e.target.value;
                  setLocalProfile({ ...localProfile, skills: arr });
                }}
                className="bg-transparent border-none outline-none text-ink text-xs w-32"
              />
            ) : (
              skill
            )}
            {isEditing && (
              <button
                onClick={() => removeArrayItem("skills", idx)}
                className="p-0.5 text-text-secondary hover:text-signoff-red"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {isEditing && localProfile.skills.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No skills yet. Click "Add Skill" to start.
        </div>
      )}
    </div>
  );

  const renderCertificationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-ink">Certifications</h4>
        {isEditing && (
          <AccentButton size="sm" onClick={() => addArrayItem("certifications")}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </AccentButton>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {localProfile.certifications.map((cert, idx) => (
          <Badge
            key={idx}
            variant="job"
            size="standard"
            className={cn(isEditing && "bg-brand-orange/10 text-brand-orange")}
          >
            {isEditing ? (
              <input
                type="text"
                value={cert}
                onChange={(e) => {
                  const arr = [...localProfile.certifications];
                  arr[idx] = e.target.value;
                  setLocalProfile({ ...localProfile, certifications: arr });
                }}
                className="bg-transparent border-none outline-none text-ink text-xs w-48"
              />
            ) : (
              cert
            )}
            {isEditing && (
              <button
                onClick={() => removeArrayItem("certifications", idx)}
                className="p-0.5 text-text-secondary hover:text-signoff-red"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {isEditing && localProfile.certifications.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No certifications yet. Click "Add Certification" to start.
        </div>
      )}
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-4">
      <div className="bg-surface-white border border-slate rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-ink">Job Preferences</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Keywords</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.keywords.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, keywords: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.preferences.keywords.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Excluded Keywords</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.excluded_keywords.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, excluded_keywords: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.preferences.excluded_keywords.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Locations</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.locations.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, locations: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.preferences.locations.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Job Types</label>
            {isEditing ? (
              <select
                multiple
                value={localProfile.preferences.job_types}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  handleChange("preferences", { ...localProfile.preferences, job_types: selected });
                }}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="consultancy">Consultancy</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            ) : (
              <p className="text-ink">{localProfile.preferences.job_types.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Min Salary (USD/yr)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.preferences.min_salary || ""}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, min_salary: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-1.5 bg-surface-white border border-slate rounded-md text-ink focus:ring-1 focus:ring-brand-orange focus:outline-none sunken"
              />
            ) : (
              <p className="text-ink">{localProfile.preferences.min_salary ? `$${localProfile.preferences.min_salary}/yr` : "Not specified"}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Remote Only</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localProfile.preferences.remote_only}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, remote_only: e.target.checked })}
                className="w-4 h-4 text-brand-orange border-slate rounded focus:ring-brand-orange"
              />
              <span className="text-xs text-text-secondary">Only show remote positions</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Visa Sponsorship Required</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localProfile.preferences.visa_sponsorship_required}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, visa_sponsorship_required: e.target.checked })}
                className="w-4 h-4 text-brand-orange border-slate rounded focus:ring-brand-orange"
              />
              <span className="text-xs text-text-secondary">Require visa sponsorship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-white border border-slate p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-ink">
              Applicant Skills & Profile
            </h3>
            <p className="text-xs text-text-secondary">
              Complete professional dossier for AI-powered document generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <GhostButton size="sm" onClick={handleCancel}>
                <X className="w-3.5 h-3.5 text-text-secondary" />
                <span>Cancel</span>
              </GhostButton>
              <PrimaryButton onClick={handleSave} size="sm">
                <Save className="w-3.5 h-3.5 text-brand-orange" />
                <span>Save Profile</span>
              </PrimaryButton>
            </>
          ) : (
            <AccentButton size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-3.5 h-3.5 text-brand-orange" />
              <span className="hidden sm:inline">Edit Profile</span>
            </AccentButton>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate pb-1 text-xs">
        {[
          { id: "overview", label: "Overview" },
          { id: "experience", label: "Experience" },
          { id: "education", label: "Education" },
          { id: "skills", label: "Skills" },
          { id: "certifications", label: "Certifications" },
          { id: "preferences", label: "Preferences" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "accent" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="px-4 py-2"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "experience" && renderExperienceTab()}
        {activeTab === "education" && renderEducationTab()}
        {activeTab === "skills" && renderSkillsTab()}
        {activeTab === "certifications" && renderCertificationsTab()}
        {activeTab === "preferences" && renderPreferencesTab()}
      </div>
    </div>
  );
};

export default ApplicantProfile;