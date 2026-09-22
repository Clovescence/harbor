import http from 'http';
import { URL } from 'url';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('\n=== Spotify OAuth Setup Helper ===\n');
  console.log('You need to add exactly this Redirect URI to your Spotify App in the Developer Dashboard:');
  console.log('http://127.0.0.1:8888/callback\n');
  
  const clientId = await ask('Enter your Spotify Client ID: ');
  const clientSecret = await ask('Enter your Spotify Client Secret: ');
  
  if (!clientId || !clientSecret) {
    console.error('Client ID and Secret are required.');
    process.exit(1);
  }

  const redirectUri = 'http://127.0.0.1:8888/callback';
  const scope = 'playlist-read-private playlist-read-collaborative';

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    
    if (reqUrl.pathname === '/callback') {
      const code = reqUrl.searchParams.get('code');
      
      if (code) {
        try {
          const auth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri
            })
          });
          
          const data = await response.json();
          
          if (data.refresh_token) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Success!</h1><p>You can close this tab and check your terminal.</p>');
            
            console.log('\n✅ SUCCESS! Here is your Refresh Token:\n');
            console.log('====================================================');
            console.log(data.refresh_token);
            console.log('====================================================\n');
            console.log('Copy the token above and add it to GitHub Secrets as: SPOTIFY_REFRESH_TOKEN');
            
            process.exit(0);
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Failed to get refresh token. Check terminal for error.');
            console.error('Error from Spotify:', data);
            process.exit(1);
          }
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Server Error.');
          console.error(err);
          process.exit(1);
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('No code provided.');
        process.exit(1);
      }
    }
  });

  server.listen(8888, () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId.trim()}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('\nServer is running on port 8888.');
    console.log('\n👉 CTRL+CLICK THE LINK BELOW TO AUTHORIZE YOUR ACCOUNT:');
    console.log(authUrl);
  });
}

run();
