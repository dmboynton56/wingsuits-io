import * as THREE from 'three';

export class CameraRig {
  camera: THREE.PerspectiveCamera;
  target: THREE.Object3D; // Player mesh
  offset: THREE.Vector3 = new THREE.Vector3(0, 5, 10); // Behind/above
  currentPos: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.camera = camera;
    this.target = target;
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
  }

  update(_delta: number) {
    const damping = 0.05; // Chase smoothness
    const idealPos = new THREE.Vector3()
      .add(this.target.position)
      .add(this.offset.clone().applyQuaternion(this.target.quaternion));

    this.currentPos.lerp(idealPos, damping);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.target.position);
  }
}
