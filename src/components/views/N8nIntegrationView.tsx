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

export const N8nIntegrationView: React.FC = () => {
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
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestWebhook = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/webhooks/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: testPayload,
      });
      const data = await res.json();
      setExecutionResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setExecutionResult(JSON.stringify({ error: err.message, status: "n8n trigger processed" }, null, 2));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#18181B] text-[#F97316] flex items-center justify-center font-bold">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-heading text-base font-bold text-[#18181B]">
                n8n Workflow Automation Engine
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Webhook Node Active
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Trigger Athena from external n8n workflows, cron nodes, or orchestrate autonomous application pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#F4F5F7] hover:bg-[#E2E8F0] text-xs font-medium rounded-lg border border-[#CBD5E1] text-[#18181B] flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{copiedUrl ? "Copied Endpoint!" : "Copy Webhook URL"}</span>
          </button>
        </div>
      </div>

      {/* Visual n8n Canvas Node Pipeline */}
      <div className="bg-[#18181B] border border-[#2D3139] rounded-xl p-6 text-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#94A3B8]">
            <Zap className="w-4 h-4 text-[#F97316]" />
            <span>Active n8n Workflow Topology</span>
          </div>
          <span className="text-[10px] font-mono text-[#FB923C] bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
            q=4 hours
          </span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Node 1: 4h Cron */}
          <div className="bg-[#24272F] border border-[#3E4452] p-3 rounded-lg space-y-2 relative">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-mono text-[10px]">Trigger</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-semibold text-xs text-white">Cron (4 Hours)</div>
            <div className="text-[10px] text-[#94A3B8]">Lilongwe & Global Crawl</div>
          </div>

          {/* Node 2: Scraper Aggregator */}
          <div className="bg-[#24272F] border border-[#3E4452] p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400 font-mono text-[10px]">HTTP Request</span>
              <Workflow className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="font-semibold text-xs text-white">Athena Scraper Node</div>
            <div className="text-[10px] text-[#94A3B8]">LinkedIn, Upwork, Portals</div>
          </div>

          {/* Node 3: Gemini ATS Evaluator */}
          <div className="bg-[#24272F] border border-[#3E4452] p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400 font-mono text-[10px]">Gemini AI</span>
              <Code className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="font-semibold text-xs text-white">ATS Semantic Scoring</div>
            <div className="text-[10px] text-[#94A3B8]">0 - 100% Evaluation</div>
          </div>

          {/* Node 4: Switch / Router */}
          <div className="bg-[#24272F] border border-[#3E4452] p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F97316] font-mono text-[10px]">Switch</span>
              <Zap className="w-3.5 h-3.5 text-[#F97316]" />
            </div>
            <div className="font-semibold text-xs text-white">ATS Decision Gate</div>
            <div className="text-[10px] text-[#94A3B8]">≥90 Auto | 80-89 Flag</div>
          </div>

          {/* Node 5: Human Gate & Dispatch */}
          <div className="bg-[#24272F] border border-red-800/80 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400 font-mono text-[10px]">Wait / Webhook</span>
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="font-semibold text-xs text-white">Human Sign-Off Gate</div>
            <div className="text-[10px] text-red-300">Mandatory Authorization</div>
          </div>
        </div>
      </div>

      {/* Webhook Tester & Code Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Payload */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#18181B] uppercase tracking-wider font-mono">
              n8n Inbound Webhook Payload
            </h4>
            <span className="text-[10px] font-mono text-[#64748B]">POST /api/webhooks/n8n</span>
          </div>

          <textarea
            rows={10}
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            className="w-full font-mono text-xs bg-[#18181B] text-emerald-400 p-3 rounded-lg border border-[#3E4452] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
          />

          <button
            onClick={handleTestWebhook}
            disabled={isTriggering}
            className="w-full py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isTriggering ? "Sending Trigger to Athena..." : "Fire n8n Webhook Trigger"}</span>
          </button>
        </div>

        {/* Execution Output */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#18181B] uppercase tracking-wider font-mono">
                Athena Execution Response
              </h4>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                HTTP 200 OK
              </span>
            </div>

            <pre className="mt-3 font-mono text-xs bg-[#F8F9FA] text-[#18181B] p-3 rounded-lg border border-[#E2E8F0] overflow-x-auto min-h-[200px]">
              {executionResult ||
                `// Trigger the n8n webhook on the left to see live\n// pipeline execution response, newly crawled jobs,\n// and automated document status...`}
            </pre>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Authentication: Bearer / Internal Webhook Token</span>
            <span className="font-mono text-emerald-700">Online & Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
