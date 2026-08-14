"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Panel = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> & {
  userData: {
    baseY: number;
    drift: number;
    spin: number;
  };
};

export function CampusSignalScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const canUseWebGL = () => {
      const probe = document.createElement("canvas");
      return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
    };

    let renderer: THREE.WebGLRenderer;
    const originalConsoleError = console.error;
    try {
      if (!canUseWebGL()) {
        throw new Error("WebGL unavailable");
      }
      console.error = () => {};
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
      console.error = originalConsoleError;
    } catch {
      console.error = originalConsoleError;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      let fallbackFrame = 0;
      let fallbackAnimationId = 0;
      const resizeFallback = () => {
        const parent = canvas.parentElement;
        const width = parent?.clientWidth ?? window.innerWidth;
        const height = parent?.clientHeight ?? window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio, 1.8);
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      const drawFallback = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        context.clearRect(0, 0, width, height);
        const scroll = Math.min(window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1), 1);
        for (let index = 0; index < 8; index += 1) {
          const x = width * (0.18 + index * 0.095) - scroll * 70;
          const y = height * (0.24 + (index % 3) * 0.16) + Math.sin(fallbackFrame * 0.025 + index) * 10;
          context.save();
          context.translate(x, y);
          context.rotate(-0.2 + index * 0.045 + scroll * 0.35);
          context.fillStyle = index % 2 ? "rgba(236,254,255,0.72)" : "rgba(240,253,244,0.72)";
          context.strokeStyle = index % 2 ? "rgba(8,145,178,0.35)" : "rgba(5,150,105,0.35)";
          context.lineWidth = 1;
          context.roundRect(-56, -32, 112, 64, 12);
          context.fill();
          context.stroke();
          context.restore();
        }
        canvas.dataset.renderFrames = String(fallbackFrame);
        fallbackFrame += 1;
        fallbackAnimationId = requestAnimationFrame(drawFallback);
      };

      window.addEventListener("resize", resizeFallback);
      resizeFallback();
      drawFallback();
      return () => {
        cancelAnimationFrame(fallbackAnimationId);
        window.removeEventListener("resize", resizeFallback);
      };
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 8);
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const accentLight = new THREE.PointLight(0x06b6d4, 12, 18);
    accentLight.position.set(-4, -1, 4);
    scene.add(accentLight);

    const group = new THREE.Group();
    scene.add(group);

    const railMaterial = new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.24 });
    const railPoints = [
      new THREE.Vector3(-0.6, -2.1, -1.4),
      new THREE.Vector3(0.6, -0.3, -0.6),
      new THREE.Vector3(1.8, 1.1, 0.2),
      new THREE.Vector3(3.4, 0.1, -0.2),
      new THREE.Vector3(5.4, -1.4, -1),
    ];
    const rail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(railPoints), railMaterial);
    group.add(rail);

    const panels: Panel[] = [];
    const colors = [0xffffff, 0xe6fffb, 0xecfeff, 0xf0fdf4, 0xfffbeb];
    const positions = [
      [0.45, -1.65, -0.8],
      [1.2, 1.6, 0.4],
      [2.1, -0.1, -1.5],
      [2.8, 2.05, 0.1],
      [3.45, -1.15, -0.9],
      [4.1, 0.65, 0.6],
      [4.85, -0.25, -1.2],
      [5.35, 1.35, 0.2],
    ] as const;

    positions.forEach(([x, y, z], index) => {
      const geometry = new THREE.BoxGeometry(1.18, 0.74, 0.055);
      const material = new THREE.MeshStandardMaterial({
        color: colors[index % colors.length],
        roughness: 0.42,
        metalness: 0.06,
        transparent: true,
        opacity: 0.92,
      });
      const panel = new THREE.Mesh(geometry, material) as Panel;
      panel.position.set(x, y, z);
      panel.rotation.set(0.08 * (index % 3), -0.28 + index * 0.075, 0.08 - index * 0.018);
      panel.userData = {
        baseY: y,
        drift: 0.5 + index * 0.13,
        spin: index % 2 === 0 ? 1 : -1,
      };
      group.add(panel);
      panels.push(panel);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: index % 2 ? 0x0891b2 : 0x059669, transparent: true, opacity: 0.35 }),
      );
      edge.position.copy(panel.position);
      edge.rotation.copy(panel.rotation);
      panel.add(edge);
    });

    const ringGeometry = new THREE.TorusGeometry(1.55, 0.018, 8, 96);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.35, transparent: true, opacity: 0.42 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(2.35, -0.15, -1.8);
    ring.rotation.set(1.08, 0.12, 0.55);
    group.add(ring);

    const mouse = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateFromScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      return Math.min(window.scrollY / maxScroll, 1);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    let animationId = 0;
    const animate = () => {
      const time = performance.now() * 0.001;
      const scroll = updateFromScroll();
      group.rotation.y += ((mouse.x * 0.18 + scroll * 0.75) - group.rotation.y) * 0.04;
      group.rotation.x += ((-mouse.y * 0.08 + scroll * 0.18) - group.rotation.x) * 0.04;
      group.position.x = 0.9 + scroll * -0.75;
      group.position.y = scroll * 0.32;

      panels.forEach((panel, index) => {
        panel.position.y = panel.userData.baseY + Math.sin(time * 0.75 + panel.userData.drift) * 0.08;
        panel.rotation.y += 0.0018 * panel.userData.spin;
        panel.rotation.z += Math.sin(time * 0.6 + index) * 0.0008;
      });

      ring.rotation.z += 0.004;
      ring.rotation.x = 1.08 + Math.sin(time * 0.55) * 0.08;
      camera.position.x += (mouse.x * 0.28 - camera.position.x) * 0.035;
      camera.position.y += (0.4 - mouse.y * 0.16 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frame += 1;
      canvas.dataset.renderFrames = String(frame);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      rail.geometry.dispose();
      railMaterial.dispose();
      panels.forEach((panel) => {
        panel.geometry.dispose();
        panel.material.dispose();
      });
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, []);

  return (
    <div className="campus-signal-scene pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full opacity-45 sm:opacity-60" />
    </div>
  );
}
