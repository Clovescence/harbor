export default async function handler(req, res) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Missing Spotify Secrets' });
  }

  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    // 1. Get Access Token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'refresh_token',
        'refresh_token': REFRESH_TOKEN
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Currently Playing
    let response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    // 204 No Content means nothing is playing right now.
    // In that case, fetch Recently Played.
    if (response.status === 204 || response.status > 400) {
      response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
         return res.status(200).json({ isPlaying: false });
      }
      
      const track = data.items[0].track;
      return res.status(200).json({
        isPlaying: false,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumUrl: track.album.images[0]?.url,
        songUrl: track.external_urls.spotify
      });
    }

    const data = await response.json();
    if (!data.item) {
      return res.status(200).json({ isPlaying: false });
    }

    const track = data.item;
    return res.status(200).json({
      isPlaying: data.is_playing,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumUrl: track.album.images[0]?.url,
      songUrl: track.external_urls.spotify
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
