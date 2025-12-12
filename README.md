# artist-top-songs


OverView:
This is a simple full-stack web application designed to search the Spotify Web API for artist profiles an their top 10 tracks

The application uses a secure Client-Server Architecture where the React frontend handles the user interface, and the Express backend handles all secure communication and authentication with Spotify, ensuring your private credentials are never exposed to the client. 


Features:
* secure backend: all sensitive Spotify credentials are stored in private environment
* token caching: the backend efficiently manages and automatically renews the spotify access token, minimizing latency and external API calls
* auto-suggestion: provides real-time artist suggestions as the user types
* combined data: fetches artist profile data and their top tracks in a single request to the frontend. 
