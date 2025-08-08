const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Spotify configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://spotify-media-player.onrender.com';

// In-memory token storage (for demo purposes)
let userTokens = {};

// Routes
app.get('/api/spotify/auth-url', (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
    res.json({ authUrl });
});

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

// Current playback endpoint (what frontend expects)
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

// Spotify API proxy endpoints
app.get('/api/spotify/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify API error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify API error' });
    }
});

app.get('/api/spotify/player', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const response = await axios.get('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Spotify player error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify player error' });
    }
});

app.post('/api/spotify/play', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        await axios.put('https://api.spotify.com/v1/me/player/play', req.body, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Spotify play error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify play error' });
    }
});

app.post('/api/spotify/pause', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        await axios.put('https://api.spotify.com/v1/me/player/pause', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Spotify pause error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify pause error' });
    }
});

app.post('/api/spotify/next', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        await axios.post('https://api.spotify.com/v1/me/player/next', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Spotify next error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify next error' });
    }
});

app.post('/api/spotify/previous', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || userTokens.access_token;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        await axios.post('https://api.spotify.com/v1/me/player/previous', {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Spotify previous error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify previous error' });
    }
});

// Search endpoint
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

// Add to queue endpoint
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

// Logout endpoint
app.post('/api/spotify/logout', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

// Debug endpoints
app.post('/api/spotify/debug/clear-all-tokens', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

app.post('/api/spotify/debug/force-unauthorized', (req, res) => {
    userTokens = {};
    res.json({ success: true });
});

// Health check
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
});
