"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create a rotating 3D particle sphere
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Spherical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.6 + Math.random() * 0.4;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x20c9ad, // Clinical Teal
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // -------------------------------------------------------------
    // PROCEDURAL 3D WIREFRAME TOOTH GEOMETRY
    // -------------------------------------------------------------
    const toothGroup = new THREE.Group();

    // Material for the holographic wireframe tooth
    const toothMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b63f7, // Royal Indigo Accent
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    // 1. Crown Cusps (4 spheres at top of molar)
    const cuspSize = 0.75;
    const cuspGeom = new THREE.SphereGeometry(cuspSize, 8, 8);
    const cuspPositions = [
      { x: -0.35, y: 0.9, z: -0.35 },
      { x: 0.35, y: 0.9, z: -0.35 },
      { x: -0.35, y: 0.9, z: 0.35 },
      { x: 0.35, y: 0.9, z: 0.35 },
    ];

    cuspPositions.forEach((pos) => {
      const cuspMesh = new THREE.Mesh(cuspGeom, toothMaterial);
      cuspMesh.position.set(pos.x, pos.y, pos.z);
      toothGroup.add(cuspMesh);
    });

    // 2. Tooth Neck / Collar (joining crown and roots)
    const neckGeom = new THREE.CylinderGeometry(0.85, 0.7, 0.7, 10, 2);
    const neckMesh = new THREE.Mesh(neckGeom, toothMaterial);
    neckMesh.position.set(0, 0.45, 0);
    toothGroup.add(neckMesh);

    // 3. Roots (2 downward cones)
    const rootGeom = new THREE.ConeGeometry(0.4, 1.6, 8, 3);
    
    // Root 1 (Left)
    const root1 = new THREE.Mesh(rootGeom, toothMaterial);
    root1.position.set(-0.3, -0.6, 0);
    root1.rotation.z = 0.15;
    toothGroup.add(root1);

    // Root 2 (Right)
    const root2 = new THREE.Mesh(rootGeom, toothMaterial);
    root2.position.set(0.3, -0.6, 0);
    root2.rotation.z = -0.15;
    toothGroup.add(root2);

    // Scale group up and add to scene
    toothGroup.scale.set(1.2, 1.2, 1.2);
    scene.add(toothGroup);

    // Animation loop
    let animationFrameId: number;

    const animate = () => {
      // Slow rotation of outer particle constellation
      particleSystem.rotation.y -= 0.001;
      particleSystem.rotation.x -= 0.0005;

      // Rotate the 3D tooth
      toothGroup.rotation.y += 0.005;
      toothGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.15; // Sway back and forth slightly

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Handle viewport resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      cuspGeom.dispose();
      neckGeom.dispose();
      rootGeom.dispose();
      toothMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40"
    />
  );
}
