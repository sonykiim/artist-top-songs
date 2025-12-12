import React, { useState } from 'react';
import './index.css';



function ArtistExplorer() {
   // hold user's input
   const [artistNameInput, setArtistNameInput] = useState('');
   // holds the list of suggested artists from the API
   const [suggestions, setSuggestions] = useState([]); 
   // hold the fetched artist data or null if not found/searched yet
   const [artistData, setArtistData] = useState(null);
   // loading state for search button
   const [loading, setLoading] = useState(false);
   // loading state for the suggestions
   const [suggestionsLoading, setSuggestionsLoading] = useState(false); 
   // holds any error msg
   const [error, setError] = useState(null);

/*
  // func that accepts the input text
   const suggestArtists = async (query) => {
       const trimmedQuery = query.trim();
       if (!trimmedQuery || trimmedQuery.length < 2) {
           setSuggestions([]); // clear suggestions if query is too short or empty
           return;
       }

       setSuggestionsLoading(true);
       setSuggestions([]);
       
       try {
           // fetch for results
           const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(trimmedQuery)}&type=artist&limit=5`;
           const response = await fetch(searchUrl, {
               headers: {
                   'Authorization': `Bearer ${ACCESS_TOKEN}`                
               }
           });

           if (!response.ok) {
               setSuggestionsLoading(false);
               return; 
           }

           const searchData = await response.json();
           
           // only grab the necessary name and ID for the list
           const topMatches = searchData.artists.items.map(artist => ({
               id: artist.id,
               name: artist.name,
           }));
           
           setSuggestions(topMatches);

       } catch (err) {
           console.error("Error fetching suggestions:", err);
           setSuggestions([]);
       } finally {
           setSuggestionsLoading(false);
       }
   };

*/

const suggestArtists = async (query) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) {
      setSuggestions([]);
      return;
  }

  setSuggestionsLoading(true);
  setSuggestions([]);
  
  try {
      // 👈 NEW: Call your secure serverless function
      const serverUrl = `/api/suggest?q=${encodeURIComponent(trimmedQuery)}`;
      const response = await fetch(serverUrl);

      if (!response.ok) {
          setSuggestionsLoading(false);
          return; 
      }

      const data = await response.json();
      // 👈 Use the "suggestions" property sent back from the server
      setSuggestions(data.suggestions || []); 

  } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
  } finally {
      setSuggestionsLoading(false);
  }
};

   const selectArtist = (artistName) => {
       setArtistNameInput(artistName); 
       setSuggestions([]);          
       searchArtist();
   };


   //fetch data from the Spotify API
   const searchArtist = async () => {
    const theGoat = artistNameInput.trim();

    if (!theGoat) {
        alert("Please enter an artist name.");
        return;
    }

    setLoading(true); // Start loading
    setArtistData(null); // Clear previous data
    setError(null); // Clear previous error
    setSuggestions([]); // Clear suggestions when starting main search

    try {
        // 👈 NEW: Call your secure serverless function
        const serverUrl = `/api/search?name=${encodeURIComponent(theGoat)}`;
        const artistResponse = await fetch(serverUrl);

        if (artistResponse.status === 404) {
            alert("Artist not found.");
            return;
        }

        if (!artistResponse.ok) {
            // Server returned a 500 error or similar
            throw new Error(`Server error: ${artistResponse.status}`);
        }

        // The server sends back the combined profile and topTracks object directly
        const finalArtistData = await artistResponse.json();

        // 👈 Update state with combined data
        setArtistData(finalArtistData);

    } catch (err) {
        console.error("Error fetching data from server:", err);
        setError("An error occurred: " + err.message);
    } finally {
        setLoading(false); // Stop loading
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
                        onChange={(e) => {  // updates the artistNameInput state 
                            const newValue = e.target.value;
                            setArtistNameInput(newValue);
                            if (!loading) { 
                              suggestArtists(newValue);
                          }
                      }}
                      onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                              searchArtist();
                          }
                      }}
                    />
                    <button
                        id="searchButton"
                        onClick={searchArtist}
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {suggestionsLoading && artistNameInput.length > 1 && (
                    <div className="suggestions-loading">Loading suggestions...</div> // renders message only if both conditions are met
                )}
                
                {suggestions.length > 0 && !suggestionsLoading && ( // suggestion dropdown and each artist name is rendered as a list item
                    <ul className="suggestions-list">
                        {suggestions.map((artist) => (
                            <li 
                                key={artist.id} 
                                // call selectArtist when a suggestion is clicked
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
                            src={artistData.images.length > 0 ? artistData.images[0].url : ''}
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