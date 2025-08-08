# Deployment Guide for Spotify Media Player

## Render Deployment Setup

This project is configured to deploy on Render with a single service:

### Service Configuration

**Combined Service** (`spotify-media-player`)
- Type: Web Service (Node.js)
- Environment: Node.js
- Port: 3000
- Features: Backend API + Frontend served from same service

### Environment Variables Required

- `SPOTIFY_CLIENT_ID` - Your Spotify App Client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify App Client Secret
- `SPOTIFY_REDIRECT_URI` - Set to: `https://spotify-media-player.onrender.com`

### Deployment Steps

1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Set Environment Variables:**
   - After the blueprint is created, go to the service
   - Set the required environment variables (especially Spotify credentials)
   - Make sure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set

3. **Deploy:**
   - Render will automatically build and deploy the service
   - Service will be available at the provided URL

### Troubleshooting

If the repository doesn't show up in Render:

1. **Check Repository Visibility:** Make sure your repository is public or you've granted Render access
2. **Verify render.yaml:** Ensure the file is in the root directory
3. **Check Branch:** Make sure you're on the main/master branch
4. **Manual Service Creation:** If blueprint doesn't work, create service manually using the configuration in `render.yaml`

### Local Development

To run locally:
```bash
# Install dependencies
npm install
cd frontend && npm install

# Start the server
npm start
```

### Architecture Notes

- **Single Service**: Backend API and frontend served from one Node.js service
- **No Database**: Uses in-memory storage
- **Authentication**: Spotify OAuth 2.0 flow
- **Free Tier Compatible**: Uses only one service to avoid payment requirements
