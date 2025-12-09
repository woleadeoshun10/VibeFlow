import { useState, useEffect } from 'react' // for component reuse
import axios from 'axios' // for api calls
import './App.css'  // for styling

// API URL constant
const API_URL = 'http://localhost:3000/api'

// App function
function App() {
  const [selectedMood, setSelectedMood] = useState('') // array deconstruction for the mood selection
  const [playlists, setPlaylists] = useState([]) // array deconstruction for the playlists json rendered from backend
  const [favorites, setFavorites] = useState([]) // array deconstruction for the favorites json rendered from backend
  const [loading, setLoading] = useState(false) // to show buffering to user while API calls are made 

  // create mood array
  const moods = [
    { name: 'happy', emoji: '😊', label: 'Happy' },
    { name: 'chill', emoji: '😎', label: 'Chill' },
    { name: 'focus', emoji: '🎯', label: 'Focus' },
    { name: 'sad', emoji: '😢', label: 'Sad' },
    { name: 'afrobeats', emoji: '🇳🇬', label: 'Afrobeats' }
  ]

  // Fetch Playlist function
  const fetchPlaylists = async (mood) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/playlists/${mood}`)
      setPlaylists(response.data.playlists)
    } catch (error) {
      // log error for debugging
      console.error('Error fetching playlists', error)
      alert('Failed to fetch playlists. Make sure backend is running!')
    } finally {
      setLoading(false) // to stop buffering
    }
  }

  // Fetch Favorites from backend
  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API_URL}/favorites`)
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  // Add to Favorites
  const addToFavorites = async (playlist) => {
    try {
      const response = await axios.post(`${API_URL}/favorites`, { playlist })
      setFavorites(response.data.favorites)
      alert('Added to Favorites! ❤️')
    } catch (error) {
      console.error('Error adding to favorites:', error)
      if (error.response?.status === 400) {
        alert('Already in Favorites!')
      } else {
        alert('Failed to add to favorites')
      }
    }
  }

  // Remove from Favorites
  const removeFromFavorites = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/favorites/${id}`)
      setFavorites(response.data.favorites)
      alert('Removed from favorites!')
    } catch (error) {
      console.error('Error removing from favorites:', error)
      alert('Failed to remove from Favorites!')
    }
  }

  // Add Note to Favorites
  const updateNote = async (id, userNote) => {
    try {
      const response = await axios.patch(`${API_URL}/favorites/${id}`, { userNote })
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  // Open on Spotify
  const openInSpotify = (spotifyUrl) => {
    window.open(spotifyUrl, '_blank')
  }

  // Fetch favorites when app loads
  useEffect(() => {
    fetchFavorites()
  }, [])

  // return what to display on screen
  return (
    <div className='app'>
      {/* Header */}
      <header className='header'>
        <h1 className='title'>🎵 VIBEFLOW 🎵</h1>
        <p className='subtitle'>Find your Perfect Playlists Vibe</p>
      </header>

      {/* Mood Selector */}
      <section className='mood-section'>
        <h2 className='section-title'>Select Your Mood</h2>
        <div className='mood-buttons'>
          {/* Loop through moods array to create 5 buttons */}
          {moods.map(mood => (
            <button
              key={mood.name}
              className={`mood-btn ${selectedMood === mood.name ? 'active' : ''}`}
              onClick={() => { setSelectedMood(mood.name); fetchPlaylists(mood.name); }}>
              <span className='mood-emoji'>{mood.emoji}</span>
              <span className='mood-text'>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Playlist Display Section */}
      <section className='playlists-section'>
        <h2 className='section-title'>Playlists For You</h2>
        {loading ? (
          <div className='loading'>
            <div className='spinner'></div>
            <p>Loading your vibe...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className='empty-state'>
            <div className='empty-emoji'>😊</div>
            <p>Select a mood to see playlists!</p>
          </div>
        ) : (
          <div className='playlist-grid'>
            {playlists.map(playlist => (
              <div key={playlist.id} className='playlist-card'>
                <div className='playlist-image'>
                  {playlist.image ? (
                    <img src={playlist.image} alt={playlist.name} />
                  ) : (
                    <div className='placeholder'>🎵</div>
                  )}
                </div>
                <div className='playlist-info'>
                  <h3 className='playlist-name'>{playlist.name}</h3>
                  <p className='playlist-description'>{playlist.description}</p>
                  <p className='playlist-tracks'>{playlist.totalTracks} tracks</p>
                </div>
                <div className='playlist-actions'>
                  <button
                    className='btn btn-save'
                    onClick={() => addToFavorites(playlist)}>
                    ❤️ Save
                  </button>
                  <button
                    className='btn btn-play'
                    onClick={() => openInSpotify(playlist.spotifyUrl)}>
                    ▶️ Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <section className='favorites-section'>
          <h2 className='section-title'>⭐ Your Favorites</h2>
          <div className='playlist-grid'>
            {favorites.map(playlist => (
              <div key={playlist.id} className='playlist-card favorite-card'>
                <div className='playlist-image'>
                  {playlist.image ? (
                    <img src={playlist.image} alt={playlist.name} />
                  ) : (
                    <div className='placeholder'>🎵</div>
                  )}
                </div>
                <div className='playlist-info'>
                  <h3 className='playlist-name'>{playlist.name}</h3>
                  <p className='playlist-description'>{playlist.description}</p>
                  <p className='playlist-tracks'>{playlist.totalTracks} tracks</p>
                </div>
                <div className='user-note-section'>
                  <input
                    type='text'
                    className='note-input'
                    placeholder='Add a note... (e.g., "Perfect for workouts!")'
                    value={playlist.userNote || ''}
                    onChange={(e) => updateNote(playlist.id, e.target.value)}
                  />
                  {playlist.userNote && (
                    <div className='user-note'>
                      💭 {playlist.userNote}
                    </div>
                  )}
                </div>
                <div className='playlist-actions'>
                  <button
                    className='btn btn-remove'
                    onClick={() => removeFromFavorites(playlist.id)}>
                    🗑️ Remove
                  </button>
                  <button
                    className='btn btn-play'
                    onClick={() => openInSpotify(playlist.spotifyUrl)}>
                    ▶️ Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App
