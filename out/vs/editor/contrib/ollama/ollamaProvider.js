"use strict";
/**
 * Ollama Code Completion Provider
 * Connects to GPU-accelerated Ollama instance for AI-powered suggestions
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
exports.OllamaInlineCompletionProvider = void 0;
exports.createOllamaProvider = createOllamaProvider;
const axios = __importStar(require("axios"));
const vscode_1 = require("vscode");
const contextAnalyzer_1 = require("./contextAnalyzer");
class OllamaInlineCompletionProvider {
    constructor(config) {
        this.lastRequestTime = 0;
        this.pendingRequests = new Map();
        this.config = config;
        this.contextAnalyzer = new contextAnalyzer_1.ContextAnalyzer(config.contextLines);
    }
    async provideInlineCompletionItems(document, position, _completionContext, token) {
        // Debounce rapid requests
        const now = Date.now();
        if (now - this.lastRequestTime < this.config.debounceMs) {
            return [];
        }
        this.lastRequestTime = now;
        try {
            // Extract code context around cursor position
            const context = this.contextAnalyzer.extractContext(document, position);
            if (!context || context.trim().length === 0) {
                return [];
            }
            // Check if we already have a pending request for this context
            const contextHash = this.hashContext(context);
            if (this.pendingRequests.has(contextHash)) {
                return await this.pendingRequests.get(contextHash);
            }
            // Request completions from Ollama
            const promise = this.requestCompletions(context, token);
            this.pendingRequests.set(contextHash, promise);
            const completions = await promise;
            this.pendingRequests.delete(contextHash);
            return completions;
        }
        catch (error) {
            console.error('[Ollama] Completion error:', error);
            return [];
        }
    }
    async requestCompletions(context, token) {
        const prompt = this.constructPrompt(context);
        try {
            const response = await axios.default.post(`${this.config.host}:${this.config.port}/api/generate`, {
                model: this.config.model,
                prompt,
                stream: false,
                num_predict: this.config.maxTokens,
                temperature: this.config.temperature,
                top_k: 40,
                top_p: 0.9,
            }, {
                timeout: this.config.timeout,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (token.isCancellationRequested) {
                return [];
            }
            const completion = response.data.response || '';
            return this.parseCompletions(completion);
        }
        catch (error) {
            console.error('[Ollama] Request failed:', error);
            return [];
        }
    }
    constructPrompt(context) {
        // Remove the context marker and incomplete line for the prompt
        const lines = context.split('\n');
        const lastLine = lines[lines.length - 1];
        const precedingContext = lines.slice(0, -1).join('\n');
        return `You are a code completion engine. Complete the following code snippet.
Only provide the completion, nothing else. Do not repeat the context.
Do not add explanations or comments.

Context:
\`\`\`
${precedingContext}
\`\`\`

Complete this line:
${lastLine}`;
    }
    parseCompletions(rawCompletion) {
        const completions = [];
        // Clean up the completion
        const cleaned = rawCompletion
            .trim()
            .split('\n')[0] // Take only first line
            .replace(/^[\s\t]+/, '') // Remove leading whitespace
            .substring(0, 100); // Limit to 100 chars
        if (cleaned.length > 0) {
            completions.push(new vscode_1.InlineCompletionItem(cleaned));
        }
        // Also try to extract alternative completions if separated by newlines
        const lines = rawCompletion.split('\n').filter(l => l.trim().length > 0);
        for (let i = 1; i < Math.min(lines.length, 4); i++) {
            const alt = lines[i].substring(0, 100);
            if (alt.length > 0 && alt !== cleaned) {
                completions.push(new vscode_1.InlineCompletionItem(alt));
            }
        }
        return completions;
    }
    hashContext(context) {
        // Simple hash for deduplication
        let hash = 0;
        for (let i = 0; i < Math.min(context.length, 50); i++) {
            const char = context.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
exports.OllamaInlineCompletionProvider = OllamaInlineCompletionProvider;
function createOllamaProvider() {
    const config = {
        host: process.env.OLLAMA_HOST || 'http://142.54.161.210',
        port: parseInt(process.env.OLLAMA_PORT || '11434'),
        model: process.env.VSCODE_OLLAMA_MODEL || 'qwen3:14b',
        timeout: 5000,
        maxTokens: 100,
        temperature: 0.3,
        contextLines: 50,
        debounceMs: 300,
    };
    return new OllamaInlineCompletionProvider(config);
}
//# sourceMappingURL=ollamaProvider.js.map