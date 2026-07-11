"use client";

import { useEffect, useRef } from "react";

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show on desktop
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

    const glow = glowRef.current;
    if (!glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Direct DOM mutation for style updates bypasses React render tree
      // and keeps CPU/GPU load near zero!
      glow.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
      glow.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      if (glow) glow.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed pointer-events-none z-[9999] opacity-0 transition-opacity duration-300"
      style={{
        left: 0,
        top: 0,
        width: 400,
        height: 400,
        background:
          "radial-gradient(circle, rgba(59,99,247,0.06) 0%, transparent 70%)",
        willChange: "transform, opacity", // Hint to GPU to composite this layer
      }}
    />
  );
}
