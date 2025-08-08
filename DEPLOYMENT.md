# Deployment Guide for Spotify Media Player

## Render Deployment Setup

This project is configured to deploy on Render with the following services:

### Services Configuration

1. **Backend Service** (`spotify-media-player-backend`)
   - Type: Web Service (Java)
   - Environment: Java 17
   - Port: 8080
   - Database: H2 in-memory (no external database needed)

2. **Frontend Service** (`spotify-media-player-frontend`)
   - Type: Web Service (Node.js)
   - Environment: Node.js
   - Port: 3000

### Environment Variables Required

#### Backend Environment Variables:
- `SPOTIFY_CLIENT_ID` - Your Spotify App Client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify App Client Secret
- `SPOTIFY_REDIRECT_URI` - Set to: `https://spotify-media-player-frontend.onrender.com`

#### Frontend Environment Variables:
- `BACKEND_URL` - Set to: `https://spotify-media-player-backend.onrender.com`

### Deployment Steps

1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Set Environment Variables:**
   - After the blueprint is created, go to each service
   - Set the required environment variables (especially Spotify credentials)
   - Make sure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set

3. **Deploy:**
   - Render will automatically build and deploy all services
   - Services will be available at the provided URLs

### Troubleshooting

If the repository doesn't show up in Render:

1. **Check Repository Visibility:** Make sure your repository is public or you've granted Render access
2. **Verify render.yaml:** Ensure the file is in the root directory
3. **Check Branch:** Make sure you're on the main/master branch
4. **Manual Service Creation:** If blueprint doesn't work, create services manually using the configuration in `render.yaml`

### Local Development

To run locally:
```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm start
```
