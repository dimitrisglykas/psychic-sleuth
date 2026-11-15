import { Maximize, Minimize } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync); sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!supported) return null;
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setError("");
    } catch { setError("Fullscreen is unavailable in this browser window."); }
  };
  return <div className="relative"><Button variant="ghost" size="icon" onClick={() => void toggle()} aria-label={active ? "Exit fullscreen" : "Enter fullscreen"} title={active ? "Exit fullscreen" : "Enter fullscreen"}>{active ? <Minimize /> : <Maximize />}</Button>{error && <p role="status" className="absolute right-0 top-full z-50 w-48 border bg-popover p-2 text-xs">{error}</p>}</div>;
}