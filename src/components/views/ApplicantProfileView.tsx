import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  ShieldCheck,
  Save,
  AlertCircle,
} from "lucide-react";
import { ApplicantProfile } from "../../types";
import { api } from "../../api";

interface ApplicantProfileViewProps {
  profile: ApplicantProfile;
  onUpdateProfile: (updated: ApplicantProfile) => void;
}

export const ApplicantProfileView: React.FC<ApplicantProfileViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState<ApplicantProfile>(profile);
  const [newSkill, setNewSkill] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: "Chifuniro_Phiri_Executive_Resume_Master.pdf", size: "284 KB", type: "PDF Document" },
    { name: "Malawi_Public_Health_MIS_Deployment_Portfolio.pdf", size: "1.4 MB", type: "Portfolio & Case Studies" },
    { name: "USAID_UNDP_Consultancy_Terms_Archive.docx", size: "95 KB", type: "Past Contracts" },
  ]);

  const handleFieldChange = (field: keyof ApplicantProfile, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: file.type || "Document",
        },
      ]);
    }
  };

  const handleSave = async () => {
    // A second click during a slow PUT would fire a concurrent request and let
    // its error banner overwrite the first save's success.
    if (isSaving) return;
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      // Persist to backend
      await api.updateProfile(profile.id, formData);
      // Update local state for immediate UI feedback
      onUpdateProfile(formData);
      setSaveSuccess(true);
      // Replacing the timer keeps a stale one from blanking a later save's
      // banner -- the old code scheduled one per attempt and never cleared it.
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      // Errors stay put until the next save attempt; a message the user has to
      // act on should not vanish on its own.
      const message = err instanceof Error ? err.message : "Failed to save profile";
      setSaveError(message);
      console.error("Failed to persist profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Never leave a timer pointing at an unmounted component.
  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    []
  );

  // The real profile arrives after this view can already be mounted, so formData
  // would otherwise stay seeded from the mock. Re-seed on identity change only:
  // keyed on the id so an in-progress edit is never clobbered by a parent
  // re-render carrying the same profile.
  const loadedProfileId = useRef(profile.id);
  useEffect(() => {
    if (loadedProfileId.current === profile.id) return;
    loadedProfileId.current = profile.id;
    setFormData(profile);
  }, [profile]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#18181B] text-[#F97316] flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-heading text-base font-bold text-[#18181B]">
              Applicant Dossier & Document Knowledge Base
            </h3>
            <p className="text-xs text-[#64748B]">
              The factual source of truth used by Athena to tailor pristine resumes, cover letters, and consultancy proposals.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          aria-busy={isSaving}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? "Saving…" : "Save Dossier Updates"}</span>
        </button>
      </div>

      {/* Live regions have to be in the DOM before their text changes or
          assistive tech announces nothing, so both sit here permanently and the
          visible banners below are aria-hidden mirrors of the same message. */}
      <div role="status" aria-live="polite" className="sr-only">
        {saveSuccess ? "Applicant profile and tailoring knowledge base updated successfully." : ""}
      </div>
      <div role="alert" className="sr-only">
        {saveError ? `Failed to save profile: ${saveError}` : ""}
      </div>

      {saveSuccess && (
        <div
          aria-hidden="true"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Applicant profile & tailoring knowledge base updated successfully.</span>
        </div>
      )}

      {saveError && (
        <div
          aria-hidden="true"
          className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>Failed to save: {saveError}</span>
        </div>
      )}

      {/* Main Form Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity & Contact Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-2">
              Primary Identification & Lilongwe Hub
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleFieldChange("fullName", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => handleFieldChange("headline", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">Primary Station / Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">Authorized Legal Signer Name</label>
                <input
                  type="text"
                  value={formData.legalAuthorizedSigner}
                  onChange={(e) => handleFieldChange("legalAuthorizedSigner", e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B] font-serif-heading font-semibold"
                />
              </div>
            </div>

            {/* Rates & Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9] text-xs">
              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Consultancy Hourly Rate (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#64748B]">$</span>
                  <input
                    type="number"
                    value={formData.hourlyRateUsd}
                    onChange={(e) => handleFieldChange("hourlyRateUsd", Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-medium mb-1">
                  Monthly Full-Time Expectation (MWK)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#64748B] text-[10px]">MWK</span>
                  <input
                    type="number"
                    value={formData.expectedMonthlyMwk}
                    onChange={(e) => handleFieldChange("expectedMonthlyMwk", Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-[#18181B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Semantic Competencies */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-2">
              Semantic Skill Keywords (Matched by ATS Engine)
            </h4>

            {/* Add Skill Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom skill (e.g. 'PostgreSQL Cloud Architecture')..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                className="flex-1 px-3 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-xs text-[#18181B]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-[#18181B] hover:bg-[#2A2E37] text-white text-xs font-medium rounded-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Badges List */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {formData.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[#F4F5F7] text-[#1E293B] border border-[#E2E8F0]"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#94A3B8] hover:text-[#DC2626]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Document Uploads Knowledge Base */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-xs">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono">
                Uploaded Background Documents
              </h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Athena references these raw files when generating tailored resumes and proposals.
              </p>
            </div>

            {/* Upload Drag & Click Zone */}
            <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#F97316] rounded-xl p-4 text-center block cursor-pointer transition-colors bg-[#F8F9FA]">
              <Upload className="w-6 h-6 text-[#94A3B8] mx-auto mb-1" />
              <span className="text-xs font-semibold text-[#18181B] block">Upload CV or Work Samples</span>
              <span className="text-[10px] text-[#64748B]">PDF, DOCX, TXT up to 25MB</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Files List */}
            <div className="space-y-2">
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#F8F9FA] rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#F97316] shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-[#18181B] truncate">{f.name}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {f.size} • {f.type}
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Legal Signatory Advisory Box */}
          <div className="bg-[#FFF5F5] border border-red-200 rounded-xl p-4 space-y-2 text-xs text-red-950">
            <div className="flex items-center gap-1.5 font-bold text-red-900 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
              <span>DIGITAL POWER OF ATTORNEY</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your signature is stored locally and protected. Applications will NEVER be dispatched without your interactive sign-off in the submission modal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
