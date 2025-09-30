import * as THREE from 'three';
import { eventBus as bus } from '../lib/eventBus';

export class CheckpointSystem {
  route: THREE.Vector3[] = [
    new THREE.Vector3(0, 10, 0), // Start
    new THREE.Vector3(50, 20, 50),
    new THREE.Vector3(100, 10, 0),
    new THREE.Vector3(0, 10, -100), // Finish
  ];
  currentIndex = 0;
  timerStart = 0;
  isRacing = false;
  checkRadius = 5;
  routeId = 'default-route';
  
  // Visual checkpoint meshes
  private checkpointMeshes: THREE.Mesh[] = [];
  private scene: THREE.Scene | null = null;

  /**
   * Mount checkpoint visual markers to the scene
   */
  mount(scene: THREE.Scene) {
    this.scene = scene;
    
    // Create visual markers for each checkpoint
    this.route.forEach((position, index) => {
      const isStart = index === 0;
      const isFinish = index === this.route.length - 1;
      
      // Create checkpoint ring/gate
      const ringGeo = new THREE.TorusGeometry(this.checkRadius, 0.5, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: isStart ? 0x00ff00 : isFinish ? 0xff0000 : 0x00ffff,
        emissive: isStart ? 0x00ff00 : isFinish ? 0xff0000 : 0x00ffff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(position);
      ring.rotation.x = Math.PI / 2; // Horizontal ring
      
      // Add a vertical indicator pole
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, position.y, 8);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
      });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(position.x, position.y / 2, position.z);
      
      // Add checkpoint number text (using a simple sphere for now)
      const numberGeo = new THREE.SphereGeometry(1, 16, 16);
      const numberMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
      });
      const numberMarker = new THREE.Mesh(numberGeo, numberMat);
      numberMarker.position.copy(position);
      numberMarker.position.y += 1;
      
      // Group checkpoint elements
      const checkpointGroup = new THREE.Group();
      checkpointGroup.add(ring);
      checkpointGroup.add(pole);
      checkpointGroup.add(numberMarker);
      
      scene.add(checkpointGroup);
      this.checkpointMeshes.push(ring); // Keep reference to rings for animation
    });
  }

  startRace() {
    this.currentIndex = 0;
    this.timerStart = performance.now();
    this.isRacing = true;
    bus.emit('race:checkpoint', { index: 0, routeId: this.routeId }); // Start
  }

  update(playerPos: THREE.Vector3) {
    // Animate checkpoint rings (pulse/rotate)
    this.checkpointMeshes.forEach((mesh, index) => {
      mesh.rotation.z += 0.01; // Slow rotation
      
      // Pulse the active checkpoint
      if (this.isRacing && index === this.currentIndex) {
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        mesh.scale.set(scale, scale, scale);
      } else {
        mesh.scale.set(1, 1, 1);
      }
      
      // Dim completed checkpoints
      if (index < this.currentIndex) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.2;
      }
    });

    if (!this.isRacing || this.currentIndex >= this.route.length - 1) return;

    const target = this.route[this.currentIndex];
    const dist = playerPos.distanceTo(target);
    if (dist < this.checkRadius) {
      this.currentIndex++;
      bus.emit('race:checkpoint', { index: this.currentIndex, routeId: this.routeId });

      if (this.currentIndex >= this.route.length - 1) {
        this.finish();
      }
    }
  }

  private finish() {
    const timeMs = performance.now() - this.timerStart;
    this.isRacing = false;
    bus.emit('race:checkpoint', { index: -1, routeId: this.routeId }); // Finish signal
    // Update XP stub: + timeMs / 10 or fixed
    // useProfileStore.getState().updateProfile({ xp: timeMs / 10 });
    console.log(`Race finished in ${timeMs}ms`);
  }

  dispose() {
    if (!this.scene) return;
    
    // Remove all checkpoint meshes from scene
    this.checkpointMeshes.forEach((mesh) => {
      this.scene?.remove(mesh.parent || mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    
    this.checkpointMeshes = [];
  }
}
