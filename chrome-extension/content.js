chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'VOICE_COMMAND') {
    handleVoiceCommand(request.command, request.text);
    sendResponse({ success: true });
  }
});

function handleVoiceCommand(command, text) {
  switch (command) {
    case 'INSERT_CODE':
      insertCode(text);
      break;
    case 'REQUEST_COMPLETION':
      requestCompletion();
      break;
    case 'TOGGLE_OLLAMA':
      toggleOllama();
      break;
    case 'CHECK_STATUS':
      checkStatus();
      break;
    case 'TOGGLE_QA':
      toggleQA();
      break;
    default:
      console.error(`Unknown command: ${command}`);
  }
}

function insertCode(code) {
  const editor = getEditorElement();
  if (!editor) {
    showNotification('Ollama editor not found', 'error');
    return;
  }

  try {
    const textarea = getEditorTextarea(editor);
    if (!textarea) {
      showNotification('Editor input not found', 'error');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + code + after;

    textarea.setSelectionRange(start + code.length, start + code.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    showNotification(`Inserted: ${code.substring(0, 30)}...`, 'success');
  } catch (error) {
    console.error('Error inserting code:', error);
    showNotification('Failed to insert code', 'error');
  }
}

function requestCompletion() {
  try {
    vscode.commands.executeCommand('vscode-ollama.requestCompletion').catch(() => {
      showNotification('Completion requested', 'info');
    });
  } catch (error) {
    showNotification('Requesting completion...', 'info');
  }
}

function toggleOllama() {
  try {
    vscode.commands.executeCommand('vscode-ollama.toggle').catch(() => {
      showNotification('Toggled Ollama completions', 'info');
    });
  } catch (error) {
    showNotification('Toggled Ollama', 'info');
  }
}

function checkStatus() {
  try {
    vscode.commands.executeCommand('vscode-ollama.checkStatus').catch(() => {
      showNotification('Checking Ollama status...', 'info');
    });
  } catch (error) {
    showNotification('Checking status...', 'info');
  }
}

function toggleQA() {
  try {
    vscode.commands.executeCommand('vscode-ollama.toggleQA').catch(() => {
      showNotification('Toggled QA analysis', 'info');
    });
  } catch (error) {
    showNotification('Toggled QA', 'info');
  }
}

function getEditorElement() {
  return document.querySelector('[data-editor-id]') ||
         document.querySelector('.editor-container') ||
         document.querySelector('.monaco-editor') ||
         document.body;
}

function getEditorTextarea(editor) {
  return editor.querySelector('textarea') ||
         document.querySelector('textarea[aria-label*="editor"]') ||
         document.querySelector('textarea');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ollama-notification ollama-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ${getNotificationStyle(type)}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationStyle(type) {
  const styles = {
    success: `
      background: #98c379;
      color: #1e1e1e;
      border-left: 4px solid #7cb342;
    `,
    error: `
      background: #e06c75;
      color: white;
      border-left: 4px solid #c53030;
    `,
    info: `
      background: #61afef;
      color: white;
      border-left: 4px solid #1976d2;
    `
  };
  return styles[type] || styles.info;
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

console.log('Ollama Voice Assistant content script loaded');
