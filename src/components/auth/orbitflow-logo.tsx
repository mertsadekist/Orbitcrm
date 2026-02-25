import { Orbit } from "lucide-react";

export function OrbitFlowLogo() {
  return (
    <div className="flex items-center gap-2">
      <Orbit className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      <span className="text-2xl font-bold tracking-tight">
        Orbit<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
      </span>
    </div>
  );
}
