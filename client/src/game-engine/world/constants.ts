const env = (key: string, fallback: string) => {
  if (typeof process === 'undefined') return fallback;
  const value = process.env[key];
  return value === undefined ? fallback : value;
};

export const WORLD_CHUNK_SIZE = Number(env('WORLD_CHUNK_SIZE', '256'));
export const WORLD_RADIUS = Number(env('WORLD_RADIUS', '3'));
export const WORLD_DEBUG_OVERLAY = env('WORLD_DEBUG_OVERLAY', 'false') === 'true';

export const GROUND_TEST_HEIGHT = 0;
export const PLAYER_GROUND_CLEARANCE = 2;

