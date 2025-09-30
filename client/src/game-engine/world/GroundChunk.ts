import * as THREE from 'three';
import { WORLD_CHUNK_SIZE, WORLD_DEBUG_OVERLAY } from './constants';
import { TerrainGenerator } from './TerrainGenerator';

export class GroundChunk {
  private mesh: THREE.Mesh | null = null;
  private readonly size: number;
  private terrainGen: TerrainGenerator;
  private helpers: THREE.Object3D[] = [];

  constructor(size = WORLD_CHUNK_SIZE) {
    this.size = size;
    this.terrainGen = new TerrainGenerator();
  }

  mount(scene: THREE.Scene) {
    if (this.mesh) return;

    // Generate terrain geometry with heightmap
    const resolution = 64; // Higher = more detail, but more vertices
    const geometry = this.terrainGen.generateMesh(this.size, resolution);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a9a4a,
      wireframe: WORLD_DEBUG_OVERLAY,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false, // Smooth shading for natural look
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    scene.add(this.mesh);

    // Add axis helper at origin (now at ground level)
    const axesHelper = new THREE.AxesHelper(20);
    const originHeight = this.terrainGen.getHeightAt(0, 0);
    axesHelper.position.set(0, originHeight + 0.5, 0);
    scene.add(axesHelper);
    this.helpers.push(axesHelper);

    // Optional: Add wireframe helper for debugging terrain shape
    if (WORLD_DEBUG_OVERLAY) {
      const wireframeGeo = geometry.clone();
      const wireframeMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        opacity: 0.3,
        transparent: true,
      });
      const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
      scene.add(wireframeMesh);
      this.helpers.push(wireframeMesh);
    }
  }

  dispose(scene: THREE.Scene) {
    if (!this.mesh) return;

    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    this.mesh = null;

    // Remove helpers
    this.helpers.forEach((helper) => {
      scene.remove(helper);
      if (helper instanceof THREE.Mesh) {
        helper.geometry.dispose();
        if (Array.isArray(helper.material)) {
          helper.material.forEach((m) => m.dispose());
        } else {
          helper.material.dispose();
        }
      }
    });
    this.helpers = [];
  }

  getHeightAt(x: number, z: number): number {
    return this.terrainGen.getHeightAt(x, z);
  }
}

