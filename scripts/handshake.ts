import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const WORLD_WS_URL = process.env.WORLD_WS_URL || 'ws://localhost:8080/ws';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'dev-secret';

const payload = {
  sub: 'smoke-user',
  exp: Math.floor(Date.now() / 1000) + 60,
};

const token = jwt.sign(payload, SUPABASE_JWT_SECRET);

const ws = new WebSocket(WORLD_WS_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'C2S_AUTH',
      payload: { token },
    }),
  );
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('Handshake timed out');
  process.exit(1);
}, 5000);
