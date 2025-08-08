# Spotify Media Player

A web-based, office-friendly Spotify media player that lets users view the currently playing track, search for songs, and add songs to the queue. Includes Spotify OAuth, search, and add-to-queue functionality.

## Features

- 🎵 **Playback Control**: Play, pause, skip (when permitted by Spotify API)
- 🔍 **Track Search**: Search for tracks and add them to your queue
- 👀 **Now Playing**: View current song, album art, and progress
- 🔐 **Spotify Auth**: OAuth 2.0 authorization flow
- 🏢 **Office Mode**: Optional IP-based access restriction for office WiFi

## Architecture Overview

- **Spring Boot backend** (`backend/`): Full-featured API with persistent token storage (H2 for dev). Recommended for multi-user or on-prem setups.
- **Node server** (`backend-server.js`): Lightweight server used by default in Render deployments; proxies safe Spotify endpoints and stores tokens in-memory.
- **Frontend** (`frontend/`): Simple HTML/JS client served by the Node server in production.

## Prerequisites

- Java 17+
- Maven
- Node.js 18+
- Spotify Developer account and app

## Spotify App Configuration

1. Go to the Spotify Developer Dashboard (`https://developer.spotify.com/dashboard`).
2. Create an app and copy the Client ID and Client Secret.
3. Add the redirect URI that matches your deployment:
   - Local Node: `http://localhost:3000`
   - Local Spring Boot + custom frontend: `https://localhost:3000`
   - Render: your service URL (e.g., `https://spotify-media-player.onrender.com`)

## Quick Start (Node server + frontend)

```bash
# From repo root
npm install
cd frontend && npm install && cd ..

# Start the Node server (serves frontend and API)
npm start
# Visit http://localhost:3000
```

Configure environment variables for the Node server before starting (in your shell or Render):
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` (defaults to the Render URL in `render.yaml`)

## Spring Boot Backend (optional)

Use this variant if you want persistent token storage and a typed API.

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (served separately)
cd ../frontend
node server.js
```

Set properties in `backend/src/main/resources/application.properties`:
```properties
spotify.client.id=YOUR_CLIENT_ID
spotify.client.secret=YOUR_CLIENT_SECRET
spotify.redirect.uri=https://localhost:3000
```

## API Endpoints

### Spring Boot (`http://localhost:8080/api/spotify`)
- `GET /auth-url` – Get Spotify authorization URL
- `POST /exchange-token` – Exchange authorization code for token
- `GET /current-playback` – Current playback state
- `POST /play` – Start playback
- `POST /pause` – Pause playback
- `POST /next` – Next track
- `POST /previous` – Previous track
- `GET /search` – Search tracks
- `POST /add-to-queue` – Add track to queue
- `POST /logout` – Invalidate session

### Node server (`http://localhost:3000/api/spotify`)
- `GET /auth-url`
- `POST /exchange-token`
- `POST /refresh-token`
- `GET /current-playback`
- `GET /queue`
- `GET /search`
- `POST /add-to-queue`
- `POST /logout`

## Office IP Restriction (optional)

See `IP_RESTRICTION_GUIDE.md` for enabling office-only access via CIDR ranges. Update `ALLOWED_IP_RANGES` in `backend-server.js`.

## Developer Notes

- The Node server stores tokens in-memory and is meant for single-user/shared-display office scenarios. For multiple users or durable sessions, use the Spring Boot backend.
- CORS is enabled for localhost by default. Adjust allowed origins in `SecurityConfig` and `CorsConfig` for production.
- The Spring backend uses H2 for development; swap to a persistent DB for production as needed.

## Troubleshooting

- SSL warnings on localhost: use self-signed certs or run over HTTP for local dev where appropriate.
- 401 Unauthorized: token may be absent or expired; re-authenticate.
- CORS errors: update allowed origins in backend configs.

## Contributing

- Fork → Feature Branch → Edits → Tests → PR

## License

Educational use only. Follow Spotify’s terms and API policies.
