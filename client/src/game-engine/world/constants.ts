const env = (key: string, fallback: string) => {
  if (typeof process === 'undefined') return fallback;
  const value = process.env[key];
  return value === undefined ? fallback : value;
};

// World generation constants
export const WORLD_CHUNK_SIZE = Number(env('WORLD_CHUNK_SIZE', '256'));
export const WORLD_RADIUS = Number(env('WORLD_RADIUS', '3'));
export const WORLD_DEBUG_OVERLAY = env('WORLD_DEBUG_OVERLAY', 'false') === 'true';

// Ground/collision constants
export const GROUND_TEST_HEIGHT = 0;
export const PLAYER_GROUND_CLEARANCE = 2;
export const GROUND_TOLERANCE = 0.1; // Threshold for "on ground" detection (tight for precise jumps)

// Walking physics constants (tune these for feel)
export const WALK_SPEED = 65;
export const SPRINT_SPEED = 100; // Hold Shift to sprint
export const WALK_FRICTION = .95; // 0-1, higher = more friction
export const WALK_MAX_SPEED = 75;
export const SPRINT_MAX_SPEED = 120; // Faster top speed when sprinting
export const JUMP_FORCE = 15; // Increased for better jump feel
export const GRAVITY = 20;
export const JUMP_COOLDOWN = 0.1; // Seconds between jumps (prevents double-jump)
export const ROTATION_SPEED = 0.1; // How fast player rotates to face movement direction

// Gliding/wingsuit physics constants
export const GLIDE_GRAVITY = 8; // Reduced gravity when gliding
export const GLIDE_FORWARD_ACCEL = 15; // Forward momentum when gliding
export const GLIDE_MAX_SPEED = 80; // Max glide speed
export const GLIDE_TURN_SPEED = 1.5; // Banking turn rate
export const GLIDE_ENTRY_THRESHOLD = 10; // Min forward speed to enter glide
export const GLIDE_MIN_AIRTIME = 0.3; // Seconds airborne before can glide

