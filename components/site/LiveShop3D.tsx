"use client";
/* eslint-disable @next/next/no-img-element -- vignettes produits déjà optimisées (R2). */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LIVE_AVATARS, type LiveAction } from "@/lib/live-avatars";
import type { LiveVisitor } from "./LiveShop";

// Boutique isométrique low-poly rendue en vanilla three.js (même convention
// que les previews produits). Les étiquettes (zones, visiteurs, produits)
// restent des éléments DOM projetés chaque frame par-dessus le canvas.
// Le canapé, le banc et la cabine WC sont cliquables (hotspots).

const ZONES = [
  { key: "entree", label: "L’entrée", dot: "#d9a441", carpet: 0xf0e3c6, rect: { x: [-2.6, 2.6], z: [3.6, 6.6] } },
  { key: "rayons", label: "Les rayons", dot: "#5b7fb4", carpet: 0xccd7ea, rect: { x: [-9.5, -1.2], z: [-6.2, 1.4] } },
  { key: "atelier", label: "L’atelier perso", dot: "#6a9e55", carpet: 0xd6e6cf, rect: { x: [1.8, 9.4], z: [-6.2, -1.8] } },
  { key: "caisse", label: "La caisse", dot: "#d87a45", carpet: 0xf6d9c5, rect: { x: [3.6, 9.4], z: [-0.4, 2.8] } },
  { key: "comptoir", label: "Le comptoir", dot: "#8d6cab", carpet: 0xe3d7ec, rect: { x: [-9.5, -3.8], z: [2.6, 6.6] } },
  { key: "balcon", label: "Le balcon", dot: "#c9a227", carpet: 0xf7e6b4, rect: { x: [5.2, 9.4], z: [4.4, 6.8] } },
] as const;
const ZONE_KEYS = new Set<string>(ZONES.map(zone => zone.key));
const OUTFITS = [0xff6b35, 0x2a9d8f, 0x457b9d, 0xe9c46a, 0x9c6644, 0x6d597a, 0xe76f51, 0x588157];

// Places assises par hotspot : position du bassin + orientation une fois assis.
const SEATS = {
  canape: { zone: "comptoir", spots: [{ x: -7.1, y: 0.07, z: 4.55, ry: Math.PI }, { x: -6.1, y: 0.07, z: 4.55, ry: Math.PI }] },
  banc: { zone: "balcon", spots: [{ x: 6.8, y: 0.05, z: 5.9, ry: Math.PI }, { x: 7.7, y: 0.05, z: 5.9, ry: Math.PI }] },
} as const;
const WC_DOOR_SPOT = { x: 10.1, z: -5.5 };

function hash(seed: number, salt: string) {
  let h = seed >>> 0;
  for (const char of salt) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}
function spot(seed: number, zone: string, productSlug: string) {
  const definition = ZONES.find(z => z.key === zone) ?? ZONES[0];
  const h = hash(seed, zone + productSlug);
  const { rect } = definition;
  const x = rect.x[0] + 0.6 + ((h % 1000) / 1000) * (rect.x[1] - rect.x[0] - 1.2);
  const z = rect.z[0] + 0.6 + (((h >> 10) % 1000) / 1000) * (rect.z[1] - rect.z[0] - 1.2);
  return new THREE.Vector3(x, 0, z);
}

type Resolved = { zone: string; action: LiveAction | null };
type Character = {
  group: THREE.Group; target: THREE.Vector3; legs: THREE.Mesh[]; arms: THREE.Mesh[]; body: THREE.Mesh;
  phase: number; avatarIndex: number; action: LiveAction | null; seatRy: number; seatY: number;
};

export type HotspotKey = "canape" | "banc" | "wc";

