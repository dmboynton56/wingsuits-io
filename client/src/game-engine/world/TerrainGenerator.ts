import * as THREE from 'three';

/**
 * Simple terrain generator using Perlin-like noise
 * Creates heightmap-based terrain with hills and valleys
 */
export class TerrainGenerator {
  private seed: number;

  constructor(seed = 12345) {
    this.seed = seed;
  }

  /**
   * Simple pseudo-random noise function (seeded)
   */
  private noise2D(x: number, z: number): number {
    // Simple hash-based pseudo-noise
    const n = Math.sin(x * 12.9898 + z * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Smoothed noise using bilinear interpolation
   */
  private smoothNoise(x: number, z: number): number {
    const intX = Math.floor(x);
    const intZ = Math.floor(z);
    const fracX = x - intX;
    const fracZ = z - intZ;

    // Sample corners
    const v1 = this.noise2D(intX, intZ);
    const v2 = this.noise2D(intX + 1, intZ);
    const v3 = this.noise2D(intX, intZ + 1);
    const v4 = this.noise2D(intX + 1, intZ + 1);

    // Smooth interpolation
    const i1 = this.interpolate(v1, v2, fracX);
    const i2 = this.interpolate(v3, v4, fracX);
    return this.interpolate(i1, i2, fracZ);
  }

  private interpolate(a: number, b: number, t: number): number {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  /**
   * Fractal Brownian Motion (fBm) - layered noise for natural terrain
   */
  private fbm(x: number, z: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.smoothNoise(x * frequency * 0.01, z * frequency * 0.01) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  /**
   * Smoothstep function for smooth transitions
   */
  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * Get height at a specific world position
   * 
   * CLEAN SLATE DESIGN (CORRECTED Z-AXIS):
   * - Flat plateau at height=100 on NEGATIVE Z side (looking forward)
   * - OVERHANGING cliff that curves inward as it drops
   * - Valley floor on POSITIVE Z side (behind you)
   * 
   * World coordinates (corrected):
   *   Negative Z ← Plateau (h=100) ← SPAWN HERE
   *   ↓
   *   Cliff Edge at Z=0 (OVERHANGS!)
   *   ↓
   *   Positive Z ← Valley Floor (h=0)
   */
  getHeightAt(x: number, z: number): number {
    // Configuration
    const PLATEAU_HEIGHT = 100;   // Height of the cliff top
    const VALLEY_HEIGHT = 0;      // Valley floor height
    const CLIFF_EDGE = 0;         // Where the cliff starts (Z coordinate)
    const CLIFF_DROP_DISTANCE = 30; // How far the cliff face extends
    const OVERHANG_AMOUNT = 15;   // How far the cliff juts out at the top
    
    // === PLATEAU (Negative Z side: Z < 0) ===
    if (z < CLIFF_EDGE) {
      // Completely flat plateau for easy testing
      return PLATEAU_HEIGHT;
    }
    
    // === CLIFF FACE WITH OVERHANG (Z between CLIFF_EDGE and CLIFF_EDGE + CLIFF_DROP_DISTANCE) ===
    else if (z < CLIFF_EDGE + CLIFF_DROP_DISTANCE) {
      // Calculate how far down the cliff we are (0 = top, 1 = bottom)
      const cliffProgress = (z - CLIFF_EDGE) / CLIFF_DROP_DISTANCE;
      
      // Create an S-curve that makes the cliff overhang at the top
      // Using a modified sine curve that starts steep, then curves inward
      // This makes the top portion project outward (overhang)
      
      // Custom curve: steep drop at start, then curves back inward
      // At progress=0: height=100 (top of cliff)
      // Early on: drops very steep (overhang feeling)
      // Later: curve moderates (recessed cliff face)
      // At progress=1: height=0 (valley floor)
      
      let heightFactor;
      if (cliffProgress < 0.3) {
        // First 30%: VERY steep drop to create overhang impression
        // Drop from 100 to about 60 very quickly
        heightFactor = 1 - (cliffProgress / 0.3) * 0.4;
      } else {
        // Remaining 70%: gentler slope, curves inward
        const adjustedProgress = (cliffProgress - 0.3) / 0.7;
        heightFactor = 0.6 * (1 - Math.pow(adjustedProgress, 1.5));
      }
      
      return PLATEAU_HEIGHT * heightFactor + VALLEY_HEIGHT * (1 - heightFactor);
    }
    
    // === VALLEY FLOOR (Positive Z side: Z > CLIFF_EDGE + CLIFF_DROP_DISTANCE) ===
    else {
      // Completely flat valley floor
      return VALLEY_HEIGHT;
    }
  }

  /**
   * Generate terrain mesh geometry
   */
  generateMesh(
    size: number,
    resolution: number,
    offsetX = 0,
    offsetZ = 0
  ): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(
      size,
      size,
      resolution - 1,
      resolution - 1
    );

    const positions = geometry.attributes.position.array as Float32Array;

    // Apply heightmap
    // PlaneGeometry starts as XY plane, we need to map to XZ plane
    // After rotateX(-90°): original Y becomes Z, original Z becomes -Y
    // So we need to NEGATE the z-coordinate when sampling to match world coordinates
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] + offsetX;
      const z = -(positions[i + 1] + offsetZ); // NEGATE to match visual orientation
      const y = this.getHeightAt(x, z);
      positions[i + 2] = y; // Set height into Z position (becomes Y after rotation)
    }

    // Rotate to be horizontal (this swaps Y and Z axes)
    geometry.rotateX(-Math.PI / 2);

    // Recompute normals for proper lighting
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Update seed for different terrain
   */
  setSeed(seed: number) {
    this.seed = seed;
  }
}
