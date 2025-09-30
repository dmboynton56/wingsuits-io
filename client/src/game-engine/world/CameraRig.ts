import * as THREE from 'three';

export class CameraRig {
  camera: THREE.PerspectiveCamera;
  target: THREE.Object3D; // Player mesh
  offset: THREE.Vector3 = new THREE.Vector3(0, 8, 20); // Further back to see terrain
  currentPos: THREE.Vector3 = new THREE.Vector3();
  
  // Mouse orbit controls
  private isRightMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private orbitYaw = 0; // Horizontal rotation around player
  private orbitPitch = 0.3; // Vertical angle (radians, slight downward look)
  private readonly defaultYaw = 0; // Reset position
  private readonly defaultPitch = 0.3; // Reset position
  private readonly pitchMin = -Math.PI / 3; // Don't look too far up
  private readonly pitchMax = Math.PI / 2.5; // Don't look too far down
  private readonly mouseSensitivity = 0.003;
  private readonly resetSpeed = 0.1; // How fast camera returns to default
  
  private disposables: Array<() => void> = [];

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.camera = camera;
    this.target = target;
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
    
    this.setupMouseControls();
  }
  
  private setupMouseControls() {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right click
        this.isRightMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        document.body.style.cursor = 'grabbing';
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        this.isRightMouseDown = false;
        document.body.style.cursor = 'default';
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isRightMouseDown) return;
      
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      
      this.orbitYaw -= deltaX * this.mouseSensitivity;
      this.orbitPitch += deltaY * this.mouseSensitivity;
      
      // Clamp pitch to prevent camera flipping
      this.orbitPitch = Math.max(this.pitchMin, Math.min(this.pitchMax, this.orbitPitch));
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };
    
    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Disable right-click context menu
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('contextmenu', handleContextMenu);
    
    this.disposables.push(() => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.body.style.cursor = 'default';
    });
  }

  update(_delta: number) {
    const damping = 0.05; // Chase smoothness
    
    // Smoothly reset camera to default position when not dragging
    if (!this.isRightMouseDown) {
      this.orbitYaw += (this.defaultYaw - this.orbitYaw) * this.resetSpeed;
      this.orbitPitch += (this.defaultPitch - this.orbitPitch) * this.resetSpeed;
    }
    
    // Calculate camera position with orbital offset
    // Start with base offset
    const baseDistance = this.offset.length();
    const orbitOffset = new THREE.Vector3();
    
    // Apply pitch (vertical) and yaw (horizontal) rotations
    orbitOffset.x = baseDistance * Math.cos(this.orbitPitch) * Math.sin(this.orbitYaw);
    orbitOffset.y = this.offset.y + baseDistance * Math.sin(this.orbitPitch);
    orbitOffset.z = baseDistance * Math.cos(this.orbitPitch) * Math.cos(this.orbitYaw);
    
    // Apply player's rotation to the offset
    const rotatedOffset = orbitOffset.clone().applyQuaternion(this.target.quaternion);
    
    const idealPos = new THREE.Vector3()
      .add(this.target.position)
      .add(rotatedOffset);

    this.currentPos.lerp(idealPos, damping);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.target.position);
  }
  
  dispose() {
    this.disposables.forEach((dispose) => dispose());
    this.disposables = [];
  }
}
