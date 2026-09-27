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
    { id: "all", label: "All Targeted Feeds", icon: Globe, color: "text-brand-orange" },
    { id: "lilongwe-local", label: "Lilongwe Local (MW)", icon: MapPin, color: "text-amber-led" },
    { id: "lilongwe-remote", label: "Lilongwe Remote Hub", icon: Building, color: "text-linkedin-blue" },
    { id: "international-remote", label: "International Remote", icon: Globe, color: "text-success-emerald" },
  ] as const;

  const categories = [
    { id: "all", label: "All", activeColor: "bg-chassis-active text-white border-l-2 border-brand-orange", inactiveColor: "text-chassis-muted hover:bg-chassis-active hover:text-chassis-primary" },
    { id: "job", label: "Jobs", activeColor: "bg-brand-orange text-white", inactiveColor: "text-chassis-muted hover:bg-brand-orange/10 hover:text-brand-orange" },
    { id: "consultancy", label: "Consultancies", activeColor: "bg-signoff-red text-white", inactiveColor: "text-chassis-muted hover:bg-signoff-red/10 hover:text-signoff-red" },
  ] as const;

  return (
    <div className="space-y-4 p-4 bg-chassis-raised border border-chassis rounded-xl">
      {/* Scope Filters */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-chassis-low uppercase tracking-wider flex items-center justify-between">
          <span>Target Scopes</span>
          <span className="text-[10px] font-mono text-brand-orange">Lilongwe / Global</span>
        </h4>
        {scopes.map(({ id, label, icon: Icon, color }) => {
          const isActive = selectedScope === id;
          return (
            <button
              key={id}
              onClick={() => onSelectScope(id as OpportunityScope | "all")}
              data-testid={`scope-${id}`}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all tactile ${
                isActive
                  ? "bg-chassis-active text-chassis-primary border-l-2 border-brand-orange"
                  : "text-chassis-muted hover:bg-chassis-active hover:text-chassis-primary"
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
      <div className="pt-4 border-t border-chassis">
        <h4 className="text-xs font-semibold text-chassis-low uppercase tracking-wider mb-2">Category</h4>
        <div className="grid grid-cols-3 gap-1">
          {categories.map(({ id, label, activeColor, inactiveColor }) => {
            const isActive = selectedCategory === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCategory(id as OpportunityCategory | "all")}
                className={`py-1.5 rounded font-medium text-xs transition-all tactile ${isActive ? activeColor : inactiveColor}`}
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