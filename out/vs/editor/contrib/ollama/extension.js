"use strict";
/**
 * VS Code Ollama Extension
 * Registers Ollama completion provider and auto QA analyzer
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ollamaProvider_1 = require("./ollamaProvider");
const qaAnalyzer_1 = require("./qaAnalyzer");
const suggestionEngine_1 = require("./suggestionEngine");
let provider;
let qaAnalyzer;
let suggestionEngine;
let diagnosticCollection;
function activate(context) {
    console.log('🚀 VS Code Ollama Extension activated');
    // Create providers
    provider = (0, ollamaProvider_1.createOllamaProvider)();
    qaAnalyzer = (0, qaAnalyzer_1.createAutoQAAnalyzer)();
    suggestionEngine = (0, suggestionEngine_1.createSuggestionEngine)();
    diagnosticCollection = vscode.languages.createDiagnosticCollection('ollama-qa');
    context.subscriptions.push(diagnosticCollection);
    // Start daily suggestions
    const showSuggestions = vscode.workspace
        .getConfiguration('vscodeOllama')
        .get('showDailySuggestions', true);
    if (showSuggestions) {
        suggestionEngine.startDailyReminders();
    }
    // Register inline completion provider for all languages
    const selector = { scheme: 'file' };
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(selector, provider));
    // Register command to toggle completions
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ollama.toggle', async () => {
        const config = vscode.workspace.getConfiguration('vscodeOllama');
        const enabled = config.get('enabled', true);
        await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        const newState = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Ollama completions ${newState}`);
    }));
    // Register command to check Ollama status
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ollama.checkStatus', async () => {
        try {
            const axios = require('axios');
            const config = vscode.workspace.getConfiguration('vscodeOllama');
            const host = config.get('host', 'http://142.54.161.210');
            const port = config.get('port', 11434);
            const response = await axios.get(`${host}:${port}/api/tags`, {
                timeout: 2000
            });
            const models = response.data.models || [];
            const modelList = models.map((m) => m.name).join(', ');
            vscode.window.showInformationMessage(`✅ Ollama connected\n\nAvailable models: ${modelList}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`❌ Ollama not responding\n\nCheck GPU server at 142.54.161.210:11434`);
        }
    }));
    // Watch for document changes and run QA analysis
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (event) => {
        const config = vscode.workspace.getConfiguration('vscodeOllama');
        if (config.get('qaEnabled', true)) {
            const diagnostics = await qaAnalyzer.analyzeDocument(event.document);
            diagnosticCollection.set(event.document.uri, diagnostics);
        }
    }));
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
    context.subscriptions.push(vscode.commands.registerCommand('vscode-ollama.toggleQA', async () => {
        const config = vscode.workspace.getConfiguration('vscodeOllama');
        const enabled = config.get('qaEnabled', true);
        await config.update('qaEnabled', !enabled, vscode.ConfigurationTarget.Global);
        const newState = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Ollama QA ${newState}`);
    }));
    console.log('✅ Ollama completions and QA ready');
}
function deactivate() {
    console.log('👋 VS Code Ollama Extension deactivated');
}
//# sourceMappingURL=extension.js.map