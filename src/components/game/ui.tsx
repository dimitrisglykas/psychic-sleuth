import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language";
import { translate } from "@/game/language";

export function Rich({ text }: { text: string }) {
  const clean = translate(text, useLanguage());
  return <>{clean.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <strong key={i} className="font-semibold text-amber-soft">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>;
}

export function Overlay({ onClose, children, className, label }: { onClose: () => void; children: ReactNode; className?: string; label: string }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="game-overlay fixed inset-0 z-[150] overflow-y-auto overscroll-contain bg-background/85 p-4 backdrop-blur-md animate-in fade-in sm:p-6" onClick={onClose}>
      <div className={cn("relative mx-auto my-2 w-full min-w-0 max-w-lg rounded-md border bg-panel p-4 shadow-2xl animate-in zoom-in-95 sm:p-6", className)} onClick={(e) => e.stopPropagation()}>
        <div className="relative z-10 flex justify-end border-b bg-panel p-2"><Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={onClose} aria-label="Close"><X /></Button></div>
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
