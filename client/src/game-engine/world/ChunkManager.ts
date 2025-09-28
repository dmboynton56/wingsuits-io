import * as THREE from 'three';
import { eventBus as bus } from '../../lib/eventBus';
import { WORLD_CHUNK_SIZE, WORLD_RADIUS, WORLD_DEBUG_OVERLAY } from './constants';


export class ChunkManager {
  scene: THREE.Scene;
  activeChunks: Map<string, THREE.Object3D> = new Map();
  chunkSize: number;
  radius: number;
  seed?: number; // Future

  constructor(scene: THREE.Scene, chunkSize = WORLD_CHUNK_SIZE, radius = WORLD_RADIUS) {
    this.scene = scene;
    this.chunkSize = chunkSize;
    this.radius = radius;
  }

  update(playerPos: THREE.Vector3) {
    const originKey = '0,0';
    if (!this.activeChunks.has(originKey)) {
      this.loadChunk(0, 0);
    }
    // Ensure nothing else lingers
    for (const key of this.activeChunks.keys()) {
      if (key !== originKey) {
        this.unloadChunk(key);
      }
    }
  }

  private loadChunk(x: number, z: number) {
    const key = `${x},${z}`;
    const geo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x228B22, wireframe: WORLD_DEBUG_OVERLAY });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x * this.chunkSize, 0, z * this.chunkSize);
    this.scene.add(mesh);
    this.activeChunks.set(key, mesh);
    bus.emit('world:chunkLoaded', { 
      chunkId: key, 
      bounds: { x, z, size: this.chunkSize } 
    });
  }

  private unloadChunk(key: string) {
    const obj = this.activeChunks.get(key);
    if (obj) {
      this.scene.remove(obj);
      // Dispose resources if it's a Mesh
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
      // For Groups, dispose child mesh resources
      if (obj instanceof THREE.Group) {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    }
    this.activeChunks.delete(key);
    bus.emit('world:requestChunk', { chunkId: key }); // Stub unload emit
  }
}
