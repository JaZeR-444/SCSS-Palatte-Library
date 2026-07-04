"use client";

import { useStudio } from "./studio-context";
import { Layout, MessageSquare, Rocket, ShoppingBag, Smartphone, Type } from "lucide-react";
import { UISelection } from "@/types/studio";

const SCENARIOS: { id: UISelection; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: Layout },
  { id: "social", label: "Social", icon: MessageSquare },
  { id: "landing", label: "Landing", icon: Rocket },
  { id: "commerce", label: "Commerce", icon: ShoppingBag },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "typography", label: "Typography", icon: Type },
];

export function ScenarioTabs() {
  const { activeScenario, setScenario } = useStudio();

  return (
    <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-x-auto subtle-scrollbar">
      {SCENARIOS.map((s) => {
        const Icon = s.icon;
        const isActive = activeScenario === s.id;

        return (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap
              ${isActive 
                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }
            `}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
