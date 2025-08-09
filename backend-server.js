const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { officeOnly, DEFAULT_ALLOWED_IP_RANGES } = require('./middleware/officeOnly');
const { allowedIpRanges } = require('./config/allowedIps');

/**
 * Lightweight Node.js server used in the Render deployment and for local dev.
 *
 * Responsibilities:
 * - Gate access by office IP ranges
 * - Handle Spotify OAuth (auth URL, token exchange, refresh)
 * - Proxy safe Spotify Web API endpoints used by the frontend
 * - Serve static frontend assets for convenience
 *
 * NOTE: This server stores tokens in-memory for simplicity. For multi-user
 * setups, prefer the Spring Boot backend with persistent storage.
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Office-only access middleware is now extracted to middleware/officeOnly.js


// Middleware
app.use(cors());
app.use(express.json());

// Ensure correct client IP when behind proxies/load balancers
// In Render/Heroku/etc., this should be enabled so req.ip/req.ips reflect X-Forwarded-For
app.set('trust proxy', true);

// Office-only access middleware (enabled)
// Uses allowed ranges from config/allowedIps.js; falls back to defaults if not provided
const officeOnlyMiddleware = officeOnly({ allowedIpRanges: allowedIpRanges && allowedIpRanges.length ? allowedIpRanges : DEFAULT_ALLOWED_IP_RANGES });
app.use((req, res, next) => {
    if (req.path === '/api/health') {
        return next(); // Skip IP check for health endpoint
    }
    return officeOnlyMiddleware(req, res, next);
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Spotify configuration (read from environment in deployment)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://spotify-media-player.onrender.com';

// In-memory token storage (for demo purposes)
let userTokens = {};

// Routes
/**
 * GET /api/spotify/auth-url
 * Returns: { authUrl: string }
 * Build the authorization URL for the frontend to initiate Spotify OAuth.
 */
app.get('/api/spotify/auth-url', (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
    res.json({ authUrl });
});

/**
 * POST /api/spotify/exchange-token
 * Body: { code: string }
 * Returns: Spotify token response + { success: true } on success.
 */
app.post('/api/spotify/exchange-token', async (req, res) => {
    try {
        const { code } = req.body;
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        // Store tokens in memory
        userTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: Date.now() + (response.data.expires_in * 1000)
        };
        
        res.json({ success: true, ...response.data });
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
});

/**
 * POST /api/spotify/refresh-token
 * Body: { refresh_token: string }
 * Returns: Spotify token response with refreshed access token.
 */
app.post('/api/spotify/refresh-token', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        const response = await axios.post('https://accounts.spotify.com/api/token',
            `grant_type=refresh_token&refresh_token=${refresh_token}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        // Update stored tokens
        userTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token || userTokens.refresh_token,
            expires_at: Date.now() + (response.data.expires_in * 1000)
        };
        
        res.json(response.data);
    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Current playback endpoint (READ-ONLY)
/**
 * GET /api/spotify/current-playback
 * Returns the user's current playback state from Spotify. 401 if no token.
 */
app.get('/api/spotify/current-playback', async (req, res) => {
    try {
        if (!userTokens.access_token) {
            return res.status(401).json({ error: 'No token available' });
        }
        
        const response = await axios.get('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': `Bearer ${userTokens.access_token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Current playback error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Token expired' });
        } else {
            res.status(error.response?.status || 500).json(error.response?.data || { error: 'Current playback error' });
        }
    }
});

// Get queue endpoint (READ-ONLY)
/**
 * GET /api/spotify/queue
 * Returns the user's queue and currently playing item when available.
 */
app.get('/api/spotify/queue', async (req, res) => {
    try {
        if (!userTokens.access_token) {
            return res.status(401).json({ error: 'No token available' });
        }
        
        const response = await axios.get('https://api.spotify.com/v1/me/player/queue', {
            headers: { 'Authorization': `Bearer ${userTokens.access_token}` }
        });
        
        // Add timestamp to help with debugging
        const queueData = {
            ...response.data,
            timestamp: new Date().toISOString(),
            queue_length: response.data.queue ? response.data.queue.length : 0
        };
        
        console.log(`Queue fetched: ${queueData.queue_length} items`);
        res.json(queueData);
    } catch (error) {
        console.error('Queue error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Token expired' });
        } else if (error.response?.status === 404) {
            // No active device or player not available
            res.json({ 
                queue: [], 
                currently_playing: null,
                timestamp: new Date().toISOString(),
                queue_length: 0,
                message: 'No active Spotify player found'
            });
        } else {
            res.status(error.response?.status || 500).json(error.response?.data || { error: 'Queue error' });
        }
    }
});

/**
 * GET /api/spotify/search
 * Query: q (string), type (string, default track), limit (number)
 * Returns: raw Spotify search results.
 */
app.get('/api/spotify/search', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const { q, type, limit } = req.query;
        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit || 10}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify search error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify search error' });
    }
});

// Add to queue endpoint (ALLOWED - this is safe for office use)
/**
 * POST /api/spotify/add-to-queue
 * Body: { uri: string }
 * Adds a track URI to the current user's queue.
 */
app.post('/api/spotify/add-to-queue', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const { uri } = req.body;
        await axios.post(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Spotify add to queue error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify add to queue error' });
    }
});

/**
 * POST /api/spotify/logout
 * Clears in-memory tokens.
 */
app.post('/api/spotify/logout', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

// Debug endpoints
/**
 * POST /api/spotify/debug/clear-all-tokens
 * Dev helper to clear any stored tokens.
 */
app.post('/api/spotify/debug/clear-all-tokens', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

/**
 * POST /api/spotify/debug/force-unauthorized
 * Dev helper to simulate unauthorized state by removing tokens.
 */
app.post('/api/spotify/debug/force-unauthorized', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

/**
 * GET /api/health
 * Simple liveness endpoint.
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main HTML file for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Spotify Client ID: ${SPOTIFY_CLIENT_ID ? 'Set' : 'Not set'}`);
    console.log(`Spotify Client Secret: ${SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not set'}`);
    console.log('IP filtering is ENABLED (office-only check is ON)');
});
