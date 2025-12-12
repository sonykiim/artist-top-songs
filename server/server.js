
// load environment variables
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch').default; // use 'fetch' for making requests

const app = express();
const PORT = 3001; // choose a port for backend

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;


const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

let accessToken = null;
let tokenExpiry = 0;

//function to securely get or refresh the spotify access token
const getAccessToken = async () => {
    //checks if we already have a valid token
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }
// request new token
    console.log("Requesting new Spotify access token...");
    try {
        const authUrl = 'https://accounts.spotify.com/api/token';
        const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            console.error("Failed to get Spotify access token:", response.status, response.statusText);
            throw new Error('Failed to authenticate with Spotify');
        }

        const data = await response.json();
        accessToken = data.access_token;
        // while spotify tokens last 3600 seconds, set expiry 5 minutes early for safety
        tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; 
        
        console.log("New token successfully acquired.");
        return accessToken;

    } catch (error) {
        console.error("Error getting Spotify token:", error);
        throw error;
    }
};

//ensures that we have a valid access token 
const requireAccessToken = async (req, res, next) => {
    try {
        const token = await getAccessToken();
        req.spotifyToken = token;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Could not acquire Spotify access token.' });
    }
};

// implements the /api/suggest route used by suggestArtists function in React
app.get('/api/suggest', requireAccessToken, async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const searchUrl = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${req.spotifyToken}`
            }
        });

        if (!response.ok) {
            console.error("Spotify search error:", response.status, response.statusText);
            return res.status(response.status).json({ error: 'Spotify API error during suggestion search.' });
        }

        const searchData = await response.json();
        
        const topMatches = searchData.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
        }));

        res.json({ suggestions: topMatches });

    } catch (error) {
        console.error("Error in /api/suggest:", error);
        res.status(500).json({ error: 'Internal server error during suggestion fetch.' });
    }
});

// implements the /api/search route used by searchArtist function in React
app.get('/api/search', requireAccessToken, async (req, res) => {
    const artistName = req.query.name;
    if (!artistName) {
        return res.status(400).json({ error: 'Query parameter "name" is required.' });
    }

    try {
        const searchUrl = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
        const searchResponse = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
        });

        if (!searchResponse.ok) {
            return res.status(searchResponse.status).json({ error: 'Error searching for artist.' });
        }
        
        const searchData = await searchResponse.json();
        const artist = searchData.artists.items[0];

        if (!artist) {
            return res.status(404).json({ error: 'Artist not found.' });
        }

        const artistId = artist.id;
        
        // fetch artist profile data
        const profileUrl = `${SPOTIFY_API_URL}/artists/${artistId}`;
        const profileResponse = await fetch(profileUrl, {
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
        });
        
        if (!profileResponse.ok) {
             return res.status(profileResponse.status).json({ error: 'Error fetching artist profile.' });
        }
        const profileData = await profileResponse.json();

        // fetch artist top tracks (in the US)
        const topTracksUrl = `${SPOTIFY_API_URL}/artists/${artistId}/top-tracks?market=US`;
        const topTracksResponse = await fetch(topTracksUrl, {
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
        });

        if (!topTracksResponse.ok) {
             return res.status(topTracksResponse.status).json({ error: 'Error fetching top tracks.' });
        }
        const topTracksData = await topTracksResponse.json();

        // combine all data and send to the client
        const finalArtistData = {
            ...profileData,
            topTracks: topTracksData.tracks || [],
        };
        
        res.json(finalArtistData);

    } catch (error) {
        console.error("Error in /api/search:", error);
        res.status(500).json({ error: 'Internal server error during artist search.' });
    }
});


app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    getAccessToken().catch(() => {});
});
