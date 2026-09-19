import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();

export async function preload(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      if (cache.has(id)) return;
      const gltf = await loader.loadAsync(`/models/${id}.glb`);
      const root = gltf.scene;
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      cache.set(id, root);
    }),
  );
}

export function instance(id: string): THREE.Group {
  const src = cache.get(id);
  if (!src) throw new Error(`model not preloaded: ${id}`);
  return src.clone(true);
}
