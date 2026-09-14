"use client";

import { useEffect, useRef, useState } from "react";
import type { Font } from "opentype.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import jscad from "@jscad/modeling";
import { buildCustomLetter, type LetterOptions } from "@/lib/custom-letter";

type Model = ReturnType<typeof buildCustomLetter>;
type Props = { options: LetterOptions; fonts: [Font, Font]; baseColor: string; nameColor: string; view: string };
type Viewer = {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  controls: OrbitControls; group: THREE.Group; base: THREE.MeshStandardMaterial;
  name: THREE.MeshStandardMaterial; render: () => void;
};

function bufferGeometry(solid: Model["base"]) {
  const generalize = jscad.modifiers.generalize as unknown as (
    options: { snap: boolean; triangulate: boolean }, geometry: Model["base"],
  ) => Model["base"];
  const triangulated = generalize({ snap: true, triangulate: true }, solid);
  const positions: number[] = [];
  for (const polygon of jscad.geometries.geom3.toPolygons(triangulated)) {
    if (polygon.vertices.length !== 3) continue;
    for (const vertex of polygon.vertices) positions.push(...vertex);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function clearGeometry(group: THREE.Group) {
  for (const child of group.children) if (child instanceof THREE.Mesh) child.geometry.dispose();
  group.clear();
}

export default function LetterPreview3D({ options, fonts, baseColor, nameColor, view }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const currentView = useRef(view);
  const [status, setStatus] = useState("Chargement…");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { queueMicrotask(() => setStatus("3D indisponible")); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf7fafb, 1);
    renderer.domElement.setAttribute("aria-label", "Aperçu 3D orientable");
    renderer.domElement.setAttribute("role", "img");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x747e87, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(-150, 220, 300); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(200, -50, -100); scene.add(fill);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.enableZoom = false;
    const group = new THREE.Group(); scene.add(group);
    const base = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const name = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    });
    resize.observe(element);
    viewer.current = { renderer, scene, camera, controls, group, base, name, render };
    return () => {
      viewer.current = null; resize.disconnect(); controls.dispose();
      clearGeometry(group); base.dispose(); name.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const current = viewer.current;
    if (!current) return;
    current.base.color.set(baseColor); current.name.color.set(nameColor); current.render();
  }, [baseColor, nameColor]);

  useEffect(() => {
    currentView.current = view;
    const current = viewer.current;
    if (!current) return;
    current.group.children.forEach((mesh) => {
      mesh.visible = view === "assembled" || mesh.name === view;
    });
    current.render();
  }, [view]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = viewer.current;
      if (!current) return;
      try {
        const model = buildCustomLetter(options, ...fonts);
        clearGeometry(current.group);
        const base = new THREE.Mesh(bufferGeometry(model.base), current.base); base.name = "base";
        const name = new THREE.Mesh(bufferGeometry(model.assembledLetters), current.name); name.name = "name";
        current.group.position.set(0, 0, 0); current.group.add(base, name);
        const bounds = new THREE.Box3().setFromObject(current.group);
        current.group.position.copy(bounds.getCenter(new THREE.Vector3())).negate();
        const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
        const distance = radius / Math.sin(THREE.MathUtils.degToRad(current.camera.fov / 2)) * 1.1;
        current.camera.position.set(distance * 0.38, distance * 0.12, distance);
        current.controls.target.set(0, 0, 0); current.controls.update(); current.controls.saveState();
        base.visible = currentView.current !== "name"; name.visible = currentView.current !== "base";
        current.render(); setStatus("");
      } catch { setStatus("Aperçu indisponible"); }
    }, 600);
    return () => clearTimeout(timer);
  }, [options, fonts]);

  return (
    <div className="absolute bottom-2 right-2 h-32 w-32 overflow-hidden rounded-lg border border-black/10 bg-[#f7fafb] shadow-sm sm:bottom-3 sm:right-3 sm:h-44 sm:w-44" aria-label="Miniature 3D">
      <div ref={host} className="h-full w-full" />
      <span className="pointer-events-none absolute left-2 top-1 text-[10px] font-bold text-ink-soft">3D</span>
      <button type="button" aria-label="Réinitialiser la vue 3D" title="Réinitialiser la vue 3D" onClick={() => viewer.current?.controls.reset()} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center text-lg text-ink-soft">↺</button>
      {status && <span role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#f7fafb]/90 px-2 text-center text-xs text-ink-soft">{status}</span>}
    </div>
  );
}
