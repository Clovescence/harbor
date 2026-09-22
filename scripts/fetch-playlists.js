const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const USER_ID = process.env.SPOTIFY_USER_ID;
const KEYWORD = '—'; // The em dash symbol you chose

if (!CLIENT_ID || !CLIENT_SECRET || !USER_ID) {
  console.error("Missing Spotify environment variables.");
  process.exit(1);
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

async function fetchPlaylists(token) {
  // Fetch up to 50 public playlists from the user
  const response = await fetch(`https://api.spotify.com/v1/users/${USER_ID}/playlists?limit=50`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch playlists: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.items;
}

async function run() {
  try {
    console.log(`Fetching access token...`);
    const token = await getAccessToken();
    
    console.log(`Fetching playlists for user: ${USER_ID}...`);
    const allPlaylists = await fetchPlaylists(token);
    
    console.log(`Found ${allPlaylists.length} total playlists. Filtering by keyword: "${KEYWORD}"...`);
    
    const filteredPlaylists = allPlaylists
      .filter(playlist => playlist && playlist.name && playlist.name.includes(KEYWORD))
      .map(playlist => {
        // Clean the name by removing the keyword and trimming whitespace
        const cleanName = playlist.name.replace(KEYWORD, '').trim();
        
        // Get the largest available image
        const imageUrl = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null;
        
        return {
          id: playlist.id,
          name: cleanName,
          description: playlist.description || '',
          url: playlist.external_urls.spotify,
          tracks: playlist.tracks.total,
          image: imageUrl
        };
      });
      
    console.log(`Successfully processed ${filteredPlaylists.length} portfolio playlists.`);
    
    // Save to public/data/playlists.json
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'playlists.json');
    fs.writeFileSync(outputPath, JSON.stringify(filteredPlaylists, null, 2));
    
    console.log(`Saved successfully to ${outputPath}`);
    
  } catch (err) {
    console.error("Error during Spotify sync:", err.message);
    process.exit(1);
  }
}

run();
