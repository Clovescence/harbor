export function initTerminal() {
  let clickCount = 0;
  let clickTimer = null;

  // Find the header elements
  const headers = document.querySelectorAll('.nav-brand, .home-title');
  
  headers.forEach(header => {
    if (header.textContent.trim().toUpperCase() === 'SEQUOIA') {
      header.addEventListener('click', (e) => {
        // Only count clicks if we aren't clicking a link that navigates away normally? 
        // We'll just count fast clicks.
        clickCount++;
        
        if (clickTimer) clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 1000);

        if (clickCount >= 3) {
          e.preventDefault(); // Prevent scrolling to top if it's an anchor
          clickCount = 0;
          openTerminal();
        }
      });
    }
  });
}

function openTerminal() {
  let overlay = document.querySelector('.terminal-overlay');
  
  if (!overlay) {
    overlay = createTerminalUI();
    document.body.appendChild(overlay);
    
    // Slight delay to allow DOM insertion before adding active class for transition
    requestAnimationFrame(() => {
      overlay.classList.add('active');
      document.querySelector('.terminal-input').focus();
    });
  } else {
    overlay.classList.add('active');
    document.querySelector('.terminal-input').focus();
  }
}

function closeTerminal() {
  const overlay = document.querySelector('.terminal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

function createTerminalUI() {
  const overlay = document.createElement('div');
  overlay.className = 'terminal-overlay';
  
  overlay.innerHTML = `
    <div class="terminal-window">
      <div class="terminal-header">
        <div class="terminal-buttons">
          <div class="terminal-btn close" title="Close"></div>
          <div class="terminal-btn minimize"></div>
          <div class="terminal-btn maximize"></div>
        </div>
        <div class="terminal-title">bash - SEQUOIA</div>
      </div>
      <div class="terminal-body" id="terminal-body">
        <div class="terminal-output" id="terminal-output">
          <div class="terminal-line system">Welcome to SEQUOIA secure terminal.</div>
          <div class="terminal-line system">Type 'help' to see available commands.</div>
        </div>
        <div class="terminal-input-row">
          <span class="terminal-prompt">guest@sequoia:~$</span>
          <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false" autofocus />
        </div>
      </div>
    </div>
  `;

  // Close when clicking outside the window or on close button
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeTerminal();
    }
  });

  const closeBtn = overlay.querySelector('.close');
  closeBtn.addEventListener('click', closeTerminal);

  const input = overlay.querySelector('.terminal-input');
  input.addEventListener('keydown', handleInput);

  // Keep focus on input when clicking inside the body
  const body = overlay.querySelector('.terminal-body');
  body.addEventListener('click', () => {
    // Only focus if we aren't selecting text
    if (window.getSelection().toString() === '') {
      input.focus();
    }
  });

  return overlay;
}

let isProcessing = false;
let chatHistory = [];

async function handleInput(e) {
  if (e.key !== 'Enter') return;
  if (isProcessing) return;

  const input = e.target;
  const command = input.value.trim();
  
  if (!command) return;

  input.value = '';
  appendLine(`guest@sequoia:~$ ${command}`, 'user');

  const lowerCmd = command.toLowerCase();

  if (lowerCmd === 'clear') {
    const output = document.getElementById('terminal-output');
    output.innerHTML = '';
    return;
  }

  if (lowerCmd === 'exit' || lowerCmd === 'close') {
    closeTerminal();
    return;
  }

  if (lowerCmd === 'help') {
    appendLine("Available commands:", 'system');
    appendLine("  clear   - Clear the terminal output", 'system');
    appendLine("  exit    - Close the terminal", 'system');
    appendLine("  help    - Show this help message", 'system');
    appendLine("  [text]  - Any other text will be sent to the AI assistant", 'system');
    return;
  }

  // Treat as chat message
  await sendToGemini(command);
}

async function sendToGemini(message) {
  isProcessing = true;
  const input = document.getElementById('terminal-input');
  input.disabled = true;

  const loadingLine = document.createElement('div');
  loadingLine.className = 'terminal-line system';
  loadingLine.innerHTML = `<span class="terminal-loading">Communicating with AI</span>`;
  document.getElementById('terminal-output').appendChild(loadingLine);
  scrollToBottom();

  try {
    // Push user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    loadingLine.remove();

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    appendLine(data.reply, 'ai');
    
    // Push AI response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: data.reply }]
    });

  } catch (error) {
    if (loadingLine.parentNode) loadingLine.remove();
    appendLine(`Error: ${error.message}`, 'system');
    // If it's a dev environment without the backend, give a hint
    if (error.message.includes('404')) {
      appendLine('Note: The backend endpoint (/api/chat) was not found. Are you running via Cloudflare Pages?', 'system');
    }
  } finally {
    isProcessing = false;
    input.disabled = false;
    input.focus();
    scrollToBottom();
  }
}

function appendLine(text, type = 'system') {
  const output = document.getElementById('terminal-output');
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  output.appendChild(line);
  scrollToBottom();
}

function scrollToBottom() {
  const body = document.getElementById('terminal-body');
  if (body) {
    body.scrollTop = body.scrollHeight;
  }
}
