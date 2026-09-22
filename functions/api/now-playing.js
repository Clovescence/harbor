export async function onRequest(context) {
  const CLIENT_ID = context.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = context.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = context.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing Spotify Secrets in Cloudflare' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Cloudflare Workers use btoa instead of Buffer for base64 encoding
    const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    
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
    if (!tokenResponse.ok) {
        throw new Error("Failed to refresh token from Spotify");
    }
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
         return new Response(JSON.stringify({ isPlaying: false }), {
           headers: { 'Content-Type': 'application/json' }
         });
      }
      
      const track = data.items[0].track;
      return new Response(JSON.stringify({
        isPlaying: false,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumUrl: track.album.images[0]?.url,
        songUrl: track.external_urls.spotify
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    if (!data.item) {
        return new Response(JSON.stringify({ isPlaying: false }), {
          headers: { 'Content-Type': 'application/json' }
        });
    }

    const track = data.item;
    return new Response(JSON.stringify({
      isPlaying: data.is_playing,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumUrl: track.album.images[0]?.url,
      songUrl: track.external_urls.spotify
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
