import * as THREE from 'three';
import { WORLD_CHUNK_SIZE, WORLD_DEBUG_OVERLAY, GROUND_TEST_HEIGHT } from './constants';

export class GroundChunk {
  private mesh: THREE.Mesh | null = null;
  private readonly size: number;

  constructor(size = WORLD_CHUNK_SIZE) {
    this.size = size;
  }

  mount(scene: THREE.Scene) {
    if (this.mesh) return;

    const geometry = new THREE.PlaneGeometry(this.size, this.size, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4f8a4f,
      wireframe: WORLD_DEBUG_OVERLAY,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, GROUND_TEST_HEIGHT, 0);
    this.mesh.receiveShadow = true;

    scene.add(this.mesh);
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
  }

  getHeightAt(_x: number, _z: number) {
    return GROUND_TEST_HEIGHT;
  }
}

