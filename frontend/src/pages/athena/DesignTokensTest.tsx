import React, { useState } from "react";
import { ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, Globe, Briefcase, FileText, Receipt, Workflow, User, Settings, Compass } from "lucide-react";
import { MetricCard, MetricCardLarge, StatCounter } from "@/components/athena/MetricCard";
import { ATSGauge, MiniATSGauge } from "@/components/athena/ATSGauge";
import { Modal } from "@/components/athena/ui";
import { cn } from "@/lib/athena/utils";

export const DesignTokensTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      {/* ===== COLOR PALETTE ===== */}
      <section className="space-y-6">
        <h2 className="font-heading text-2xl font-bold text-ink">1. Color Palette</h2>
        
        {/* Brand & Accent */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Brand & Accent</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: "Brand Orange", class: "bg-brand-orange", text: "text-white", value: "#F97316" },
              { name: "Brand Orange Hover", class: "bg-brand-orange-hover", text: "text-white", value: "#EA580C" },
              { name: "Amber LED", class: "bg-amber-led", text: "text-chassis-base", value: "#FFA928" },
              { name: "Sign-Off Red", class: "bg-signoff-red", text: "text-white", value: "#DC2626" },
              { name: "Sign-Off Red Hover", class: "bg-signoff-red-hover", text: "text-white", value: "#B91C1C" },
              { name: "LinkedIn Blue", class: "bg-linkedin-blue", text: "text-white", value: "#0A66C2" },
              { name: "Success Emerald", class: "bg-success-emerald", text: "text-white", value: "#10B981" },
            ].map((c) => (
              <div key={c.name} className={`p-6 rounded-xl ${c.class} ${c.text} space-y-2`}>
                <div className="font-mono text-[10px] uppercase tracking-wider opacity-80">{c.value}</div>
                <div className="font-semibold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chassis (Dark) */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Chassis (Dark Sidebar)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Chassis Base", class: "bg-chassis-base", text: "text-chassis-primary", value: "#141619" },
              { name: "Sidebar Frame", class: "bg-sidebar-frame", text: "text-chassis-primary", value: "#1E2024" },
              { name: "Chassis Raised", class: "bg-chassis-raised", text: "text-chassis-primary", value: "#24272F" },
              { name: "Chassis Active", class: "bg-chassis-active", text: "text-chassis-primary", value: "#2A2E37" },
              { name: "Chassis Border", class: "bg-chassis-border", text: "text-chassis-primary", value: "#2D3139" },
              { name: "Chassis Border Subtle", class: "bg-chassis-border-subtle", text: "text-chassis-primary", value: "#3E4452" },
            ].map((c) => (
              <div key={c.name} className={`p-6 rounded-xl ${c.class} ${c.text} space-y-2 border border-chassis-border`}>
                <div className="font-mono text-[10px] uppercase tracking-wider opacity-80">{c.value}</div>
                <div className="font-semibold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas (Light) */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Canvas (Light Workspace)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Canvas BG", class: "bg-canvas", text: "text-ink", value: "#F4F5F7" },
              { name: "Surface White", class: "bg-surface-white", text: "text-ink", value: "#FFFFFF" },
              { name: "Surface Muted", class: "bg-surface-muted", text: "text-ink", value: "#F8F9FA" },
              { name: "Surface Dark Inset", class: "bg-surface-dark-inset", text: "text-white", value: "#18181B" },
              { name: "Border Slate", class: "bg-canvas border border-slate", text: "text-ink", value: "#E2E8F0" },
              { name: "Border Slate Medium", class: "bg-canvas border border-slate-medium", text: "text-ink", value: "#CBD5E1" },
            ].map((c) => (
              <div key={c.name} className={`p-6 rounded-xl ${c.class} ${c.text} space-y-2 ${c.class.includes('border') ? '' : 'border border-slate'}`}>
                <div className="font-mono text-[10px] uppercase tracking-wider opacity-80">{c.value}</div>
                <div className="font-semibold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Tints */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Semantic Status Tints (7 variants)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Critical Match (≥90%)", class: "tint-critical", bg: "#FFFBF7", border: "#F97316", text: "#EA580C" },
              { name: "Flagged Review (80-89%)", class: "tint-flagged", bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
              { name: "Human Sign-Off Required", class: "tint-signoff", bg: "#FFF5F5", border: "#FECACA", text: "#991B1B" },
              { name: "Submitted / Verified", class: "tint-submitted", bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
              { name: "Consultancy Mandate", class: "tint-consultancy", bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B" },
              { name: "Job Position", class: "tint-job", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
              { name: "LinkedIn Integration", class: "tint-linkedin", bg: "#F0F7FD", border: "#B8D7F2", text: "#0A66C2" },
            ].map((t) => (
              <div key={t.name} className={`p-5 rounded-xl border-2 ${t.class} space-y-2`}>
                <div className="font-semibold">{t.name}</div>
                <div className="font-mono text-[10px] space-y-1">
                  <div>bg: <span className="font-normal">{t.bg}</span></div>
                  <div>border: <span className="font-normal">{t.border}</span></div>
                  <div>text: <span className="font-normal">{t.text}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TYPOGRAPHY ===== */}
      <section className="space-y-6 border-t border-slate pt-6">
        <h2 className="font-heading text-2xl font-bold text-ink">2. Typography System</h2>
        
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Font Families</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Brand (Cinzel)", class: "font-brand", sample: "ATHENA", fallback: "Georgia, serif" },
              { name: "Heading (Lora)", class: "font-heading", sample: "Pipeline Dashboard", fallback: "Georgia, serif" },
              { name: "Body (Plus Jakarta Sans)", class: "font-body", sample: "Primary UI text for all buttons, navigation, cards", fallback: "system-ui" },
              { name: "Mono (Cascadia Code)", class: "font-mono", sample: "ATS: 94% | SHA-256 Hash", fallback: "ui-monospace" },
            ].map((f) => (
              <div key={f.name} className="p-5 bg-surface-white border border-slate rounded-xl space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-secondary">{f.name}</div>
                <div className={`${f.class} text-lg`}>{f.sample}</div>
                <div className="text-[10px] text-secondary font-mono">Fallback: {f.fallback}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Type Scale Hierarchy</h3>
          <div className="space-y-3">
            {[
              { class: "text-candidate-name", label: "Candidate Name (Document)", size: "24-30px", weight: "Bold", family: "Lora" },
              { class: "text-view-heading", label: "View / Modal Heading", size: "18px", weight: "Bold", family: "Lora" },
              { class: "text-card-title", label: "Card / Job Title", size: "14px", weight: "Bold", family: "Plus Jakarta Sans" },
              { class: "text-body-primary", label: "Primary Body Text", size: "12px", weight: "Regular", family: "Plus Jakarta Sans" },
              { class: "text-ui-secondary", label: "Small UI / Secondary", size: "11px", weight: "Medium", family: "Plus Jakarta Sans" },
              { class: "text-micro-badge", label: "Micro Badges / Mono Tags", size: "10px", weight: "Semi-Bold", family: "Monospace" },
              { class: "text-numeric-readout", label: "Numeric Readouts / Timers", size: "24px", weight: "Bold", family: "Monospace" },
            ].map((t) => (
              <div key={t.label} className="p-4 bg-surface-white border border-slate rounded-xl flex items-center justify-between">
                <div className={`${t.class}`}>{t.label} — Sample Text 123%</div>
                <div className="text-right text-xs text-secondary font-mono">
                  <div>{t.size}</div>
                  <div>{t.weight} • {t.family}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPACING & RADII ===== */}
      <section className="space-y-6 border-t border-slate pt-6">
        <h2 className="font-heading text-2xl font-bold text-ink">3. Spacing, Radii & Shadows</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-ink">Spacing Scale (4px base)</h3>
            <div className="space-y-2">
              {[
                "spacing-1 (4px)", "spacing-2 (8px)", "spacing-3 (12px)", "spacing-4 (16px)",
                "spacing-5 (20px)", "spacing-6 (24px)", "spacing-8 (32px)", "spacing-10 (40px)",
                "spacing-12 (48px)", "spacing-16 (64px)"
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-3 p-3 bg-surface-white border border-slate rounded-lg">
                  <div className="w-32 h-6 bg-chassis-base rounded font-mono text-[10px] flex items-center justify-center text-chassis-primary">
                    {s}
                  </div>
                  <div className="flex-1 h-6 bg-chassis-border-subtle/30 rounded" style={{ width: `${(i + 1) * 32}px` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-ink">Border Radii</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Pill / Indicator", class: "rounded-full", size: "9999px" },
                { name: "Badge / Tag", class: "rounded-md", size: "6px" },
                { name: "Button", class: "rounded-lg", size: "8px" },
                { name: "Standard Card", class: "rounded-xl", size: "12px" },
                { name: "Modal Window", class: "rounded-2xl", size: "16px" },
              ].map((r) => (
                <div key={r.name} className="p-4 bg-surface-white border border-slate rounded-lg space-y-1">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="font-mono text-[10px] text-secondary">{r.size}</div>
                  <div className={`h-8 ${r.class} bg-chassis-base`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Shadow Primitives</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: "2xs", class: "shadow-2xs" },
              { name: "xs", class: "shadow-xs" },
              { name: "md", class: "shadow-md" },
              { name: "2xl", class: "shadow-2xl" },
              { name: "raised", class: "raised bg-chassis-base text-chassis-primary" },
              { name: "sunken", class: "sunken text-chassis-primary" },
              { name: "glow-amber", class: "glow-amber bg-chassis-base text-chassis-primary" },
              { name: "tactile (hover)", class: "tactile bg-surface-white border border-slate" },
            ].map((s) => (
              <div key={s.name} className={`p-5 ${s.class} rounded-xl space-y-2`}>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="font-mono text-[10px] text-secondary">Hover for tactile</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPONENTS ===== */}
      <section className="space-y-6 border-t border-slate pt-6">
        <h2 className="font-heading text-2xl font-bold text-ink">4. Component Primitives</h2>

        {/* Buttons */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Button Variants</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Primary", class: "btn btn-primary" },
              { label: "Accent (Orange)", class: "btn btn-accent" },
              { label: "Danger (Red)", class: "btn btn-danger" },
              { label: "LinkedIn", class: "btn btn-linkedin" },
              { label: "Success", class: "btn btn-success" },
              { label: "Outline", class: "btn btn-outline" },
              { label: "Ghost", class: "btn btn-ghost" },
            ].map((b) => (
              <button key={b.label} className={`${b.class} tactile`}>{b.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary btn-sm tactile">Small</button>
            <button className="btn btn-primary btn-md tactile">Medium</button>
            <button className="btn btn-primary btn-lg tactile">Large</button>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Badge Variants (7 semantic)</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Critical", class: "badge badge-critical" },
              { label: "Flagged", class: "badge badge-flagged" },
              { label: "Sign-Off", class: "badge badge-signoff" },
              { label: "Submitted", class: "badge badge-submitted" },
              { label: "Consultancy", class: "badge badge-consultancy" },
              { label: "Job", class: "badge badge-job" },
              { label: "LinkedIn", class: "badge badge-linkedin" },
            ].map((b) => (
              <span key={b.label} className={b.class}>{b.label}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="badge badge-critical text-micro-badge">Micro</span>
            <span className="badge badge-flagged">Standard</span>
            <span className="badge badge-signoff text-lg px-3 py-1">Large</span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Metric Cards (5 semantic variants)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard title="Discovered" value="1,247" subtitle="new this week" variant="discovered" trend="up" />
            <MetricCard title="ATS ≥ 90%" value="342" subtitle="Critical Match" variant="critical" trend="up" />
            <MetricCard title="ATS 80-89%" value="521" subtitle="Flagged Review" variant="flagged" trend="stable" />
            <MetricCard title="Sign-Off Pending" value="28" subtitle="Human Required" variant="signoff" trend="down" />
            <MetricCard title="Submitted" value="187" subtitle="This Month" variant="submitted" trend="up" />
          </div>
        </div>

        {/* ATS Gauges */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">ATS Gauges (3 tiers, 3 sizes)</h3>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs text-secondary">Critical (≥90%)</span>
              <ATSGauge score={94} size={120} tier="critical" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs text-secondary">Flagged (80-89%)</span>
              <ATSGauge score={85} size={120} tier="flagged" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs text-secondary">{'Standard (<80%)'}</span>
              <ATSGauge score={72} size={120} tier="standard" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-secondary">sm (40px)</span>
              <MiniATSGauge score={94} size={40} tier="critical" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-secondary">md (80px)</span>
              <MiniATSGauge score={85} size={80} tier="flagged" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-secondary">lg (120px)</span>
              <MiniATSGauge score={72} size={120} tier="standard" />
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Toast Variants</h3>
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="toast toast-info">
              <span className="font-mono text-[10px]">INFO</span>
              <span>New scrape completed — 47 jobs found</span>
            </div>
            <div className="toast toast-success">
              <span className="font-mono text-[10px]">SUCCESS</span>
              <span>Application submitted with receipt ATH-RCPT-884721</span>
            </div>
            <div className="toast toast-error">
              <span className="font-mono text-[10px]">ERROR</span>
              <span>Sign-off required before submission</span>
            </div>
          </div>
        </div>

        {/* Modal */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Modal Base (rounded-2xl, backdrop blur)</h3>
          <button className="btn btn-accent tactile" onClick={() => setIsModalOpen(true)}>
            Open Modal
          </button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Opportunity Detail"
            size="sm"
            data-testid="design-tokens-modal"
            footer={
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(false)}>
                  Confirm
                </button>
              </>
            }
          >
            <p className="text-body">This modal uses the base modal styles with 16px radius, backdrop blur, and scale-in animation.</p>
          </Modal>
        </div>
      </section>

      {/* ===== NAVIGATION & LAYOUT ===== */}
      <section className="space-y-6 border-t border-slate pt-6">
        <h2 className="font-heading text-2xl font-bold text-ink">5. Navigation & Layout Components</h2>

        {/* Nav Items */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Left Sidebar Nav Items</h3>
          <div className="bg-sidebar-frame rounded-xl p-4 space-y-1 w-68">
            {[
              { id: 'dashboard', label: 'Pipeline & Command', icon: Compass, badge: 'Live' },
              { id: 'jobs', label: 'Scraper & Discovery', icon: Briefcase, badge: 'Live' },
              { id: 'documents', label: 'Pristine Document Studio', icon: FileText, badge: '1/2 Col' },
              { id: 'form_filler', label: 'Online Forms & Sign-Off', icon: CheckCircle2, badge: 'Auth' },
              { id: 'receipts', label: 'Receipts & Follow-ups', icon: Receipt },
              { id: 'n8n', label: 'n8n Workflow Nodes', icon: Workflow, badge: 'Plus' },
              { id: 'profile', label: 'Applicant Skills & Profile', icon: User },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-chassis-active text-chassis-primary">
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Breadcrumb (Top App Bar)</h3>
          <div className="bg-surface-white/90 backdrop-blur-md border-b border-slate px-6 py-3 flex items-center gap-2">
            <span className="font-brand font-bold text-sm tracking-wider text-ink">ATHENA</span>
            <ChevronRight className="w-3.5 h-3.5 text-secondary" />
            <span className="font-semibold text-secondary">Pipeline & Command</span>
            <ChevronRight className="w-3.5 h-3.5 text-secondary" />
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-medium">
              Scope: Lilongwe & Global
            </span>
          </div>
        </div>

        {/* Top Bar Status */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-ink">Top Bar Status Indicators</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-secondary font-mono bg-surface-muted px-2.5 py-1 rounded-md border border-slate">
              <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse-custom" />
              <span>Lilongwe Gateway: Active</span>
            </div>
            <button className="px-3 py-1.5 bg-surface-dark-inset hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-orange" />
              <span>Pristine Document Studio</span>
            </button>
            <button className="p-2 rounded-lg text-secondary hover:text-ink hover:bg-surface-muted tactile">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== MOTION ===== */}
      <section className="space-y-6 border-t border-slate pt-6">
        <h2 className="font-heading text-2xl font-bold text-ink">6. Motion & Animation Tokens</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Engine Pulse", class: "w-3 h-3 rounded-full bg-success-emerald animate-pulse-custom", desc: "2000ms cubic-bezier(0.4, 0, 0.6, 1)" },
            { name: "Ping", class: "w-3 h-3 rounded-full bg-brand-orange animate-ping-custom", desc: "1000ms cubic-bezier(0, 0, 0.2, 1)" },
            { name: "Toast Entry", class: "w-3 h-3 rounded-full bg-amber-led animate-slide-in-from-top", desc: "300ms ease-out" },
            { name: "Transition Fast", class: "w-3 h-3 rounded-full bg-chassis-base", desc: "120ms cubic-bezier(0.2, 0, 0, 1)" },
            { name: "Transition Normal", class: "w-3 h-3 rounded-full bg-chassis-base", desc: "200ms cubic-bezier(0.2, 0, 0, 1)" },
            { name: "Transition Slow", class: "w-3 h-3 rounded-full bg-chassis-base", desc: "350ms cubic-bezier(0.16, 1, 0.3, 1)" },
          ].map((m) => (
            <div key={m.name} className="p-4 bg-surface-white border border-slate rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className={m.class} />
                <div>
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="font-mono text-[10px] text-secondary">{m.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-amber-led/10 border border-amber-led/30 rounded-xl text-amber-led">
          <strong>Reduced Motion:</strong> All animations clamp to 0.01ms when prefers-reduced-motion is set.
        </div>
      </section>
    </div>
  );
};

export default DesignTokensTest;