export function initGuestbook() {
  const form = document.getElementById('guestbook-form');
  const nameInput = document.getElementById('gb-name');
  const messageInput = document.getElementById('gb-message');
  const list = document.getElementById('gb-list');
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !list) return;

  let messages = [];

  function renderMessages() {
    list.innerHTML = '';

    if (messages.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sans fw-300';
      empty.style.cssText = 'font-size: 0.9rem; color: var(--color-neutral); opacity: 0.5; padding: 20px 0;';
      empty.textContent = 'No messages yet. Be the first to sign.';
      list.appendChild(empty);
      return;
    }

    // Render newest first (if not already sorted newest-first by the backend, we reverse it)
    // The backend sorts oldest -> newest, so we reverse it for display
    [...messages].reverse().forEach(msg => {
      const el = document.createElement('div');
      el.style.cssText = 'padding: 20px 0; border-bottom: 1px solid rgba(201, 198, 184, 0.1);';

      const dateStr = new Date(msg.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="text-sans fw-500" style="font-size: 0.9rem; color: var(--color-text);">${escapeHTML(msg.name)}</span>
          <span class="text-sans fw-300" style="font-size: 0.75rem; color: var(--color-neutral); letter-spacing: 0.05em;">${dateStr}</span>
        </div>
        <p class="text-sans fw-300" style="font-size: 0.9rem; color: var(--color-neutral); margin: 0; line-height: 1.6;">${escapeHTML(msg.message)}</p>
      `;
      list.appendChild(el);
    });
  }

  async function fetchMessages() {
    try {
      const res = await fetch('/api/guestbook');
      if (res.ok) {
        messages = await res.json();
        renderMessages();
      } else {
        // Fallback to empty if not configured yet
        renderMessages();
      }
    } catch (err) {
      console.error('Failed to load guestbook:', err);
    }
  }

  // Load initial messages
  fetchMessages();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    // Loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Signing...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, message })
      });

      if (res.ok) {
        messages = await res.json();
        
        // Reset form
        nameInput.value = '';
        messageInput.value = '';
        renderMessages();
      } else {
        const errorData = await res.json();
        console.error('Failed to sign guestbook:', errorData.error);
        alert('Could not sign guestbook: ' + (errorData.error || 'Server error'));
      }
    } catch (err) {
      console.error('Failed to submit message:', err);
      alert('Could not connect to the server.');
    } finally {
      // Restore button
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
}
