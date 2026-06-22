<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# Node Token Server

<p>
  <a href="https://cloud.livekit.io/projects/p_/sandbox"><strong>Deploy a sandbox app</strong></a>
  •
  <a href="https://docs.livekit.io">LiveKit Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="https://blog.livekit.io/">Blog</a>
</p>

A basic LiveKit token server using Node + TypeScipt. For details on generating tokens, see our [documentation](https://docs.livekit.io/home/server/generating-tokens).

## Dev Setup

Clone the repository and install dependencies:

```console
cd token-server-node
pnpm install
```

Set up the environment by copying `.env.example` to `.env.local` and filling in the required values:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `TOKEN_SERVER_PORT` (TCP port the server listens on; e.g. `3000`)

You can also do this automatically using the LiveKit CLI:

```bash
lk app env
```

Build and run the server:

```console
pnpm build && pnpm start
```

The server requires `TOKEN_SERVER_PORT`; it does not pick a port on its own.

## Use as a GitHub Action

This repository doubles as a composite GitHub Action, so CI for other projects
can stand up a real token endpoint (for example, to exercise an SDK's HTTP token
source end-to-end against a local `livekit-server`).

Set `TOKEN_SERVER_PORT` on the workflow (or on the action step) so the server
and health check agree on the listen port:

```yaml
env:
  TOKEN_SERVER_PORT: "3000"

- name: Start token server
  id: token_server
  uses: livekit-examples/token-server-node@v1
  with:
    livekit-url: ws://localhost:7880
    api-key: devkey
    api-secret: secret

- name: Use the endpoint
  run: curl -sf -X POST "${{ steps.token_server.outputs.token-url }}" \
    -H 'Content-Type: application/json' \
    -d '{"room_name":"my-room","participant_identity":"alice"}'
```

Outputs:

- `token-url` — full URL of the `/createToken` endpoint.
- `log-path` — path to the server's captured stdout/stderr log.

Pin to a released tag or commit SHA (as shown for `@v1`) rather than a moving
branch.
