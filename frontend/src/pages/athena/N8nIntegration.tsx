import React, { useState } from "react";
import {
  Workflow,
  CheckCircle2,
  Clock,
  Play,
  Copy,
  ExternalLink,
  Code,
  ShieldCheck,
  Zap,
  ArrowRight,
  Send,
} from "lucide-react";
import { cn } from "../../lib/athena/utils";
import { dispatchN8n } from "../../lib/athena/api";
import { Button, GhostButton, AccentButton, OutlineButton, PrimaryButton } from "@/components/athena/ui/Button";
import { Badge } from "@/components/athena/ui/Badge";

export const N8nIntegration: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/webhooks/n8n");
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        event: "cron.4hour_tick",
        targetLocations: ["Lilongwe, Malawi", "Remote Malawi", "Global Remote"],
        categories: ["job", "consultancy"],
        minimumAtsAutoApply: 90,
        applicantId: "chifuniro-phiri-mw",
      },
      null,
      2
    )
  );
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTestWebhook = async () => {
    setIsTriggering(true);
    try {
      const res = await dispatchN8n({
        event_type: "cron.4hour_tick",
        payload: JSON.parse(testPayload),
        webhook_url: webhookUrl,
      });
      setExecutionResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setExecutionResult(JSON.stringify({ error: err.message, status: "n8n trigger processed" }, null, 2));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-white border border-slate p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-ink">
                n8n Workflow Automation Engine
              </h3>
              <Badge variant="submitted" size="micro">Webhook Node Active</Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Trigger Athena from external n8n workflows, cron nodes, or orchestrate autonomous application pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* n8n Status Pill */}
          <span className="flex items-center gap-1.5 text-xs font-medium text-chassis-primary" data-testid="n8n-status-pill">
            <span className="w-2 h-2 rounded-full bg-success-emerald" />
            <span>Connected</span>
          </span>
          <OutlineButton size="sm" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
            <span>{copiedUrl ? "Copied Endpoint!" : "Copy Webhook URL"}</span>
          </OutlineButton>
        </div>
      </div>

      {/* Visual n8n Canvas Node Pipeline */}
      <div className="bg-surface-dark-inset border border-slate rounded-xl p-6 text-white space-y-4 shadow-xs" data-testid="n8n-topology">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-text-secondary">
            <Zap className="w-4 h-4 text-brand-orange" />
            <span>Active n8n Workflow Topology</span>
          </div>
          <Badge variant="critical" size="micro">q=4 hours</Badge>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Node 1: 4h Cron Scrape */}
          <div className="bg-chassis-raised border border-chassis p-3 rounded-lg space-y-2 relative" data-testid="n8n-node" data-label="Cron Scrape (4 Hours)">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="critical" size="micro">Trigger</Badge>
              <Clock className="w-3.5 h-3.5 text-success-emerald" />
            </div>
            <div className="font-semibold text-xs text-white" data-testid="n8n-node-label">Cron Scrape (4 Hours)</div>
            <div className="text-[10px] text-text-secondary">Lilongwe & Global Crawl</div>
          </div>

          {/* Node 2: Scraper Match */}
          <div className="bg-chassis-raised border border-chassis p-3 rounded-lg space-y-2" data-testid="n8n-node" data-label="Scrape Match Node">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="job" size="micro">HTTP Request</Badge>
              <Workflow className="w-3.5 h-3.5 text-linkedin-blue" />
            </div>
            <div className="font-semibold text-xs text-white" data-testid="n8n-node-label">Scrape Match Node</div>
            <div className="text-[10px] text-text-secondary">LinkedIn, Upwork, Portals</div>
          </div>

          {/* Node 3: ATS Score & Tailor */}
          <div className="bg-chassis-raised border border-chassis p-3 rounded-lg space-y-2" data-testid="n8n-node" data-label="ATS Score & Tailor">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="flagged" size="micro">Gemini AI</Badge>
              <Code className="w-3.5 h-3.5 text-amber-led" />
            </div>
            <div className="font-semibold text-xs text-white" data-testid="n8n-node-label">ATS Score & Tailor</div>
            <div className="text-[10px] text-text-secondary">0 - 100% Evaluation</div>
          </div>

          {/* Node 4: Sign-off Submit Gate */}
          <div className="bg-chassis-raised border border-chassis p-3 rounded-lg space-y-2" data-testid="n8n-node" data-label="Sign-off Submit Gate">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="critical" size="micro">Switch</Badge>
              <Zap className="w-3.5 h-3.5 text-brand-orange" />
            </div>
            <div className="font-semibold text-xs text-white" data-testid="n8n-node-label">Sign-off Submit Gate</div>
            <div className="text-[10px] text-text-secondary">≥90 Auto | 80-89 Flag</div>
          </div>

          {/* Node 5: Human Sign-off n8n */}
          <div className="bg-chassis-raised border border-signoff-red/50 p-3 rounded-lg space-y-2" data-testid="n8n-node" data-label="Human Sign-off n8n Gate">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="signoff" size="micro">Wait / Webhook</Badge>
              <ShieldCheck className="w-3.5 h-3.5 text-signoff-red" />
            </div>
            <div className="font-semibold text-xs text-white" data-testid="n8n-node-label">Human Sign-off n8n Gate</div>
            <div className="text-[10px] text-signoff-red">Mandatory Authorization</div>
          </div>
        </div>
      </div>

      {/* Webhook Tester & Code Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Webhook Configuration & Payload Tester */}
        <div className="bg-surface-white border border-slate rounded-xl p-4 space-y-3 shadow-xs" data-testid="n8n-webhook-tester">
          {/* Webhook URL Input */}
          <div className="space-y-2">
            <label className="font-bold text-xs text-ink uppercase tracking-wider font-mono block">
              n8n Webhook URL
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              data-testid="n8n-webhook-url"
              className="w-full font-mono text-xs bg-surface-dark-inset text-emerald-400 p-3 rounded-lg border border-slate focus:outline-none focus:ring-2 focus:ring-brand-orange sunken"
              placeholder="https://your-n8n-instance.com/webhook/athena"
            />
          </div>

          {/* Payload Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-ink uppercase tracking-wider font-mono">
                n8n Inbound Webhook Payload
              </h4>
              <GhostButton size="sm" data-testid="test-payload-btn">
                Test Payload
              </GhostButton>
            </div>

            <textarea
              rows={10}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              data-testid="payload-editor"
              className="w-full font-mono text-xs bg-surface-dark-inset text-emerald-400 p-3 rounded-lg border border-slate focus:outline-none focus:ring-2 focus:ring-brand-orange sunken"
            />

            <AccentButton
              onClick={handleTestWebhook}
              disabled={isTriggering}
              data-testid="execute-webhook-btn"
              className="w-full"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isTriggering ? "Sending Trigger to Athena..." : "Fire n8n Webhook Trigger"}</span>
            </AccentButton>
          </div>
        </div>

        {/* Execution Output */}
        <div className="bg-surface-white border border-slate rounded-xl p-4 space-y-3 shadow-xs flex flex-col justify-between" data-testid="execution-response">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-ink uppercase tracking-wider font-mono">
                Athena Execution Response
              </h4>
              <Badge variant="submitted" size="micro">HTTP 200 OK</Badge>
            </div>

            <pre className="mt-3 font-mono text-xs bg-surface-dark-inset text-white p-3 rounded-lg border border-slate overflow-x-auto min-h-[200px] sunken">
              {executionResult ||
                `// Trigger the n8n webhook on the left to see live\n// pipeline execution response, newly crawled jobs,\n// and automated document status...`}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate text-[11px] text-text-secondary flex items-center justify-between">
            <span>Authentication: Bearer / Internal Webhook Token</span>
            <Badge variant="submitted" size="micro">Online & Ready</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nIntegration;