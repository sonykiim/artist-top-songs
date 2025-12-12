import React, { useState } from 'react';
import './index.css';

function ArtistExplorer() {
    // State Variables
    const [artistNameInput, setArtistNameInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [artistData, setArtistData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to fetch artist suggestions from the backend
    const suggestArtists = async (query) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setSuggestionsLoading(true);
        setSuggestions([]);

        try {
            // Call the proxy endpoint defined in vite.config.js
            const serverUrl = `/api/suggest?q=${encodeURIComponent(trimmedQuery)}`;
            const response = await fetch(serverUrl);

            if (!response.ok) {
                // Handle non-OK response but continue without failing the whole app
                setSuggestionsLoading(false);
                return;
            }

            const data = await response.json();
            // The server sends back an object with the 'suggestions' array
            setSuggestions(data.suggestions || []);

        } catch (err) {
            console.error("Error fetching suggestions:", err);
            setSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Handler when a suggestion is clicked
    const selectArtist = (artistName) => {
        setArtistNameInput(artistName);
        setSuggestions([]);
        searchArtist(artistName); // Pass the selected name directly to search
    };

    // Function to search for the selected artist from the backend
    // It accepts an optional name (from selectArtist) or uses the input state
    const searchArtist = async (selectedName = artistNameInput) => {
        const theGoat = selectedName.trim();

        if (!theGoat) {
            alert("Please enter an artist name.");
            return;
        }

        setLoading(true);
        setArtistData(null);
        setError(null);
        setSuggestions([]);

        try {
            // Call the proxy endpoint defined in vite.config.js
            const serverUrl = `/api/search?name=${encodeURIComponent(theGoat)}`;
            const artistResponse = await fetch(serverUrl);

            if (artistResponse.status === 404) {
                alert(`Artist "${theGoat}" not found.`);
                return;
            }

            if (!artistResponse.ok) {
                // Catch 500 errors from the server
                const errorBody = await artistResponse.json();
                throw new Error(`Server error: ${errorBody.error || artistResponse.statusText}`);
            }

            // The server sends back the combined profile and topTracks object
            const finalArtistData = await artistResponse.json();
            setArtistData(finalArtistData);

        } catch (err) {
            console.error("Error fetching data from server:", err);
            setError("An error occurred: " + err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <h1>Artist Information Explorer</h1>

            <div className="search-controls-container" style={{ position: 'relative', zIndex: 10 }}>
                <div className="search-controls">
                    <input
                        type="text"
                        id="artistInput"
                        placeholder="Enter Artist Name"
                        value={artistNameInput}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setArtistNameInput(newValue);
                            if (!loading) {
                                suggestArtists(newValue);
                            }
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                searchArtist(); // Search using the current input state
                            }
                        }}
                    />
                    <button
                        id="searchButton"
                        onClick={() => searchArtist()} // Search using the current input state
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {suggestionsLoading && artistNameInput.length > 1 && (
                    <div className="suggestions-loading">Loading suggestions...</div>
                )}

                {suggestions.length > 0 && !suggestionsLoading && (
                    <ul className="suggestions-list">
                        {suggestions.map((artist) => (
                            <li
                                key={artist.id}
                                onClick={() => selectArtist(artist.name)}
                            >
                                {artist.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>


            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ {error}</p>}

            {artistData && (
                <div id="artistInfo" className="artist-info">
                    <div className="artist-header">
                        <img
                            id="artistImage"
                            src={artistData.images.length > 0 ? artistData.images[0].url : 'https://via.placeholder.com/150'}
                            alt={`Image of ${artistData.name}`}
                        />
                        <div className="details">
                            <p>The GOAT: <span id="artistName">{artistData.name}</span></p>
                            <p>Followers: <span id="artistFollowers">{artistData.followers.total.toLocaleString()}</span></p>
                            <p>Genres: <span id="artistGenres">{artistData.genres.join(', ') || 'N/A'}</span></p>
                        </div>
                    </div>

                    <h2>Top 10 Tracks</h2>
                    <ul id="topTracksList" className="album-track-list">
                        {artistData.topTracks && artistData.topTracks.length > 0 ? (
                            artistData.topTracks.map((track) => {

                                const albumImageUrl = track.album.images.length > 0
                                    ? track.album.images[track.album.images.length - 1].url
                                    : '';

                                const trackUrl = track.external_urls.spotify;

                                return (
                                    <li
                                        key={track.id}
                                        className="track-item"
                                    >

                                        <div
                                            className="track-details-group"
                                        >
                                            {albumImageUrl && (
                                                <img
                                                    src={albumImageUrl}
                                                    alt={`Cover for ${track.album.name}`}
                                                />
                                            )}

                                            <span>
                                                **{track.name}** (Album: {track.album.name})
                                            </span>
                                        </div>


                                        <a
                                            href={trackUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="spotify-link"
                                        >
                                            🎧 LISTEN
                                        </a>
                                    </li>
                                );
                            })
                        ) : (
                            <li>No top tracks found.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
export default ArtistExplorer;