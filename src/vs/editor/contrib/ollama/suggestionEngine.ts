/**
 * Suggestion Engine
 * Daily contextual prompts inspired by Lovable
 * Shows 5 helpful suggestions spaced throughout the day
 */

import * as vscode from 'vscode';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
  icon: string;
  category: 'feature' | 'productivity' | 'tips' | 'settings' | 'discovery';
}

export class SuggestionEngine {
  private lastSuggestionTime = 0;
  private suggestionInterval = 3600000; // 1 hour between suggestions
  private dailyMax = 5;
  private dailySuggestionCount = 0;
  private lastResetDate = new Date().toDateString();

  constructor() {
    this.resetDailyCount();
  }

  private resetDailyCount() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySuggestionCount = 0;
      this.lastResetDate = today;
    }
  }

  async showRandomSuggestion(): Promise<void> {
    this.resetDailyCount();

    // Check if we've hit daily limit
    if (this.dailySuggestionCount >= this.dailyMax) {
      return;
    }

    // Check throttle (show max 1 per hour)
    const now = Date.now();
    if (now - this.lastSuggestionTime < this.suggestionInterval) {
      return;
    }

    this.lastSuggestionTime = now;
    const suggestions = this.buildSuggestions();
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    this.presentSuggestion(suggestion);
    this.dailySuggestionCount++;
  }

  private buildSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [
      {
        id: 'qa-enabled',
        title: '✨ Auto QA Found Issues?',
        description: 'Click "View Problems" to see code quality suggestions from Ollama',
        action: async () => {
          vscode.commands.executeCommand('workbench.panel.markers.view.focus');
        },
        icon: '🔍',
        category: 'feature',
      },
      {
        id: 'customize-model',
        title: '⚡ Try a Different Model',
        description: 'Ollama supports mistral:7b (faster) or llama3.1:70b (better quality). Swap in settings.',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscodeOllama.model');
        },
        icon: '🧠',
        category: 'settings',
      },
      {
        id: 'temperature-tuning',
        title: '🎛️ Adjust Temperature for Style',
        description: 'Lower temperature (0.1-0.3) = predictable code. Higher (0.7-0.9) = creative. Try it!',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscodeOllama.temperature');
        },
        icon: '🔥',
        category: 'tips',
      },
      {
        id: 'context-window',
        title: '📚 Expand Context Window',
        description: 'Increase contextLines from 50 to 100 for better understanding of large files.',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscodeOllama.contextLines');
        },
        icon: '🔍',
        category: 'settings',
      },
      {
        id: 'gpu-status',
        title: '🚀 Check GPU Status',
        description: 'Verify Ollama is running and responsive with one click.',
        action: async () => {
          vscode.commands.executeCommand('vscode-ollama.checkStatus');
        },
        icon: '💻',
        category: 'productivity',
      },
      {
        id: 'theme-dark',
        title: '🎨 Try Ollama Dark Theme',
        description: 'Optimized colors for code completion visibility. Switch in Preferences → Color Theme.',
        action: async () => {
          vscode.commands.executeCommand('workbench.colorTheme.select', 'Ollama Dark');
        },
        icon: '🌙',
        category: 'discovery',
      },
      {
        id: 'debounce-tuning',
        title: '⏱️ Adjust Request Debounce',
        description: 'Increase debounceMs for slower networks, decrease for instant feedback.',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscodeOllama.debounceMs');
        },
        icon: '⚙️',
        category: 'settings',
      },
      {
        id: 'qa-toggle',
        title: '🔍 Toggle Auto QA On/Off',
        description: 'Disable QA for faster typing, or enable for real-time code analysis.',
        action: async () => {
          vscode.commands.executeCommand('vscode-ollama.toggleQA');
        },
        icon: '✓',
        category: 'feature',
      },
      {
        id: 'completion-toggle',
        title: '✍️ Toggle Completions',
        description: 'Quickly enable/disable Ollama code suggestions with one command.',
        action: async () => {
          vscode.commands.executeCommand('vscode-ollama.toggle');
        },
        icon: '✏️',
        category: 'feature',
      },
      {
        id: 'keyboard-shortcuts',
        title: '⌨️ Learn Keyboard Shortcuts',
        description: 'Tab = accept completion, Esc = dismiss. Customize in Keyboard Shortcuts settings.',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
        },
        icon: '🎹',
        category: 'tips',
      },
      {
        id: 'max-tokens',
        title: '📝 Control Completion Length',
        description: 'Lower maxTokens (50) for quick snippets, higher (200) for full functions.',
        action: async () => {
          vscode.commands.executeCommand('workbench.action.openSettings', 'vscodeOllama.maxTokens');
        },
        icon: '📖',
        category: 'settings',
      },
      {
        id: 'language-support',
        title: '🌍 Ollama Works with Any Language',
        description: 'JavaScript, Python, Rust, Go, C++, Java... Try it in your favorite language!',
        action: async () => {
          vscode.window.showInformationMessage(
            'Ollama supports all VS Code languages. Start typing to get completions!'
          );
        },
        icon: '🚀',
        category: 'discovery',
      },
    ];

    return suggestions;
  }

  private async presentSuggestion(suggestion: Suggestion): Promise<void> {
    const choice = await vscode.window.showInformationMessage(
      `${suggestion.icon} ${suggestion.title}\n\n${suggestion.description}`,
      { title: 'Got it', isCloseAffordance: true },
      { title: 'Try it', isCloseAffordance: false }
    );

    if (choice && choice.title === 'Try it') {
      await suggestion.action();
    }
  }

  getSuggestions(): Suggestion[] {
    return this.buildSuggestions();
  }

  startDailyReminders(onSuggestions?: (suggestions: Suggestion[]) => void): void {
    // Show first suggestion after 5 minutes
    setTimeout(() => {
      if (onSuggestions) {
        const suggestions = this.buildSuggestions();
        onSuggestions(suggestions);
      } else {
        this.showRandomSuggestion();
      }
    }, 300000);

    // Then show one every hour
    setInterval(() => {
      if (onSuggestions) {
        const suggestions = this.buildSuggestions();
        onSuggestions(suggestions);
      } else {
        this.showRandomSuggestion();
      }
    }, this.suggestionInterval);

    // Reset at midnight
    this.scheduleNextReset();
  }

  private scheduleNextReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      this.resetDailyCount();
      this.scheduleNextReset();
    }, msUntilMidnight);
  }
}

export function createSuggestionEngine(): SuggestionEngine {
  return new SuggestionEngine();
}
