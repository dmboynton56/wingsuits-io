import * as THREE from 'three';
import { 
  PLAYER_GROUND_CLEARANCE,
  WALK_SPEED,
  SPRINT_SPEED,
  WALK_FRICTION,
  WALK_MAX_SPEED,
  SPRINT_MAX_SPEED,
  JUMP_FORCE,
  GRAVITY,
  ROTATION_SPEED,
  GLIDE_GRAVITY,
  GLIDE_FORWARD_ACCEL,
  GLIDE_MAX_SPEED,
  GLIDE_TURN_SPEED,
  GLIDE_ENTRY_THRESHOLD,
  GLIDE_MIN_AIRTIME,
  GROUND_TOLERANCE,
  JUMP_COOLDOWN
} from './constants';
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
  mode: 'walking' | 'gliding' = 'walking';
  boxes: THREE.Vector3[] | null = null; // Lodge boxes pos

  private getGroundHeight: GroundHeightFn;
  private airborneTime: number = 0; // Track how long we've been in the air
  private lastGroundContact: number = 0; // Time of last ground touch
  private lastJumpTime: number = 0; // Track jump cooldown
  private isGrounded: boolean = false; // Current ground state
  private readonly capsuleRadius = 0.5; // Match capsule geometry

  constructor(options: PlayerOptions = {}) {
    const geo = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xff3333, // Bright red for visibility
      roughness: 0.4,
      metalness: 0.6,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Start at origin - will be adjusted to terrain height in world setup
    this.position = new THREE.Vector3(0, 50, 0);
    this.rotation = new THREE.Quaternion();
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.rotation);

    // Add directional indicator (arrow showing facing direction)
    const arrowGeo = new THREE.ConeGeometry(0.3, 1, 8);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2; // Point forward
    arrow.position.z = -2; // In front of capsule
    this.mesh.add(arrow);

    // Add axes helper to show player orientation
    const axesHelper = new THREE.AxesHelper(3);
    this.mesh.add(axesHelper);

    this.getGroundHeight = options.getGroundHeight ?? (() => -Infinity);
    this.input = new PlayerInput();
  }

  private updateWalking(delta: number) {
    // Check if sprinting (Shift key)
    const isSprinting = this.input.isDown('shift');
    const currentSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED;
    const maxSpeed = isSprinting ? SPRINT_MAX_SPEED : WALK_MAX_SPEED;
    
    // A/D rotation (bank/turn)
    const turnSpeed = 2.0; // radians per second
    if (this.input.isDown('a')) {
      this.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        turnSpeed * delta
      ));
    }
    if (this.input.isDown('d')) {
      this.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        -turnSpeed * delta
      ));
    }
    this.mesh.quaternion.copy(this.rotation);
    
    // W/S forward/backward movement
    const localAccel = new THREE.Vector3();
    if (this.input.isDown('w')) localAccel.z -= currentSpeed;
    if (this.input.isDown('s')) localAccel.z += currentSpeed / 2;
    
    const worldAccel = localAccel.applyQuaternion(this.rotation);
    
    // Jump - ONLY when grounded and cooldown expired
    const now = performance.now() / 1000; // Convert to seconds
    if (this.input.isDown(' ') && this.isGrounded) {
      if (now - this.lastJumpTime > JUMP_COOLDOWN) {
        this.velocity.y = JUMP_FORCE;
        this.lastJumpTime = now;
        this.isGrounded = false; // Immediately mark as airborne
      }
    }

    this.velocity.add(worldAccel.multiplyScalar(delta));
    
    // Friction
    this.velocity.x *= WALK_FRICTION;
    this.velocity.z *= WALK_FRICTION;
    
    // Clamp speed based on sprint state
    const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (horizontalSpeed > maxSpeed) {
      const scale = maxSpeed / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    // Gravity (full strength when walking)
    this.velocity.y -= GRAVITY * delta;
  }

  private updateGliding(delta: number) {
    // A/D banking turns (more responsive in air)
    if (this.input.isDown('a')) {
      this.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        GLIDE_TURN_SPEED * delta
      ));
    }
    if (this.input.isDown('d')) {
      this.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        -GLIDE_TURN_SPEED * delta
      ));
    }
    this.mesh.quaternion.copy(this.rotation);

    // Build acceleration in local space
    const localAccel = new THREE.Vector3();
    
    // Always move forward when gliding (can't hover!)
    localAccel.z -= GLIDE_FORWARD_ACCEL;
    
    // W = dive (pitch down, more speed)
    if (this.input.isDown('w')) {
      this.velocity.y -= 15 * delta; // Extra downward force
    }
    
    // S = flare/brake (slow down)
    if (this.input.isDown('s')) {
      this.velocity.x *= 0.95;
      this.velocity.z *= 0.95;
      this.velocity.y += 5 * delta; // Slight lift
    }
    
    // Transform to world space
    const worldAccel = localAccel.applyQuaternion(this.rotation);
    this.velocity.add(worldAccel.multiplyScalar(delta));
    
    // Reduced gravity when gliding (floaty wingsuit feel)
    this.velocity.y -= GLIDE_GRAVITY * delta;
    
    // Air resistance (subtle drag)
    this.velocity.x *= 0.99;
    this.velocity.z *= 0.99;
    
    // Clamp to max glide speed
    const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (horizontalSpeed > GLIDE_MAX_SPEED) {
      const scale = GLIDE_MAX_SPEED / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
  }

  /**
   * Sample terrain height at multiple points around the player capsule
   * This prevents sinking/floating on slopes by finding the highest ground point
   */
  private sampleGroundHeight(): number {
    // Sample center + 4 cardinal directions around capsule base
    const samples = [
      this.getGroundHeight(this.position.x, this.position.z), // Center
      this.getGroundHeight(this.position.x + this.capsuleRadius, this.position.z), // Right
      this.getGroundHeight(this.position.x - this.capsuleRadius, this.position.z), // Left
      this.getGroundHeight(this.position.x, this.position.z + this.capsuleRadius), // Forward
      this.getGroundHeight(this.position.x, this.position.z - this.capsuleRadius), // Back
    ];
    
    // Use the MAXIMUM height to prevent sinking into slopes
    return Math.max(...samples);
  }

  update(delta: number) {
    const groundHeight = this.sampleGroundHeight();
    const desiredHeight = groundHeight + PLAYER_GROUND_CLEARANCE;
    
    // Precise ground detection using unified tolerance
    const heightDiff = this.position.y - desiredHeight;
    this.isGrounded = heightDiff <= GROUND_TOLERANCE && this.velocity.y <= 0;

    // Track airborne time for glide entry
    if (this.isGrounded) {
      this.airborneTime = 0;
      this.lastGroundContact = performance.now();
    } else {
      this.airborneTime += delta;
    }

    // === STATE TRANSITIONS ===
    
    // Walking → Gliding (automatic when airborne with forward speed)
    if (this.mode === 'walking' && !this.isGrounded) {
      const horizontalSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
      if (this.airborneTime > GLIDE_MIN_AIRTIME && horizontalSpeed > GLIDE_ENTRY_THRESHOLD) {
        this.mode = 'gliding';
        console.log('Entering glide mode!');
      }
    }

    // Gliding → Walking (landing)
    if (this.mode === 'gliding' && this.isGrounded) {
      this.mode = 'walking';
      // Keep some horizontal momentum on landing
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
      console.log('Landing - back to walking');
    }

    // === MOVEMENT & CONTROLS ===
    
    if (this.mode === 'walking') {
      this.updateWalking(delta);
    } else if (this.mode === 'gliding') {
      this.updateGliding(delta);
    }

    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(delta));
    
    // Re-sample ground after movement (important for slopes!)
    const newGroundHeight = this.sampleGroundHeight();
    const newDesiredHeight = newGroundHeight + PLAYER_GROUND_CLEARANCE;
    
    // Ground collision with stronger snapping
    // Snap to ground if below or very close (prevents tunneling on steep slopes)
    if (this.position.y <= newDesiredHeight + GROUND_TOLERANCE) {
      this.position.y = newDesiredHeight;
      if (this.velocity.y < 0) {
        this.velocity.y = 0; // Kill downward velocity
      }
    }
    
    // Prevent falling through on high-speed descents
    // If we're moving down fast and would overshoot, clamp position
    if (this.velocity.y < -50 && this.position.y < newDesiredHeight) {
      this.position.y = newDesiredHeight;
      this.velocity.y = 0;
    }
    
    this.mesh.position.copy(this.position);
  }

  setPosition(pos: { x: number; y: number; z: number }) {
    this.position.set(pos.x, pos.y, pos.z);
    this.mesh.position.copy(this.position);
  }

  dispose() {
    this.input.dispose();
  }
}
