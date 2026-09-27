import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, AlertCircle, Send, Key } from "lucide-react";
import { cn } from "@/lib/athena/utils";
import { Button, DangerButton, GhostButton } from "@/components/athena/ui/Button";

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (signature: string) => Promise<void>;
  opportunityTitle: string;
  opportunityCompany: string;
  applicantName: string;
  isSubmitting?: boolean;
}

export const SignOffModal: React.FC<SignOffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  opportunityTitle,
  opportunityCompany,
  applicantName,
  isSubmitting = false,
}) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setErrorMsg("You must check the Human Authorization checkbox before Athena can submit on your behalf.");
      return;
    }
    if (!typedSignature.trim()) {
      setErrorMsg("Please enter your legal signature name.");
      return;
    }

    setErrorMsg(null);
    await onSubmit(typedSignature);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" data-testid="sign-off-modal">
      <div className="bg-surface-white border border-slate rounded-xl max-w-md w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-signoff-red text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">
                Human Sign-Off & Authorization
              </h3>
              <p className="text-[11px] text-white/80">
                {opportunityTitle} at {opportunityCompany}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target Role */}
          <div className="bg-signoff-red/10 border border-signoff-red/30 p-3 rounded-lg text-xs">
            <span className="text-[10px] font-mono uppercase text-signoff-red font-bold">
              Target Opportunity
            </span>
            <div className="font-bold text-ink mt-0.5">{opportunityTitle}</div>
            <div className="text-text-secondary text-[11px]">{opportunityCompany}</div>
          </div>

          {/* Legal Text */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-signoff-red font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-signoff-red" />
              <span>MANDATORY HUMAN SIGN-OFF AUTHORIZATION</span>
            </div>

            <p className="text-xs text-red-950 leading-relaxed">
              Athena requires your explicit authorization before acting as your digital agent to submit this application.
              By checking the box below and typing your legal signature name, you authorize Athena to sign and submit
              this application on your behalf with your legal credentials. This constitutes a legally binding digital
              power-of-attorney for this specific application only.
            </p>

            {/* Checkbox */}
            <label className="flex items-start gap-2 text-xs font-semibold text-red-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAuthorized}
                onChange={(e) => setIsAuthorized(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-signoff-red border-signoff-red/30 rounded focus:ring-signoff-red"
              />
              <span>
                I, <strong>{applicantName}</strong>, hereby formally authorize Athena to sign and submit this
                application on my behalf with my legal credentials.
              </span>
            </label>

            {/* Digital Signature Field */}
            <div className="pt-2 border-t border-red-200">
              <label className="block text-[11px] font-mono text-signoff-red uppercase font-bold mb-1">
                Type Legal Signature Name to Sign
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="e.g. Chifuniro Phiri"
                className="w-full px-3 py-2 bg-surface-white border border-signoff-red/50 rounded-md text-ink font-heading font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-signoff-red sunken"
              />
              <div className="text-[10px] text-red-800 font-mono mt-1 flex items-center justify-between">
                <span>Timestamp: {new Date().toLocaleTimeString()}</span>
                <span>Audit Token: SHA256-SIGN-{Date.now().toString(36).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-signoff-red shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate">
            <GhostButton
              type="button"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </GhostButton>
            <DangerButton
              type="submit"
              size="sm"
              disabled={isSubmitting || !isAuthorized}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Authorizing..." : "Authorize & Submit"}</span>
            </DangerButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignOffModal;