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

export const ApplicantProfile: React.FC<ApplicantProfileProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<AIApplicantProfile>(profile);
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "education" | "skills" | "certifications" | "preferences">("overview");

  useEffect(() => {
    setLocalProfile(profile);
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
    setLocalProfile(profile);
    setIsEditing(false);
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Identity Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-text">Identity</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.full_name}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={localProfile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.email}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Phone</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Location</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.location}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Headline</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.headline}
                onChange={(e) => handleChange("headline", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.headline}</p>
            )}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-muted font-medium">Summary</label>
            {isEditing ? (
              <textarea
                rows={3}
                value={localProfile.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none leading-relaxed"
              />
            ) : (
              <p className="text-muted leading-relaxed">{localProfile.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
        <h5 className="font-semibold text-xs text-text uppercase tracking-wider">Links</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">LinkedIn</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.linkedin_url}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-card border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <a href={localProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                {localProfile.linkedin_url}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Portfolio</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.portfolio_url}
                onChange={(e) => handleChange("portfolio_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-card border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <a href={localProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                {localProfile.portfolio_url}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">GitHub</label>
            {isEditing ? (
              <input
                type="url"
                value={localProfile.github_url}
                onChange={(e) => handleChange("github_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-card border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <a href={localProfile.github_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                {localProfile.github_url}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Compensation Preferences */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-text">Compensation Preferences</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Hourly Rate (USD)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.hourly_rate_usd}
                onChange={(e) => handleChange("hourly_rate_usd", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">${localProfile.hourly_rate_usd}/hr</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Monthly Expectation (MWK)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.expected_monthly_mwk}
                onChange={(e) => handleChange("expected_monthly_mwk", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">MWK {localProfile.expected_monthly_mwk.toLocaleString()}/month</p>
            )}
          </div>
        </div>
      </div>

      {/* Legal Authorized Signer */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>Legal Authorized Signer</span>
        </div>
        <p className="text-xs text-red-950">
          This name will be used for digital signature on all submissions.
        </p>
        <div className="space-y-1">
          <label className="text-xs text-red-900 font-mono uppercase font-bold">Type Legal Signature Name</label>
          {isEditing ? (
            <input
              type="text"
              value={localProfile.legal_authorized_signer}
              onChange={(e) => handleChange("legal_authorized_signer", e.target.value)}
              placeholder="e.g. Chifuniro Phiri"
              className="w-full px-3 py-2 bg-card border border-red-300 rounded-md text-text font-heading font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          ) : (
            <p className="font-heading font-semibold text-red-900">{localProfile.legal_authorized_signer}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderExperienceTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-text">Professional Experience</h4>
        {isEditing && (
          <button
            onClick={() => addArrayItem("experience")}
            className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        )}
      </div>
      {localProfile.experience.map((exp, idx) => (
        <div key={idx} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-text">Experience #{idx + 1}</h5>
            {isEditing && (
              <button
                onClick={() => removeArrayItem("experience", idx)}
                className="p-1 text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Role</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => handleArrayChange("experience", idx, "role", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{exp.role}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleArrayChange("experience", idx, "company", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{exp.company}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Period</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => handleArrayChange("experience", idx, "period", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{exp.period}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={exp.location}
                  onChange={(e) => handleArrayChange("experience", idx, "location", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{exp.location}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Bullets (one per line)</label>
            {isEditing ? (
              <textarea
                rows={4}
                value={exp.bullets.join("\n")}
                onChange={(e) => handleArrayChange("experience", idx, "bullets", e.target.value.split("\n"))}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none font-mono text-xs"
                placeholder="• Led team of 10 engineers\n• Reduced costs by 20%"
              />
            ) : (
              <ul className="space-y-1 text-xs text-muted list-disc list-inside">
                {exp.bullets.map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
      {isEditing && localProfile.experience.length === 0 && (
        <div className="text-center py-8 text-muted">
          No experience entries yet. Click "Add Experience" to start.
        </div>
      )}
    </div>
  );

  const renderEducationTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-text">Education</h4>
        {isEditing && (
          <button
            onClick={() => addArrayItem("education")}
            className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        )}
      </div>
      {localProfile.education.map((edu, idx) => (
        <div key={idx} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-text">Education #{idx + 1}</h5>
            {isEditing && (
              <button
                onClick={() => removeArrayItem("education", idx)}
                className="p-1 text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Degree</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleArrayChange("education", idx, "degree", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{edu.degree}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Institution</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleArrayChange("education", idx, "institution", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{edu.institution}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted font-medium">Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => handleArrayChange("education", idx, "year", e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
                />
              ) : (
                <p className="text-text">{edu.year}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {isEditing && localProfile.education.length === 0 && (
        <div className="text-center py-8 text-muted">
          No education entries yet. Click "Add Education" to start.
        </div>
      )}
    </div>
  );

  const renderSkillsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-text">Core Competencies</h4>
        {isEditing && (
          <button
            onClick={() => addArrayItem("skills")}
            className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {localProfile.skills.map((skill, idx) => (
          <span
            key={idx}
            className={cn(
              "px-3 py-1 bg-muted rounded-lg text-xs font-medium flex items-center gap-1.5",
              isEditing && "bg-accent/10 text-accent"
            )}
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
                className="bg-transparent border-none outline-none text-text text-xs w-32"
              />
            ) : (
              skill
            )}
            {isEditing && (
              <button
                onClick={() => removeArrayItem("skills", idx)}
                className="p-0.5 text-muted hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {isEditing && localProfile.skills.length === 0 && (
        <div className="text-center py-8 text-muted">
          No skills yet. Click "Add Skill" to start.
        </div>
      )}
    </div>
  );

  const renderCertificationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-bold text-text">Certifications</h4>
        {isEditing && (
          <button
            onClick={() => addArrayItem("certifications")}
            className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {localProfile.certifications.map((cert, idx) => (
          <span
            key={idx}
            className={cn(
              "px-3 py-1 bg-muted rounded-lg text-xs font-medium flex items-center gap-1.5",
              isEditing && "bg-accent/10 text-accent"
            )}
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
                className="bg-transparent border-none outline-none text-text text-xs w-48"
              />
            ) : (
              cert
            )}
            {isEditing && (
              <button
                onClick={() => removeArrayItem("certifications", idx)}
                className="p-0.5 text-muted hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {isEditing && localProfile.certifications.length === 0 && (
        <div className="text-center py-8 text-muted">
          No certifications yet. Click "Add Certification" to start.
        </div>
      )}
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-heading text-lg font-bold text-text">Job Preferences</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Keywords</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.keywords.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, keywords: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.preferences.keywords.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Excluded Keywords</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.excluded_keywords.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, excluded_keywords: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.preferences.excluded_keywords.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Locations</label>
            {isEditing ? (
              <input
                type="text"
                value={localProfile.preferences.locations.join(", ")}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, locations: e.target.value.split(",").map((s) => s.trim()) })}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.preferences.locations.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Job Types</label>
            {isEditing ? (
              <select
                multiple
                value={localProfile.preferences.job_types}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  handleChange("preferences", { ...localProfile.preferences, job_types: selected });
                }}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
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
              <p className="text-text">{localProfile.preferences.job_types.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Min Salary (USD/yr)</label>
            {isEditing ? (
              <input
                type="number"
                value={localProfile.preferences.min_salary || ""}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, min_salary: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-1.5 bg-muted border border-border rounded-md text-text focus:ring-1 focus:ring-accent focus:outline-none"
              />
            ) : (
              <p className="text-text">{localProfile.preferences.min_salary ? `$${localProfile.preferences.min_salary}/yr` : "Not specified"}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Remote Only</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localProfile.preferences.remote_only}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, remote_only: e.target.checked })}
                className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
              />
              <span className="text-xs text-muted">Only show remote positions</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted font-medium">Visa Sponsorship Required</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localProfile.preferences.visa_sponsorship_required}
                onChange={(e) => handleChange("preferences", { ...localProfile.preferences, visa_sponsorship_required: e.target.checked })}
                className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
              />
              <span className="text-xs text-muted">Require visa sponsorship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-accent flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-text">
              Applicant Skills & Profile
            </h3>
            <p className="text-xs text-muted">
              Complete professional dossier for AI-powered document generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-muted hover:bg-border text-text text-xs font-medium rounded-lg border border-border flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-accent" />
                <span>Save Profile</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1 text-xs">
        {[
          { id: "overview", label: "Overview" },
          { id: "experience", label: "Experience" },
          { id: "education", label: "Education" },
          { id: "skills", label: "Skills" },
          { id: "certifications", label: "Certifications" },
          { id: "preferences", label: "Preferences" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-2 font-semibold transition-colors border-b-2 flex items-center gap-2",
              activeTab === tab.id
                ? "border-accent text-text"
                : "border-transparent text-muted hover:text-text"
            )}
          >
            {tab.label}
          </button>
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