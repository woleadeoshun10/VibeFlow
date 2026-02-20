// Practice

import express from 'express';  // import express module
import cors from 'cors'; // cross origin resource sharing for to block requests between ports
import axios from 'axios'; // for http requests to spotify api
import dotenv from 'dotenv'; // to. load env file where key is
dotenv.config(); // to read env files

// create server
const app = express();
const PORT = process.env.PORT || 3000; // reads port from env or uses 3000 if no port was declared

// add middleware code to enable cors and express to read json
app.use(cors()); //  acts like doorman
app.use(express.json()); // reads in JSON

let spotifyAcessToken = null; // spotify's access token for communcaiton

// function for spotify token - its a post request to spotify's api to get token
async function getSpotifyToken() {
  try{
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
       'grant_type=client_credentials', // app only authentication
       {   // create header to add extra info for spotify
          headers: {
             'Content-Type': 'application/x-www-form-urlencoded',  // url for encoded format
             'Authorization': 'Basic ' + Buffer.from(
               process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
             ).toString('base64')  // encode credentials in base 64 format 
          }
       }
    );

    spotifyAcessToken = response.data.access_token; // get the token from spotify
    console.log('Spotify token obtained successfully');
    return spotifyAcessToken;
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
    throw error;
  }
}

// mood mapping to playlist
const moodtoQuery = {
  // different search words for each mood 
  happy: 'happy upbeat feel good', 
  chill: 'chill relax calm peaceful',
  focus: 'focus study concentration',
  sad: 'sad melancholy emotional',
  afrobeats: 'afrobeats afrobeat african music wizkid burna boy'
};


//GET function 
app.get('/api/playlists/:mood', async(req, res) => {
   try {
    const mood = req.params.mood.toLowerCase(); // make mood lowercase for consistency
    // if client inputs an invalid mood send a 400 error
    if (!moodtoQuery[mood]){
      return res.status(400).json({ error: 'Invalid mood. Choose: happy, chill, focus, sad, or afrobeats' });
    }

    // if no accestoken wait till its receoved
    if (!spotifyAcessToken) {
      await getSpotifyToken();
    }

    // search spotify playlist
    const searchQuery = moodtoQuery[mood];
    //call spotify API
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=playlist&limit=12`,
      {
         headers: {
          'Authorization': `Bearer ${spotifyAcessToken}` // use token
          }
       }
     );
     
     //Format playlist so we have things like name , image, description etc
     const playlists = response.data.playlists.items
    .filter(playlist => playlist !== null)  
    .map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description  || 'No description',
      image: playlist.images?.[0]?.url || null, // first image in the image array and return null if no image, optional chaining(check if exists before accessing)
      totalTracks: playlist.tracks.total,
      spotifyUrl: playlist.external_urls.spotify
     }));

         res.json({mood, playlists}); // send back JSON response to frontend
   } catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);

     //check if error is unathorized
    if (error.response?.status === 401){
      spotifyAcessToken = null;
      return res.status(401).json({ error: 'Token expired, please try again' });
    }

    // server error
    res.status(500).json({ error: 'Failed to fetch playlists' });
   }
  }
);

// Favorite Storage
let favorites = [];

app.get('/api/favorites', (req, res) => {
  res.json({favorites});
});

//POST to add to favorites
app.post('/api/favorites', (req, res) => {
  
  //extract playlist from body
  const { playlist } = req.body;
 
  //check if in favorites 
  const exists = favorites.find(fav => fav?.id === playlist?.id);
  if (exists) {
    return res.status(400).json({error: 'Playlist already in favorites' });
  }
  // add playlist to end if not in array
  favorites.push(playlist);
  res.json({message: 'Added to favorites', favorites});
});


//PATCH  for user to update notes on favorite playlist
app.patch("/api/favorites/:id", (req, res) => {
    const { id } = req.params;
    const { userNote } = req.body;
    
    // Find playlist in Favorites
    const playlist = favorites.find(fav => fav?.id === id);

    // Return 404 error if not found
    if (!playlist){
      return res.status(404).json({error: 'Playlist not found in favorites'});
    }

    //update playlist with note
    playlist.userNote = userNote || " ";

    //Return success with updated favorite playlist
    res.json({
      Message: 'Note added.', favorites
    });
});



//Delete from favorites
app.delete('/api/favorites/:id', (req, res) => {
  // get id from params
  const { id } = req.params;

  //check if exists
  const exists = favorites.find(fav => fav?.id === id);
  if (!exists) {
    return res.status(404).json({error: 'Playlist not found in favorites' });
  }

  //delete from favorites by filtering
  favorites = favorites.filter(fav => fav?.id !== id); // keep id if not one we deleting
  res.json({ message: 'Removed from favorites', favorites});
});

//server health check
app.get('/api/health', (req, res) => {
   res.json({status: 'Server is running 🚀'});
});


//start server 
app.listen(PORT, async () => {
  console.log(`🎵 VibeFlow Backend running on http://localhost:${PORT}`);
  console.log(`API endpoints ready`);
  try{
    await getSpotifyToken();
  } catch (error) {
    console.error(`Failed to get initial token`);
  }
});
