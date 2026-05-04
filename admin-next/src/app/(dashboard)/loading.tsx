import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Synchronizing Data...
        </p>
      </div>
    </div>
  );
}
