chrome.runtime.onInstalled.addListener(() => {
  console.log('Ollama Voice Assistant installed');

  chrome.storage.local.set({
    language: 'en-US',
    autoSend: true,
    notifications: true
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['language', 'autoSend', 'notifications'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});
