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

You can also do this automatically using the LiveKit CLI:

```bash
lk app env
```

The server listens on port `3000` by default. To override, set the `PORT` environment variable.

Build and run the server:

```console
pnpm build && pnpm start
```

## Use as a GitHub Action

This repository doubles as a composite GitHub Action, so CI for other projects
can stand up a real token endpoint (for example, to exercise an SDK's HTTP token
source end-to-end against a local `livekit-server`).

Below is an example usage of this action:

```yaml
- name: Start token server
  id: token_server
  uses: livekit-examples/token-server-node@v1 #v1 is an example release version
  with:
    livekit-url: ws://localhost:7880
    api-key: devkey
    api-secret: secret
    port: "3000"  # optional; defaults to 3000

# Here code under test would be run, such as integration tests. 
# The below is a simple curl command to show the server working
- name: Use the endpoint
  run: curl -sf -X POST "${{ steps.token_server.outputs.token-url }}" \
    -H 'Content-Type: application/json' \
    -d '{"room_name":"my-room","participant_identity":"alice"}'
```

Outputs:

- `token-url` — full URL of the `/createToken` endpoint
- `log-path` — path to the server's captured stdout/stderr log
