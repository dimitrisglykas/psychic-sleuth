import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Rich({ text }: { text: string }) {
  const clean = text.replace(/[\u2014\u2013]/g, ",");
  return <>{clean.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <strong key={i} className="font-semibold text-amber-soft">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>;
}

export function Overlay({ onClose, children, className, label }: { onClose: () => void; children: ReactNode; className?: string; label: string }) {
  return (
    <div role="dialog" aria-label={label} className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/85 p-3 backdrop-blur-md animate-in fade-in sm:items-center sm:p-6" onClick={onClose}>
      <div className={cn("relative w-full max-w-lg rounded-md border bg-panel p-5 shadow-2xl animate-in zoom-in-95", className)} onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10" onClick={onClose} aria-label="Close"><X /></Button>
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{children}</p>;
}

export function StressBar({ value, thin }: { value: number; thin?: boolean }) {
  return <div className={cn("overflow-hidden rounded-full bg-muted", thin ? "h-1" : "h-1.5")}><div className={cn("stress-pulse h-full transition-all duration-700", value >= 75 ? "bg-destructive" : "bg-primary")} style={{ width: `${value}%` }} /></div>;
}

export const stressLabel = (v: number) => (v >= 75 ? "Breaking" : v >= 50 ? "Rattled" : "Composed");