export default function LiveShop3D({ visitors, printing, selfId, selfZone, selfAction, onHotspot }: {
  visitors: LiveVisitor[];
  printing: number;
  selfId: string | null;
  selfZone: string | null;
  selfAction: LiveAction | null;
  onHotspot?: (key: HotspotKey) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labelEls = useRef(new Map<string, HTMLElement>());
  const visitorsRef = useRef<LiveVisitor[]>([]);
  const selfRef = useRef<{ id: string | null; zone: string | null; action: LiveAction | null }>({ id: null, zone: null, action: null });
  const hotspotRef = useRef(onHotspot);
  const dirty = useRef(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { visitorsRef.current = visitors; dirty.current = true; }, [visitors]);
  useEffect(() => { selfRef.current = { id: selfId, zone: selfZone, action: selfAction }; dirty.current = true; }, [selfId, selfZone, selfAction]);
  useEffect(() => { hotspotRef.current = onHotspot; }, [onHotspot]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { queueMicrotask(() => setStatus("La 3D n’est pas disponible sur cet appareil.")); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcabfa8, 1.9));
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sun.position.set(9, 16, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 50 });
    scene.add(sun);

    const material = (color: number, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
    function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
      mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
      return mesh;
    }
    function cylinder(rTop: number, rBottom: number, h: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 14), material(color));
      mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
      return mesh;
    }
    function sphere(r: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), material(color));
      mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
      return mesh;
    }
    function plant(x: number, z: number, scale = 1) {
      cylinder(0.26 * scale, 0.2 * scale, 0.4 * scale, 0xb0643c, x, 0.2 * scale, z);
      sphere(0.34 * scale, 0x5e8c4a, x, 0.72 * scale, z);
      sphere(0.24 * scale, 0x6fa355, x + 0.18 * scale, 0.95 * scale, z - 0.08 * scale);
      sphere(0.2 * scale, 0x4f7a3d, x - 0.2 * scale, 0.9 * scale, z + 0.1 * scale);
    }

    // Sol, murs et tapis de zones.
    const floor = box(23, 0.5, 17, 0xefe8dc, 0, -0.25, 0);
    floor.receiveShadow = true;
    box(23, 1.7, 0.35, 0xf8f5ee, 0, 0.85, -8.6);
    box(23.6, 0.18, 0.6, 0xffffff, 0, 1.75, -8.6);
    box(0.35, 1.7, 17, 0xf8f5ee, -11.6, 0.85, 0);
    box(0.6, 0.18, 17.6, 0xffffff, -11.6, 1.75, 0);
    for (const zone of ZONES) {
      const w = zone.rect.x[1] - zone.rect.x[0], d = zone.rect.z[1] - zone.rect.z[0];
      const cx = (zone.rect.x[0] + zone.rect.x[1]) / 2, cz = (zone.rect.z[0] + zone.rect.z[1]) / 2;
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material(0xffffff, 1));
      rim.rotation.x = -Math.PI / 2; rim.position.set(cx, 0.012, cz); rim.receiveShadow = true; scene.add(rim);
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.24, d - 0.24), material(zone.carpet, 1));
      carpet.rotation.x = -Math.PI / 2; carpet.position.set(cx, 0.02, cz); carpet.receiveShadow = true; scene.add(carpet);
    }

    // Mobilier : rayons (étagères garnies), atelier, caisse, comptoir, entrée.
    for (const [sx, sz] of [[-7.6, -4.8], [-4.6, -4.8], [-7.6, -1.9], [-4.6, -1.9]] as const) {
      box(2.3, 0.14, 0.85, 0xc9a36b, sx, 0.52, sz);
      box(2.3, 0.14, 0.85, 0xc9a36b, sx, 1.02, sz);
      box(0.12, 1.1, 0.85, 0xb8905a, sx - 1.1, 0.55, sz);
      box(0.12, 1.1, 0.85, 0xb8905a, sx + 1.1, 0.55, sz);
      let h = hash(97, `${sx}${sz}`);
      for (let i = 0; i < 6; i++) {
        h = (h * 1103515245 + 12345) >>> 0;
        box(0.3, 0.3, 0.3, OUTFITS[h % OUTFITS.length], sx - 0.85 + (i % 3) * 0.75, (i < 3 ? 0.66 : 1.16) + 0.08, sz + ((h >> 8) % 30 - 15) / 100);
      }
    }
    box(2.6, 0.12, 1.3, 0xc9a36b, 5.6, 0.82, -4.4); // établi atelier
    for (const lx of [4.5, 6.7]) { box(0.14, 0.8, 1.1, 0x8a6b45, lx, 0.4, -4.4); }
    // Imprimante 3D en action sur l'établi : tête qui balaie, pièce qui monte.
    const printer = new THREE.Group();
    printer.position.set(5.1, 0.88, -4.5);
    scene.add(printer);
    box(0.6, 0.06, 0.5, 0x35332f, 0, 0.03, 0, printer);
    for (const px of [-0.28, 0.28]) box(0.05, 0.55, 0.05, 0x47423c, px, 0.33, -0.2, printer);
    box(0.66, 0.05, 0.08, 0x47423c, 0, 0.62, -0.2, printer);
    const gantry = box(0.62, 0.035, 0.05, 0xff6b35, 0, 0.2, 0, printer);
    const head = box(0.09, 0.12, 0.09, 0x2b2824, 0, 0.2, 0, printer);
    const printMaterial = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.6 });
    const printPiece = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.24), printMaterial);
    printPiece.castShadow = true;
    printPiece.position.set(0, 0.06, 0.04);
    printer.add(printPiece);
    box(0.4, 0.5, 0.04, 0x47423c, 6.2, 1.1, -4.7);
    cylinder(0.3, 0.3, 0.08, 0xdcc9a8, 5.6, 0.5, -3.1);
    cylinder(0.06, 0.08, 0.44, 0x8a6b45, 5.6, 0.22, -3.1);
    box(2.4, 0.95, 0.9, 0xdd8a5b, 6.4, 0.475, 1.3); // caisse
    box(2.6, 0.1, 1.05, 0xf8f5ee, 6.4, 0.98, 1.3);
    box(0.42, 0.34, 0.05, 0x2b2824, 5.9, 1.25, 1.2);
    // Canapé du comptoir (hotspot assis).
    const sofa = new THREE.Group();
    scene.add(sofa);
    box(1.9, 0.42, 0.85, 0x7fa08a, -6.6, 0.21, 4.6, sofa);
    box(1.9, 0.5, 0.2, 0x6b8d77, -6.6, 0.65, 4.95, sofa);
    for (const ax of [-7.6, -5.6]) box(0.2, 0.55, 0.85, 0x6b8d77, ax, 0.4, 4.6, sofa);
    cylinder(0.55, 0.55, 0.1, 0xdcc9a8, -4.6, 0.32, 4);
    cylinder(0.09, 0.12, 0.3, 0x8a6b45, -4.6, 0.15, 4);
    box(0.18, 1.9, 0.18, 0x47423c, -1.6, 0.95, 7.6); // porte d'entrée
    box(0.18, 1.9, 0.18, 0x47423c, 1.6, 0.95, 7.6);
    box(3.5, 0.22, 0.3, 0xff6b35, 0, 1.95, 7.6);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), material(0xd8c29a, 1));
    mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.025, 6.2); mat.receiveShadow = true; scene.add(mat);
    for (const bx of [5.4, 6.6, 7.8, 9]) box(0.08, 0.55, 0.08, 0x8a6b45, bx, 0.28, 4.5); // rambarde balcon
    box(3.9, 0.08, 0.1, 0x8a6b45, 7.2, 0.58, 4.5);
    // Banc du balcon (hotspot assis).
    const bench = new THREE.Group();
    scene.add(bench);
    box(1.8, 0.09, 0.5, 0xc9a36b, 7.25, 0.42, 5.95, bench);
    for (const lx of [6.55, 7.95]) box(0.12, 0.42, 0.42, 0x8a6b45, lx, 0.21, 5.95, bench);
    // Cabine WC (hotspot) dans le coin arrière droit.
    const wc = new THREE.Group();
    scene.add(wc);
    box(1.5, 2.1, 1.4, 0x475060, 10.2, 1.05, -7.3, wc);
    const wcDoor = box(0.7, 1.7, 0.08, 0x5d6a80, 10.2, 0.85, -6.56, wc);
    box(0.4, 0.26, 0.06, 0xf8f5ee, 10.2, 1.85, -6.55, wc); // pancarte
    cylinder(1.1, 1.3, 0.5, 0xcf7a4e, 1.2, 0.25, 0.6); // grand bac central + arbre
    cylinder(0.14, 0.2, 1, 0x7a5435, 1.2, 1, 0.6);
    sphere(0.75, 0x5e8c4a, 1.2, 1.9, 0.6);
    sphere(0.5, 0x6fa355, 1.75, 1.6, 0.35);
    sphere(0.45, 0x4f7a3d, 0.7, 1.65, 0.9);
    plant(-10.4, -7.2); plant(3, -7.4, 0.8); plant(-10.5, 6.8, 0.9); plant(10.2, 3.4, 0.8);

    // Caméra isométrique + contrôles doux.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(10.5, 16.5, 10.5);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minPolarAngle = 0.45; controls.maxPolarAngle = 1.05;
    controls.minZoom = 0.7; controls.maxZoom = 2.6;
    controls.target.set(0, 0.4, 0);
    function resize() {
      const rect = element!.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height);
      const aspect = rect.width / rect.height;
      const half = aspect >= 1 ? 11.5 : 12.8; // paysage : cadré sur la hauteur ; portrait : sur la largeur
      camera.left = aspect >= 1 ? -half * aspect : -half;
      camera.right = -camera.left;
      camera.top = aspect >= 1 ? half : half / aspect;
      camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    // Hotspots cliquables : clic court (pas un drag d'orbite) → callback.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    const hotspotTargets: [THREE.Group, HotspotKey][] = [[sofa, "canape"], [bench, "banc"], [wc, "wc"]];
    function onPointerDown(event: PointerEvent) { downAt = { x: event.clientX, y: event.clientY }; }
    function onPointerUp(event: PointerEvent) {
      if (!downAt || Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 8) { downAt = null; return; }
      downAt = null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      for (const [group, key] of hotspotTargets) {
        if (raycaster.intersectObject(group, true).length > 0) { hotspotRef.current?.(key); return; }
      }
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // Personnages.
    const characters = new Map<string, Character>();
    function buildCharacter(avatarIndex: number, seed: number): Character {
      const look = LIVE_AVATARS[avatarIndex] ?? LIVE_AVATARS[0];
      const group = new THREE.Group();
      const legs = [-0.09, 0.09].map(x => {
        const leg = box(0.13, 0.36, 0.14, 0x35332f, x, 0, 0, group);
        leg.geometry.translate(0, -0.18, 0); leg.position.setY(0.36);
        return leg;
      });
      const body = box(0.4, 0.5, 0.26, look.outfit, 0, 0.6, 0, group);
      const arms = [-0.26, 0.26].map(x => {
        const arm = box(0.1, 0.38, 0.12, look.outfit, x, 0, 0, group);
        arm.geometry.translate(0, -0.19, 0); arm.position.setY(0.8);
        return arm;
      });
      sphere(0.17, look.skin, 0, 1.02, 0, group);
      box(0.3, 0.1, 0.3, look.hat, 0, 1.16, 0, group);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14 }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; group.add(shadow);
      group.position.set(0, 0, 7.4); // tout le monde entre par la porte
      scene.add(group);
      return { group, target: group.position.clone(), legs, arms, body, phase: hash(seed, "p") % 100 / 10, avatarIndex, action: null, seatRy: 0, seatY: 0 };
    }
    function despawn(id: string) {
      const character = characters.get(id);
      if (!character) return;
      scene.remove(character.group);
      character.group.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose()); } });
      characters.delete(id);
    }
    function resolve(visitor: LiveVisitor): Resolved {
      const self = selfRef.current;
      const isSelf = self.id === visitor.id;
      const zone = isSelf && self.zone ? self.zone : (ZONE_KEYS.has(visitor.zone) ? visitor.zone : "comptoir");
      const action = isSelf ? self.action : (visitor.action ?? null);
      return { zone, action };
    }
    function reconcile() {
      const seen = new Set<string>();
      // Répartition des places assises par hotspot, dans l'ordre des visiteurs.
      const seatCursor: Record<string, number> = { canape: 0, banc: 0 };
      for (const visitor of visitorsRef.current) {
        seen.add(visitor.id);
        const avatarIndex = (visitor.avatar ?? hash(visitor.seed, "a")) % LIVE_AVATARS.length;
        let character = characters.get(visitor.id);
        if (character && character.avatarIndex !== avatarIndex) { despawn(visitor.id); character = undefined; }
        if (!character) { character = buildCharacter(avatarIndex, visitor.seed); characters.set(visitor.id, character); }
        const { zone, action } = resolve(visitor);
        character.action = action;
        if (action === "wc") {
          character.target.set(WC_DOOR_SPOT.x, 0, WC_DOOR_SPOT.z);
        } else if (action === "assis") {
          const hotspot = zone === "balcon" ? SEATS.banc : SEATS.canape;
          const key = zone === "balcon" ? "banc" : "canape";
          const seat = hotspot.spots[seatCursor[key]++ % hotspot.spots.length];
          character.target.set(seat.x, 0, seat.z);
          character.seatRy = seat.ry;
          character.seatY = seat.y;
        } else {
          character.target.copy(spot(visitor.seed, zone, visitor.product?.slug ?? ""));
        }
      }
      for (const id of [...characters.keys()]) if (!seen.has(id)) despawn(id);
    }

    // Boucle : marche, poses, imprimante, étiquettes DOM projetées.
    const clock = new THREE.Clock();
    const projected = new THREE.Vector3();
    function placeLabel(key: string, anchor: THREE.Vector3, hidden = false) {
      const label = labelEls.current.get(key);
      if (!label) return;
      if (hidden) { label.style.display = "none"; return; }
      label.style.display = "";
      projected.copy(anchor).project(camera);
      const rect = element!.getBoundingClientRect();
      const half = label.offsetWidth / 2;
      const x = Math.min(Math.max((projected.x * 0.5 + 0.5) * rect.width, half + 4), rect.width - half - 4);
      label.style.transform = `translate(-50%, -100%) translate(${x}px, ${(-projected.y * 0.5 + 0.5) * rect.height}px)`;
    }
    const anchor = new THREE.Vector3();
    let frame = 0;
    function animate() {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      if (dirty.current) { dirty.current = false; reconcile(); }
      const cycle = (t % 7) / 7; // une pièce imprimée toutes les 7 s
      const height = 0.02 + cycle * 0.2;
      printPiece.scale.y = height;
      printPiece.position.y = 0.06 + height / 2;
      printMaterial.color.setHex(OUTFITS[Math.floor(t / 7) % OUTFITS.length]);
      gantry.position.y = head.position.y = 0.1 + height + 0.06;
      head.position.x = Math.sin(t * 4.5) * 0.22;
      gantry.position.z = head.position.z = 0.04 + Math.sin(t * 0.9) * 0.09;

      let wcOccupied = false;
      for (const character of characters.values()) {
        const { group, target } = character;
        const dx = target.x - group.position.x, dz = target.z - group.position.z;
        const distance = Math.hypot(dx, dz);
        const walking = distance > 0.06;
        if (walking) {
          const step = Math.min(1.6 * dt, distance);
          group.position.x += (dx / distance) * step;
          group.position.z += (dz / distance) * step;
          group.rotation.y = Math.atan2(dx, dz);
          group.position.y = 0;
          group.visible = true;
          const swing = Math.sin((t + character.phase) * 9) * 0.55;
          character.legs[0].rotation.x = swing; character.legs[1].rotation.x = -swing;
          character.arms[0].rotation.x = -swing * 0.7; character.arms[1].rotation.x = swing * 0.7;
        } else if (character.action === "wc") {
          group.visible = false; // dans la cabine
          wcOccupied = true;
        } else if (character.action === "assis") {
          group.visible = true;
          group.rotation.y = character.seatRy;
          group.position.y = character.seatY - 0.3;
          for (const leg of character.legs) leg.rotation.x = -1.35;
          for (const arm of character.arms) arm.rotation.x = -0.4;
        } else {
          group.visible = true;
          group.position.y = 0;
          for (const limb of [...character.legs, ...character.arms]) limb.rotation.x *= 0.8;
          character.body.position.y = 0.6 + Math.sin((t + character.phase) * 2.2) * 0.012;
        }
      }
      wcDoor.position.z = wcOccupied ? -6.56 : -6.75; // porte fermée / entrouverte
      for (const zone of ZONES) {
        // Étiquette posée sur le bord arrière de la zone, comme une enseigne.
        anchor.set((zone.rect.x[0] + zone.rect.x[1]) / 2, 0.5, zone.rect.z[0] + 0.25);
        placeLabel(`zone:${zone.key}`, anchor);
      }
      placeLabel("wc-occupied", anchor.set(10.2, 2.4, -7.3), !wcOccupied);
      for (const visitor of visitorsRef.current) {
        const character = characters.get(visitor.id);
        if (character) placeLabel(`visitor:${visitor.id}`, anchor.copy(character.group.position).setY(group3dLabelHeight(character)), !character.group.visible);
      }
      controls.update();
      renderer.render(scene, camera);
    }
    function group3dLabelHeight(character: Character) {
      return character.group.position.y + (character.action === "assis" ? 1.35 : 1.55);
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose()); } });
      renderer.dispose();
      element.removeChild(renderer.domElement);
    };
  }, []);

  const register = (key: string) => (node: HTMLElement | null) => {
    if (node) labelEls.current.set(key, node); else labelEls.current.delete(key);
  };

  return (
    <div ref={host} className="relative h-[62svh] min-h-96 w-full touch-none overflow-hidden rounded-3xl border-2 border-ink/10 bg-gradient-to-b from-[#fdf9f2] to-[#f0e8db]">
      {status && <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-ink-soft">{status}</p>}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {ZONES.map(zone => (
          <span key={zone.key} ref={register(`zone:${zone.key}`)} className="absolute left-0 top-0 flex items-center gap-1 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: zone.dot }} />{zone.label}
            {zone.key === "atelier" && printing > 0 && <span className="text-terra-deep">🖨️ {printing} en fabrication</span>}
          </span>
        ))}
        <span ref={register("wc-occupied")} className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-linen">🚽 Occupé</span>
        {visitors.map(visitor => (
          <div key={visitor.id} ref={register(`visitor:${visitor.id}`)} className="absolute left-0 top-0 flex flex-col items-center gap-1">
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${visitor.id === selfId ? "bg-terra text-ink" : "bg-ink/85 text-linen"}`}>
              {visitor.emoji} {visitor.name}{visitor.id === selfId ? " (toi)" : ""}
            </span>
            {visitor.product && (
              <span className="flex max-w-40 items-center gap-1.5 rounded-xl border border-ink/10 bg-white/95 px-1.5 py-1 shadow-soft">
                {visitor.product.image && <img src={visitor.product.image} alt="" className="h-6 w-6 shrink-0 rounded-md object-cover" />}
                <span className="truncate text-[9px] font-semibold">👀 {visitor.product.name}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
