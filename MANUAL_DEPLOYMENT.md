# Manual Web Service Deployment Guide

## Step-by-Step Instructions

### 1. Go to Render Dashboard
- Visit [dashboard.render.com](https://dashboard.render.com)
- Sign in to your account

### 2. Create New Web Service
- Click **"New +"** button
- Select **"Web Service"** (NOT Blueprint)

### 3. Connect Repository
- Choose **"Connect a repository"**
- Select your GitHub repository
- Choose the branch (usually `main` or `master`)

### 4. Configure Service Settings
Fill in these settings:

**Name:** `spotify-media-player`

**Environment:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

**Plan:** `Free` (if available) or `Starter` ($7/month)

### 5. Set Environment Variables
Click **"Advanced"** and add these environment variables:

- **Key:** `SPOTIFY_CLIENT_ID`
  **Value:** Your Spotify App Client ID

- **Key:** `SPOTIFY_CLIENT_SECRET`
  **Value:** Your Spotify App Client Secret

- **Key:** `SPOTIFY_REDIRECT_URI`
  **Value:** `https://your-service-name.onrender.com` (replace with your actual service URL)

### 6. Deploy
- Click **"Create Web Service"**
- Render will automatically build and deploy your service

### 7. Get Your Service URL
- Once deployed, you'll get a URL like: `https://spotify-media-player-xxxx.onrender.com`
- Update the `SPOTIFY_REDIRECT_URI` environment variable with this URL
- Redeploy the service

## Why Manual Deployment is Better

✅ **More Control** - You can choose the exact settings  
✅ **Free Tier Options** - Sometimes free tier is available manually  
✅ **No Blueprint Issues** - Avoids payment requirements  
✅ **Easier Debugging** - Better error messages and logs  

## Troubleshooting

### If you get build errors:
1. Check that `package.json` exists in the root directory
2. Verify `backend-server.js` is in the root directory
3. Make sure `frontend/` directory exists

### If you get runtime errors:
1. Check the logs in Render dashboard
2. Verify environment variables are set correctly
3. Make sure Spotify credentials are valid

### If the service doesn't start:
1. Check that the port is set correctly (Render uses `process.env.PORT`)
2. Verify all dependencies are in `package.json`
3. Check the start command is correct

## Local Testing

Before deploying, test locally:
```bash
npm install
npm start
```

Visit `http://localhost:3000` to test the application.
