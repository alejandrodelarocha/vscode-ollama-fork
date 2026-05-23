"use strict";
/**
 * Suggestion Panel
 * Persistent sidebar panel for daily Ollama suggestions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionPanel = void 0;
exports.createSuggestionPanel = createSuggestionPanel;
const vscode = __importStar(require("vscode"));
class SuggestionPanel {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.suggestions = [];
        this.viewedSuggestions = new Set();
        this.lastReset = new Date().toDateString();
    }
    show(suggestions) {
        this.suggestions = suggestions;
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
        }
        else {
            this.panel = vscode.window.createWebviewPanel('ollamaSuggestions', 'Ollama Daily Tips', { viewColumn: vscode.ViewColumn.Two, preserveFocus: true }, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri],
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
            this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this));
        }
        this.updatePanel();
    }
    handleMessage(message) {
        if (message.command === 'action') {
            const suggestion = this.suggestions.find(s => s.id === message.id);
            if (suggestion) {
                suggestion.action();
                this.viewedSuggestions.add(suggestion.id);
                this.updatePanel();
            }
        }
        else if (message.command === 'dismiss') {
            this.viewedSuggestions.add(message.id);
            this.updatePanel();
        }
    }
    updatePanel() {
        if (!this.panel)
            return;
        const today = new Date().toDateString();
        if (today !== this.lastReset) {
            this.viewedSuggestions.clear();
            this.lastReset = today;
        }
        const remaining = this.suggestions.filter(s => !this.viewedSuggestions.has(s.id));
        const progressPercent = Math.round(((this.viewedSuggestions.size) / this.suggestions.length) * 100);
        this.panel.webview.html = this.getWebviewContent(remaining, progressPercent);
    }
    getWebviewContent(suggestions, progressPercent) {
        const suggestionsHtml = suggestions
            .map(s => `
      <div class="suggestion-card ${s.category}">
        <div class="suggestion-header">
          <span class="suggestion-icon">${s.icon}</span>
          <h3>${s.title}</h3>
          <button class="dismiss-btn" onclick="dismissSuggestion('${s.id}')" title="Dismiss">×</button>
        </div>
        <p class="suggestion-description">${s.description}</p>
        <button class="action-btn" onclick="takeSuggestionAction('${s.id}')">
          Try It →
        </button>
      </div>
    `)
            .join('');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ollama Daily Tips</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 16px;
      font-size: 13px;
      line-height: 1.5;
    }

    .header {
      margin-bottom: 20px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      height: 4px;
      background: var(--vscode-progressBar-background);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #60a5fa, #3b82f6);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
    }

    .suggestions-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .suggestion-card {
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-sideBarSectionHeader-border);
      border-radius: 6px;
      padding: 12px;
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }

    .suggestion-card.feature {
      border-left: 3px solid #60a5fa;
    }

    .suggestion-card.productivity {
      border-left: 3px solid #f59e0b;
    }

    .suggestion-card.tips {
      border-left: 3px solid #8b5cf6;
    }

    .suggestion-card.settings {
      border-left: 3px solid #06b6d4;
    }

    .suggestion-card.discovery {
      border-left: 3px solid #10b981;
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      position: relative;
    }

    .suggestion-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .suggestion-header h3 {
      font-size: 13px;
      font-weight: 600;
      flex: 1;
      word-break: break-word;
    }

    .dismiss-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .dismiss-btn:hover {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }

    .suggestion-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .action-btn {
      width: 100%;
      padding: 6px 12px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: 1px solid var(--vscode-button-border);
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .action-btn:active {
      transform: scale(0.98);
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .empty-state-text {
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span>💡</span>
      <span>Daily Tips</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progressPercent}%"></div>
    </div>
    <div class="progress-text">${this.viewedSuggestions.size} of ${this.suggestions.length} viewed today</div>
  </div>

  <div class="suggestions-container">
    ${suggestions.length > 0
            ? suggestionsHtml
            : `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-text">
          All tips viewed!<br>
          Come back tomorrow for more.
        </div>
      </div>
    `}
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function takeSuggestionAction(id) {
      vscode.postMessage({
        command: 'action',
        id: id
      });
    }

    function dismissSuggestion(id) {
      vscode.postMessage({
        command: 'dismiss',
        id: id
      });
    }
  </script>
</body>
</html>`;
    }
    hide() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
exports.SuggestionPanel = SuggestionPanel;
function createSuggestionPanel(extensionUri) {
    return new SuggestionPanel(extensionUri);
}
//# sourceMappingURL=suggestionPanel.js.map