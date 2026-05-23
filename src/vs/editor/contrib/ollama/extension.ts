/**
 * VS Code Ollama Extension
 * Registers Ollama completion provider and auto QA analyzer
 */

import * as vscode from 'vscode';
import { createOllamaProvider } from './ollamaProvider';
import { createAutoQAAnalyzer, AutoQAAnalyzer } from './qaAnalyzer';
import { createSuggestionEngine, SuggestionEngine } from './suggestionEngine';
import { createSuggestionPanel, SuggestionPanel } from './suggestionPanel';

let provider: any;
let qaAnalyzer: AutoQAAnalyzer;
let suggestionEngine: SuggestionEngine;
let suggestionPanel: SuggestionPanel;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 VS Code Ollama Extension activated');

  // Create providers
  provider = createOllamaProvider();
  qaAnalyzer = createAutoQAAnalyzer();
  suggestionEngine = createSuggestionEngine();
  suggestionPanel = createSuggestionPanel(context.extensionUri);
  diagnosticCollection = vscode.languages.createDiagnosticCollection('ollama-qa');
  context.subscriptions.push(diagnosticCollection);

  // Start daily suggestions with panel
  const showSuggestions = vscode.workspace
    .getConfiguration('vscodeOllama')
    .get('showDailySuggestions', true);
  if (showSuggestions) {
    suggestionEngine.startDailyReminders(() => {
      const suggestions = suggestionEngine.getSuggestions();
      suggestionPanel.show(suggestions);
    });
  }

  // Register inline completion provider for all languages
  const selector = { scheme: 'file' };

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      selector,
      provider
    )
  );

  // Register command to toggle completions
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-ollama.toggle',
      async () => {
        const config = vscode.workspace.getConfiguration('vscodeOllama');
        const enabled = config.get('enabled', true);
        await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);

        const newState = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Ollama completions ${newState}`);
      }
    )
  );

  // Register command to check Ollama status
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-ollama.checkStatus',
      async () => {
        try {
          const axios = require('axios');
          const config = vscode.workspace.getConfiguration('vscodeOllama');
          const host = config.get('host', 'http://142.54.161.210');
          const port = config.get('port', 11434);

          const response = await axios.get(`${host}:${port}/api/tags`, {
            timeout: 2000
          });

          const models = response.data.models || [];
          const modelList = models.map((m: any) => m.name).join(', ');

          vscode.window.showInformationMessage(
            `✅ Ollama connected\n\nAvailable models: ${modelList}`
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `❌ Ollama not responding\n\nCheck GPU server at 142.54.161.210:11434`
          );
        }
      }
    )
  );

  // Watch for document changes and run QA analysis
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const config = vscode.workspace.getConfiguration('vscodeOllama');
      if (config.get('qaEnabled', true)) {
        const diagnostics = await qaAnalyzer.analyzeDocument(event.document);
        diagnosticCollection.set(event.document.uri, diagnostics);
      }
    })
  );

  // Initial QA analysis for open documents
  vscode.workspace.textDocuments.forEach(async (doc) => {
    const config = vscode.workspace.getConfiguration('vscodeOllama');
    if (config.get('qaEnabled', true)) {
      const diagnostics = await qaAnalyzer.analyzeDocument(doc);
      diagnosticCollection.set(doc.uri, diagnostics);
    }
  });

  // Watch config changes
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('vscodeOllama')) {
      const config = vscode.workspace.getConfiguration('vscodeOllama');
      provider.updateConfig({
        host: config.get('host'),
        port: config.get('port'),
        model: config.get('model'),
        timeout: config.get('timeout'),
        maxTokens: config.get('maxTokens'),
        temperature: config.get('temperature'),
        contextLines: config.get('contextLines'),
        debounceMs: config.get('debounceMs'),
      });
      qaAnalyzer.updateConfig({
        host: config.get('host'),
        port: config.get('port'),
        model: config.get('model'),
        timeout: config.get('timeout'),
        enabled: config.get('qaEnabled', true),
      });
      console.log('📝 Ollama config updated');
    }
  });

  // Register command to toggle QA
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-ollama.toggleQA',
      async () => {
        const config = vscode.workspace.getConfiguration('vscodeOllama');
        const enabled = config.get('qaEnabled', true);
        await config.update('qaEnabled', !enabled, vscode.ConfigurationTarget.Global);

        const newState = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Ollama QA ${newState}`);
      }
    )
  );

  // Register command to show suggestions panel
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-ollama.showSuggestions',
      async () => {
        const suggestions = suggestionEngine.getSuggestions();
        suggestionPanel.show(suggestions);
      }
    )
  );

  console.log('✅ Ollama completions, QA, and daily tips ready');
}

export function deactivate() {
  console.log('👋 VS Code Ollama Extension deactivated');
}
