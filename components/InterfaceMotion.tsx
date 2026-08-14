"use client";

import { useEffect } from "react";

export function InterfaceMotion() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const updatePointer = (event: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
        const y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
        root.style.setProperty("--pointer-x", x.toFixed(4));
        root.style.setProperty("--pointer-y", y.toFixed(4));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.14 },
    );

    root.classList.add("motion-ready");
    document.querySelectorAll(".motion-rise").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add("is-visible");
      }
      observer.observe(element);
    });
    window.addEventListener("pointermove", updatePointer, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.classList.remove("motion-ready");
      window.removeEventListener("pointermove", updatePointer);
    };
  }, []);

  return null;
}
