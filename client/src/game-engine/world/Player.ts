import * as THREE from 'three';
import { PLAYER_GROUND_CLEARANCE } from './constants';
import { PlayerInput } from './PlayerInput';

type GroundHeightFn = (x: number, z: number) => number;

interface PlayerOptions {
  getGroundHeight?: GroundHeightFn;
}

export class Player {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  velocity: THREE.Vector3 = new THREE.Vector3();

  private input: PlayerInput;
  mode: 'walking' | 'flying' = 'walking';
  boxes: THREE.Vector3[] | null = null; // Lodge boxes pos

  private getGroundHeight: GroundHeightFn;

  constructor(options: PlayerOptions = {}) {
    const geo = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geo, mat);

    this.position = new THREE.Vector3(0, 10, 0);
    this.rotation = new THREE.Quaternion();
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.rotation);

    this.getGroundHeight = options.getGroundHeight ?? (() => -Infinity);
    this.input = new PlayerInput();
  }

  update(delta: number) {
    const speed = this.mode === 'flying' ? 50 : 10;
    const accel = new THREE.Vector3();

    if (this.input.isDown('w')) accel.z -= speed;
    if (this.input.isDown('s')) accel.z += speed / 2;
    if (this.input.isDown('a')) accel.x -= speed;
    if (this.input.isDown('d')) accel.x += speed;
    if (this.input.isDown(' ')) accel.y += 20; // Flare
    if (this.input.isDown('shift')) accel.y -= 30; // Dive
    if (this.input.isDown('f')) this.mode = this.mode === 'walking' ? 'flying' : 'walking'; // Toggle

    this.velocity.add(accel.multiplyScalar(delta));
    // Dampen
    this.velocity.multiplyScalar(0.9);
    // Clamp speed
    if (this.velocity.length() > (this.mode === 'flying' ? 100 : 20)) {
      this.velocity.normalize().multiplyScalar(this.mode === 'flying' ? 100 : 20);
    }

    // Gravity
    if (this.mode === 'walking') this.velocity.y -= 20 * delta;

    this.position.add(this.velocity.clone().multiplyScalar(delta));
    this.mesh.position.copy(this.position);

    if (this.mode === 'walking') {
      const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
      const desiredHeight = groundHeight + PLAYER_GROUND_CLEARANCE;
      if (this.position.y <= desiredHeight) {
        this.position.y = desiredHeight;
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
        }
      }
    }

    // Avoid boxes stub
    this.boxes?.forEach(boxPos => {
      const dist = this.position.distanceTo(boxPos);
      if (dist < 5) {
        const steer = this.position.clone().sub(boxPos).normalize().multiplyScalar(10 * delta);
        this.velocity.add(steer);
      }
    });

    // Rotation stub: Face velocity
    if (this.velocity.length() > 0.1) {
      this.rotation.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        this.velocity.clone().normalize()
      );
      this.mesh.quaternion.copy(this.rotation);
    }
  }

  setPosition(pos: { x: number; y: number; z: number }) {
    this.position.set(pos.x, pos.y, pos.z);
    this.mesh.position.copy(this.position);
  }

  dispose() {
    this.input.dispose();
  }
}
