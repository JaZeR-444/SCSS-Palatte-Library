"use client";

import { BrandSystem, RoleGroup, SemanticRole } from "@/types/brand-system";
import { readableOn } from "@/utils/brand-system";
import { showToast } from "@/utils/toast";
import { Copy } from "lucide-react";

const GROUP_ORDER: RoleGroup[] = [
  "Brand",
  "Surface",
  "Text",
  "Line",
  "State",
  "Utility",
  "Data-viz",
];

export function SemanticRoles({
  system,
  overrides,
}: {
  system: BrandSystem;
  /** Active-mode color map; inline edits override each role's swatch. */
  overrides?: Record<string, string>;
}) {
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    roles: system.rolesList
      .filter((r) => r.group === g)
      .map((r) =>
        overrides?.[r.key] && overrides[r.key] !== r.hex
          ? { ...r, hex: overrides[r.key] }
          : r,
      ),
  })).filter((x) => x.roles.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(({ group, roles }) => (
        <div key={group} className="space-y-2.5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {group}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {roles.map((role) => (
              <RoleCard key={role.key} role={role} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleCard({ role }: { role: SemanticRole }) {
  const base = role.hex.slice(0, 7);
  const fg = readableOn(base);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(
          `--${role.key}: ${role.hex.toLowerCase()};`,
        );
        showToast(`--${role.key} copied!`);
      }}
      className="group flex items-stretch gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-left transition-all hover:shadow-md cursor-copy"
      title={role.description}
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-black/10"
        style={{ backgroundColor: base, color: fg }}
      >
        <span className="text-[10px] font-black opacity-80">Aa</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-black text-gray-900 dark:text-white">
            {role.label}
          </p>
          {role.derived && (
            <span className="rounded bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 text-[8px] font-black uppercase text-amber-500">
              derived
            </span>
          )}
        </div>
        <code className="block text-[10px] font-mono text-gray-400">
          --{role.key}
        </code>
        <div className="mt-0.5 flex items-center gap-1">
          <code className="text-[10px] font-mono uppercase text-gray-500 dark:text-gray-400">
            {role.hex.toLowerCase()}
          </code>
          <Copy className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );
}
