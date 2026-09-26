import React from "react";
import { Globe, MapPin, Building, Briefcase } from "lucide-react";
import { OpportunityScope, OpportunityCategory } from "../../lib/athena/types";

interface ScopeFilterProps {
  selectedScope: OpportunityScope | "all";
  onSelectScope: (scope: OpportunityScope | "all") => void;
  selectedCategory: OpportunityCategory | "all";
  onSelectCategory: (category: OpportunityCategory | "all") => void;
}

export const ScopeFilter: React.FC<ScopeFilterProps> = ({
  selectedScope,
  onSelectScope,
  selectedCategory,
  onSelectCategory,
}) => {
  const scopes = [
    { id: "all", label: "All Targeted Feeds", icon: Globe, color: "text-orange-500" },
    { id: "lilongwe-local", label: "Lilongwe Local (MW)", icon: MapPin, color: "text-amber-400" },
    { id: "lilongwe-remote", label: "Lilongwe Remote Hub", icon: Building, color: "text-blue-400" },
    { id: "international-remote", label: "International Remote", icon: Globe, color: "text-emerald-400" },
  ] as const;

  const categories = [
    { id: "all", label: "All", color: "bg-muted text-muted hover:bg-primary hover:text-white" },
    { id: "job", label: "Jobs", color: "bg-orange-500 text-white" },
    { id: "consultancy", label: "Consultancies", color: "bg-red-500 text-white" },
  ] as const;

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-xl">
      {/* Scope Filters */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
          <span>Target Scopes</span>
          <span className="text-[10px] font-mono text-orange-500">Lilongwe / Global</span>
        </h4>
        {scopes.map(({ id, label, icon: Icon, color }) => {
          const isActive = selectedScope === id;
          return (
            <button
              key={id}
              onClick={() => onSelectScope(id as OpportunityScope | "all")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white border-l-2 border-accent"
                  : "text-muted hover:bg-muted hover:text-text"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Toggle */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Category</h4>
        <div className="grid grid-cols-3 gap-1">
          {categories.map(({ id, label, color }) => {
            const isActive = selectedCategory === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCategory(id as OpportunityCategory | "all")}
                className={`py-1.5 rounded font-medium text-xs transition-all ${
                  isActive ? color : color.replace("bg-", "hover:bg-").replace("text-white", "text-muted")
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};