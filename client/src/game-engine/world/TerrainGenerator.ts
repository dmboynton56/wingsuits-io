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
   * Current design: Dramatic cliff on the -Z side for wingsuit testing
   */
  getHeightAt(x: number, z: number): number {
    // === CLIFF FACE (North side, negative Z) ===
    // Create a tall cliff at z < -20, dropping sharply to valley floor
    const cliffEdgeZ = -20; // Where cliff starts
    const cliffBaseZ = 20;  // Where valley floor begins
    
    let height = 0;
    
    if (z < cliffEdgeZ) {
      // On top of the cliff - high plateau
      const plateauHeight = 80; // Tall cliff for dramatic gliding
      
      // Add gentle rolling hills on plateau
      const plateauVariation = this.fbm(x, z, 3) * 8;
      
      height = plateauHeight + plateauVariation;
      
      // Taper the plateau edges (X direction) for more natural look
      const distFromCenterX = Math.abs(x);
      if (distFromCenterX > 60) {
        const edgeFalloff = this.smoothstep(60, 100, distFromCenterX);
        height *= (1 - edgeFalloff * 0.7); // Drop 70% at edges
      }
      
    } else if (z >= cliffEdgeZ && z <= cliffBaseZ) {
      // Cliff face - steep drop from plateau to valley
      const cliffProgress = (z - cliffEdgeZ) / (cliffBaseZ - cliffEdgeZ);
      const plateauHeight = 80;
      const valleyHeight = 0;
      
      // Exponential falloff for dramatic cliff feel
      const falloff = Math.pow(cliffProgress, 2.5);
      height = plateauHeight * (1 - falloff) + valleyHeight * falloff;
      
      // Add rocky texture to cliff face
      const rockDetail = this.fbm(x * 2, z * 2, 4) * 3;
      height += rockDetail;
      
    } else {
      // Valley floor (south side, positive Z)
      // Gentle rolling terrain with some hills
      const baseHills = this.fbm(x, z, 3) * 12;
      const largeFolds = this.fbm(x * 0.3, z * 0.3, 2) * 18;
      
      height = baseHills + largeFolds;
      
      // Ensure valley floor is relatively low
      height = Math.max(0, height);
    }

    return height;
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
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] + offsetX;
      const z = positions[i + 1] + offsetZ;
      const y = this.getHeightAt(x, z);
      positions[i + 2] = y; // Set Y height (was Z in plane geometry)
    }

    // Rotate to be horizontal
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
