import React from "react";
import { X, MapPin, Briefcase, Building, DollarSign, Clock, Globe, CheckCircle2, AlertTriangle, ShieldCheck, Download, ExternalLink, FileText, Send, Sparkles, PenSquare } from "lucide-react";
import { Opportunity } from "../../lib/athena/types";
import { cn } from "../../lib/athena/utils";
import Modal from "@/components/athena/ui/Modal";
import { DangerButton, AccentButton, OutlineButton, GhostButton, PrimaryButton } from "@/components/athena/ui/Button";
import { Badge, StatusPill } from "@/components/athena/ui/Badge";
import { ATSGauge } from "@/components/athena/ATSGauge";

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onExportLinkedIn?: () => void;
  onInspectDocuments?: () => void;
  onSignOff?: () => void;
  onOpenFormFiller?: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onExportLinkedIn,
  onInspectDocuments,
  onSignOff,
  onOpenFormFiller,
}) => {
  if (!isOpen || !opportunity) return null;

  const getCategoryBadge = () => {
    return opportunity.category === "consultancy" ? (
      <Badge variant="consultancy" size="standard">Consultancy</Badge>
    ) : (
      <Badge variant="job" size="standard">Job Position</Badge>
    );
  };

  const getPlatformBadge = () => {
    return <Badge variant="job" size="micro">{opportunity.platform}</Badge>;
  };

  const getMatchTierBadge = () => {
    switch (opportunity.match_tier) {
      case "excellent":
        return <Badge variant="critical" size="standard">{opportunity.match_tier}</Badge>;
      case "good":
        return <Badge variant="flagged" size="standard">{opportunity.match_tier}</Badge>;
      case "fair":
        return <Badge variant="flagged" size="standard">{opportunity.match_tier}</Badge>;
      case "poor":
        return <Badge variant="job" size="standard">{opportunity.match_tier}</Badge>;
      default:
        return <Badge variant="job" size="standard">{opportunity.match_tier}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opportunity.title}
      size="xl"
      showCloseButton
      closeOnEscape
      closeOnOverlayClick
      data-testid="opportunity-detail-modal"
      footer={
        <div className="w-full flex items-center justify-end gap-3">
          <GhostButton onClick={onExportLinkedIn} size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Export to LinkedIn</span>
          </GhostButton>
          <OutlineButton onClick={onInspectDocuments} size="sm">
            <FileText className="w-3.5 h-3.5" />
            <span>Inspect Tailored Documents</span>
          </OutlineButton>
          <OutlineButton onClick={onOpenFormFiller} size="sm">
            <PenSquare className="w-3.5 h-3.5" />
            <span>Open Form Filler</span>
          </OutlineButton>
          <DangerButton onClick={onSignOff} size="sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sign-Off & Authorize</span>
          </DangerButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getCategoryBadge()}
              {getPlatformBadge()}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-surface-muted border border-slate text-text-secondary">
                {opportunity.location}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold text-ink">{opportunity.title}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {opportunity.company}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {opportunity.location}</span>
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {opportunity.salaryOrBudget}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {opportunity.postedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ATSGauge score={opportunity.atsScore || 0} size={80} strokeWidth={6} showLabel tier={opportunity.match_tier} />
          </div>
        </div>

        {/* Dehumanized Pitch */}
        {opportunity.dehumanizedPitch && (
          <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dehumanized Pitch</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{opportunity.dehumanizedPitch}</p>
          </div>
        )}

        {/* Full TOR / Description */}
        <section className="space-y-3">
          <h3 className="font-heading text-base font-bold text-ink">Terms of Reference / Description</h3>
          <div className="prose prose-sm text-text-secondary max-w-none bg-surface-muted p-4 rounded-lg border border-slate">
            <p className="whitespace-pre-wrap">{opportunity.description}</p>
          </div>
        </section>

        {/* Requirements Grid */}
        {(opportunity.requirements?.length ?? 0) > 0 && (
          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-ink">Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(opportunity.requirements ?? []).map((req, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-surface-white border border-slate rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{req}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ATS Gauge - Large */}
        <section className="space-y-3 pt-4 border-t border-slate">
          <h3 className="font-heading text-base font-bold text-ink">ATS Compatibility Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ATSGauge score={opportunity.atsScore || 0} size={100} tier={opportunity.match_tier} label="Overall" showLabel={true} />
            <div className="md:col-span-3 space-y-3">
              {[
                { label: 'Keyword Match', value: 85, color: '#FFA928' },
                { label: 'Semantic Similarity', value: 78, color: '#E63946' },
                { label: 'Experience Relevance', value: 82, color: '#67E8F9' },
                { label: 'Education Match', value: 75, color: '#34D399' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-36 font-body text-sm text-text-secondary">{item.label}</span>
                  <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="w-10 text-right font-heading font-bold text-sm text-ink">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default OpportunityDetailModal;