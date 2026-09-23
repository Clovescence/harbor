const KV_KEY = 'messages';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_KEEP = 3;

function pruneMessages(msgs) {
  const now = Date.now();
  // Sort oldest -> newest
  const sorted = [...msgs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Always keep the newest MIN_KEEP, regardless of age
  const mustKeep = sorted.slice(-MIN_KEEP);
  const candidates = sorted.slice(0, -MIN_KEEP);
  
  // From the candidates, only keep those within 7 days
  const stillFresh = candidates.filter(m => now - new Date(m.date) < SEVEN_DAYS_MS);
  return [...stillFresh, ...mustKeep];
}

export async function onRequestGet(context) {
  if (!context.env.GUESTBOOK) {
    return new Response(JSON.stringify({ error: 'KV namespace not bound. Please bind a KV namespace named GUESTBOOK in Cloudflare.' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await context.env.GUESTBOOK.get(KV_KEY);
    const messages = data ? JSON.parse(data) : [];
    
    // Prune on read to ensure we don't serve expired messages
    const pruned = pruneMessages(messages);
    
    return new Response(JSON.stringify(pruned), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  if (!context.env.GUESTBOOK) {
    return new Response(JSON.stringify({ error: 'KV namespace not bound' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const newMsg = await context.request.json();
    
    if (!newMsg.name || !newMsg.message) {
      return new Response(JSON.stringify({ error: 'Name and message required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Assign server-side timestamp
    newMsg.date = new Date().toISOString();
    
    // Basic length constraints
    newMsg.name = newMsg.name.trim().substring(0, 60);
    newMsg.message = newMsg.message.trim().substring(0, 500);

    const data = await context.env.GUESTBOOK.get(KV_KEY);
    let messages = data ? JSON.parse(data) : [];
    
    messages.push(newMsg);
    messages = pruneMessages(messages);
    
    // Save updated list back to KV
    await context.env.GUESTBOOK.put(KV_KEY, JSON.stringify(messages));
    
    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
