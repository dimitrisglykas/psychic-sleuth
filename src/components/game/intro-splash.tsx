import { useEffect, useRef, useState } from "react";
import { FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const canvasHost = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (localStorage.getItem("psychic-intro-seen")) return;
      localStorage.setItem("psychic-intro-seen", "true");
    } catch { /* Storage restrictions never block entry. */ }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let cleanup = () => {};
    void import("three").then((THREE) => {
      const host = canvasHost.current;
      if (cancelled || !host) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      host.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.z = 7;
      const color = getComputedStyle(host).color;
      const swatch = document.createElement("canvas"); swatch.width = 1; swatch.height = 1;
      const swatchContext = swatch.getContext("2d");
      if (!swatchContext) { renderer.dispose(); renderer.domElement.remove(); setVisible(false); return; }
      swatchContext.fillStyle = color; swatchContext.fillRect(0, 0, 1, 1);
      const pixel = swatchContext.getImageData(0, 0, 1, 1).data;
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255, THREE.SRGBColorSpace) });
      const group = new THREE.Group();
      scene.add(group);
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const ringGeometry = new THREE.TorusGeometry(0.48, 0.035, 6, 48);
      geometries.push(ringGeometry);
      group.add(new THREE.Mesh(ringGeometry, material));
      // The same eye silhouette as the game's header and favicon, in real 3D.
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.6, 0, 0), new THREE.Vector3(-0.8, 0.7, 0),
        new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(0.8, 0.7, 0),
        new THREE.Vector3(1.6, 0, 0), new THREE.Vector3(0.8, -0.7, 0),
        new THREE.Vector3(0, -0.9, 0), new THREE.Vector3(-0.8, -0.7, 0),
      ], true);
      const eyeGeometry = new THREE.TubeGeometry(curve, 64, 0.035, 6, true);
      geometries.push(eyeGeometry);
      group.add(new THREE.Mesh(eyeGeometry, material));
      const resize = () => {
        const width = host.clientWidth, height = host.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.position.z = camera.aspect < 0.7 ? 10 : 7;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host); resize();
      let pointer = 0;
      const move = (event: PointerEvent) => { pointer = (event.clientX / window.innerWidth - 0.5) * 0.4; };
      window.addEventListener("pointermove", move);
      const start = performance.now();
      renderer.setAnimationLoop(() => {
        const elapsed = (performance.now() - start) / 1000;
        group.rotation.y = Math.sin(elapsed * 2) * 0.4 + pointer;
        group.rotation.x = Math.cos(elapsed * 1.5) * 0.12;
        renderer.render(scene, camera);
      });
      cleanup = () => {
        renderer.setAnimationLoop(null); observer.disconnect();
        window.removeEventListener("pointermove", move);
        geometries.forEach((geometry) => geometry.dispose()); material.dispose();
        renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => setVisible(false));
    return () => { cancelled = true; cleanup(); };
  }, [visible]);

  if (!visible) return null;
  return <div className="intro-splash fixed inset-0 z-[180] overflow-hidden bg-background" role="dialog" aria-label="Psychic Sleuth intro" aria-modal="true">
    <div ref={canvasHost} className="absolute inset-0 text-primary" aria-hidden="true" />
    <div className="pointer-events-none absolute inset-x-4 bottom-[18%] text-center"><p className="font-display text-4xl sm:text-5xl">Psychic Sleuth</p><p className="mt-3 text-xs text-muted-foreground">Every lie leaves a trace.</p></div>
    <Button variant="ghost" size="sm" className="absolute right-4 top-4" onClick={() => setVisible(false)}><FastForward />Skip intro</Button>
  </div>;
}