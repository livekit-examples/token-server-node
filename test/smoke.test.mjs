import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { TokenVerifier } from 'livekit-server-sdk';

// Dummy credentials: tokens are signed locally, so no real LiveKit project is needed
const LIVEKIT_URL = 'wss://smoke-test.livekit.cloud';
const LIVEKIT_API_KEY = 'smoke-test-key';
const LIVEKIT_API_SECRET = 'smoke-test-secret-that-is-at-least-32-chars';
const BASE_URL = 'http://localhost:3000';

let server;

before(async () => {
  server = spawn('node', ['dist/main.js'], {
    env: { ...process.env, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET },
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  // Wait for the server to report that it is listening
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start in time')), 10_000);
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Server listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on('exit', (code) => reject(new Error(`Server exited early with code ${code}`)));
  });
});

after(() => {
  server?.kill();
});

async function createToken(body) {
  const res = await fetch(`${BASE_URL}/createToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 201);
  return res.json();
}

function verify(token) {
  return new TokenVerifier(LIVEKIT_API_KEY, LIVEKIT_API_SECRET).verify(token);
}

test('encodes every request field into the token', async () => {
  const { server_url, participant_token } = await createToken({
    room_name: 'smoke-room',
    participant_identity: 'smoke-identity',
    participant_name: 'Smoke Tester',
    participant_metadata: '{"role":"tester"}',
    participant_attributes: { team: 'qa' },
    room_config: { agents: [{ agent_name: 'smoke-agent' }] },
  });

  assert.equal(server_url, LIVEKIT_URL);

  const claims = await verify(participant_token);
  assert.equal(claims.sub, 'smoke-identity');
  assert.equal(claims.name, 'Smoke Tester');
  assert.equal(claims.metadata, '{"role":"tester"}');
  assert.deepEqual(claims.attributes, { team: 'qa' });
  assert.equal(claims.roomConfig?.agents?.[0]?.agentName, 'smoke-agent');
  assert.equal(claims.video?.room, 'smoke-room');
  assert.equal(claims.video?.roomJoin, true);
});

test('generates a room and identity when none are given', async () => {
  const { participant_token } = await createToken({});

  const claims = await verify(participant_token);
  assert.match(claims.video?.room ?? '', /^room-/);
  assert.match(claims.sub ?? '', /^user-/);
});

test('still accepts the legacy camelCase fields', async () => {
  const { participant_token } = await createToken({
    roomName: 'legacy-room',
    participantName: 'legacy-user',
  });

  const claims = await verify(participant_token);
  assert.equal(claims.video?.room, 'legacy-room');
  assert.equal(claims.sub, 'legacy-user');
});
