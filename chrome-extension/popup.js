const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.language = 'en-US';

let isListening = false;
let interimTranscript = '';
let finalTranscript = '';

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const transcript = document.getElementById('transcript');
const statusText = document.getElementById('statusText');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');

startBtn.addEventListener('click', () => {
  if (!isListening) {
    isListening = true;
    finalTranscript = '';
    interimTranscript = '';
    recognition.start();
    startBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    statusText.textContent = 'Listening...';
    transcript.textContent = 'Listening for voice input...';
    transcript.classList.add('empty');
  }
});

stopBtn.addEventListener('click', () => {
  if (isListening) {
    recognition.stop();
    isListening = false;
  }
});

recognition.addEventListener('start', () => {
  statusText.textContent = 'Listening...';
});

recognition.addEventListener('result', (event) => {
  interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcriptSegment = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      finalTranscript += transcriptSegment + ' ';
    } else {
      interimTranscript += transcriptSegment;
    }
  }

  const displayText = finalTranscript || interimTranscript || '';
  transcript.textContent = displayText;
  if (!displayText) {
    transcript.classList.add('empty');
    transcript.textContent = 'Listening for voice input...';
  } else {
    transcript.classList.remove('empty');
  }

  if (finalTranscript) {
    processCommand(finalTranscript.trim());
  }
});

recognition.addEventListener('end', () => {
  isListening = false;
  startBtn.style.display = 'flex';
  stopBtn.style.display = 'none';
  statusText.textContent = 'Ready to listen';

  if (!transcript.textContent || transcript.classList.contains('empty')) {
    transcript.textContent = 'No input captured. Click "Start Listening" to try again.';
  }
});

recognition.addEventListener('error', (event) => {
  console.error('Speech recognition error:', event.error);
  statusText.textContent = `Error: ${event.error}`;
  transcript.textContent = `Error: ${event.error}. Try again.`;
  isListening = false;
  startBtn.style.display = 'flex';
  stopBtn.style.display = 'none';
});

function processCommand(text) {
  const lowerText = text.toLowerCase();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    const command = parseCommand(lowerText);

    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'VOICE_COMMAND',
      command: command.type,
      text: command.text
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send message:', chrome.runtime.lastError);
      }
    });

    statusText.textContent = `Sent: ${command.type}`;
    setTimeout(() => {
      if (isListening) {
        statusText.textContent = 'Listening...';
      }
    }, 1500);
  });
}

function parseCommand(text) {
  if (text.startsWith('code ')) {
    return {
      type: 'INSERT_CODE',
      text: text.substring(5).trim()
    };
  } else if (text.includes('complete')) {
    return {
      type: 'REQUEST_COMPLETION',
      text: ''
    };
  } else if (text.includes('toggle ollama')) {
    return {
      type: 'TOGGLE_OLLAMA',
      text: ''
    };
  } else if (text.includes('check status')) {
    return {
      type: 'CHECK_STATUS',
      text: ''
    };
  } else if (text.includes('toggle qa') || text.includes('qa')) {
    return {
      type: 'TOGGLE_QA',
      text: ''
    };
  } else {
    return {
      type: 'INSERT_CODE',
      text: text
    };
  }
}

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage?.();
});

helpBtn.addEventListener('click', () => {
  const commands = `
Voice Commands:
- "code [text]" - Insert code
- "complete" - Request completion
- "toggle ollama" - Enable/disable
- "check status" - Check connection
- "qa" - Toggle quality analysis

Tips:
1. Speak clearly and naturally
2. Wait for the "Listening..." state
3. Commands are case-insensitive
4. Use "code" prefix for code snippets
  `;
  alert(commands);
});

window.addEventListener('load', () => {
  chrome.storage.local.get(['language'], (result) => {
    if (result.language) {
      recognition.language = result.language;
    }
  });
});
