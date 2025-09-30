import * as THREE from 'three';
import { Player } from './Player';
import { CameraRig } from './CameraRig';
import { ChunkManager } from './ChunkManager';
import { eventBus as bus } from '../../lib/eventBus';
import { CheckpointSystem } from '../CheckpointSystem'; // Relative
import { GroundChunk } from './GroundChunk';
import { WORLD_CHUNK_SIZE, WORLD_RADIUS } from './constants';
// Removed: wsClient import - using event bus instead per conventions

export class WorldEngine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: Player;
  cameraRig: CameraRig;
  chunkManager: ChunkManager;
  ground: GroundChunk;
  clock: THREE.Clock;
  checkpointSystem: CheckpointSystem;
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();
  terminalMesh?: THREE.Mesh;
  private disposables: Array<() => void> = [];
  
  // Spawn point on plateau (NEGATIVE Z side)
  // Terrain layout (CORRECTED): Plateau (Z<0) → Cliff Edge (Z=0) → Cliff Face (0<Z<30) → Valley (Z>30)
  private readonly spawnX = 0;
  private readonly spawnZ = -10; // 10m back from cliff edge on the plateau side

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 50, 100);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.6);
    this.scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Sky stub (dome later)
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    this.ground = new GroundChunk();
    this.ground.mount(this.scene);
    bus.emit('world:groundReady', { size: WORLD_CHUNK_SIZE });

    this.player = new Player({ getGroundHeight: this.ground.getHeightAt.bind(this.ground) });
    
    // Calculate proper spawn height from terrain
    const spawnHeight = this.ground.getHeightAt(this.spawnX, this.spawnZ);
    this.player.setPosition({ x: this.spawnX, y: spawnHeight + 5, z: this.spawnZ }); // +5 to spawn above ground
    
    this.scene.add(this.player.mesh);
    
    // Add visual spawn point marker (cyan beacon)
    const spawnMarkerGeo = new THREE.CylinderGeometry(0.5, 0.5, spawnHeight + 10, 16);
    const spawnMarkerMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
    });
    const spawnMarker = new THREE.Mesh(spawnMarkerGeo, spawnMarkerMat);
    spawnMarker.position.set(this.spawnX, (spawnHeight + 10) / 2, this.spawnZ);
    this.scene.add(spawnMarker);
    
    // Add cliff edge marker (red line at Z=0)
    const cliffEdgeGeo = new THREE.BoxGeometry(200, 2, 2);
    const cliffEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });
    const cliffEdgeMarker = new THREE.Mesh(cliffEdgeGeo, cliffEdgeMat);
    cliffEdgeMarker.position.set(0, 101, 0); // Just above plateau height
    this.scene.add(cliffEdgeMarker);

    this.cameraRig = new CameraRig(this.camera, this.player.mesh);
    this.chunkManager = new ChunkManager(this.scene, WORLD_CHUNK_SIZE, WORLD_RADIUS);
    this.checkpointSystem = new CheckpointSystem();
    this.checkpointSystem.mount(this.scene); // Mount checkpoint visuals

    this.clock = new THREE.Clock();

    // Resize
    const handleResize = () => this.onResize();
    window.addEventListener('resize', handleResize);
    this.disposables.push(() => window.removeEventListener('resize', handleResize));

    // Bus integration
    bus.on('player:teleport', ({ position }) => this.player.setPosition(position));
    bus.on('world:seed', ({ seed }) => this.chunkManager.seed = seed); // Future
    bus.on('game:start', () => {
      this.checkpointSystem.startRace();
      this.player.setPosition(this.checkpointSystem.route[0]);
      this.player.mode = 'gliding'; // Start gliding
    });
    
    // 'R' key to reset to spawn point
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        const spawnHeight = this.ground.getHeightAt(this.spawnX, this.spawnZ);
        this.player.setPosition({ x: this.spawnX, y: spawnHeight + 5, z: this.spawnZ });
        this.player.velocity.set(0, 0, 0);
        this.player.mode = 'walking';
        console.log('Reset to spawn point');
      }
    };
    document.addEventListener('keypress', handleKeyPress);
    this.disposables.push(() => document.removeEventListener('keypress', handleKeyPress));

    // Hardcode boxes for avoid
    this.player.boxes = [new THREE.Vector3(0,10,0), /* 4 more lodge */];

    // Input for click
    const handleClick = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      if (intersects[0]?.object.userData.type === 'terminal') {
        bus.emit('terminal:open');
      }
    };
    canvas.addEventListener('click', handleClick);
    this.disposables.push(() => canvas.removeEventListener('click', handleClick));

    // Bus on 'terminal:open' → setOpen true for UI (global? Use store or prop)
  }

  start() {
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.player.update(delta);
    this.cameraRig.update(delta);
    this.chunkManager.update(this.player.position);
    this.checkpointSystem.update(this.player.position);

    // Emit player state via event bus (following documented conventions)
    // The store layer will handle WebSocket communication
    bus.emit('player:stateUpdate', {
      position: { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z },
      rotation: { x: this.player.rotation.x, y: this.player.rotation.y, z: this.player.rotation.z, w: this.player.rotation.w },
      mode: this.player.mode as 'walking' | 'gliding',
      velocity: { x: this.player.velocity.x, y: this.player.velocity.y, z: this.player.velocity.z }
    });

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.disposables.forEach((dispose) => dispose());
    this.disposables = [];
    this.ground.dispose(this.scene);
    this.player.dispose();
    this.cameraRig.dispose();
    this.checkpointSystem.dispose();
    this.renderer.dispose();
  }
}
