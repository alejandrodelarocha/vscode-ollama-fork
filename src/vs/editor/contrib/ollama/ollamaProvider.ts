/**
 * Ollama Code Completion Provider
 * Connects to GPU-accelerated Ollama instance for AI-powered suggestions
 */

import * as axios from 'axios';
import { CancellationToken, InlineCompletionItem, InlineCompletionItemProvider, Position, TextDocument } from 'vscode';
import { ContextAnalyzer } from './contextAnalyzer';

interface OllamaConfig {
  host: string;
  port: number;
  model: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
  contextLines: number;
  debounceMs: number;
}

export class OllamaInlineCompletionProvider implements InlineCompletionItemProvider {
  private config: OllamaConfig;
  private contextAnalyzer: ContextAnalyzer;
  private lastRequestTime = 0;
  private pendingRequests = new Map<string, Promise<InlineCompletionItem[]>>();

  constructor(config: OllamaConfig) {
    this.config = config;
    this.contextAnalyzer = new ContextAnalyzer(config.contextLines);
  }

  async provideInlineCompletionItems(
    document: TextDocument,
    position: Position,
    _completionContext: any,
    token: CancellationToken
  ): Promise<InlineCompletionItem[]> {
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
        return await this.pendingRequests.get(contextHash)!;
      }

      // Request completions from Ollama
      const promise = this.requestCompletions(context, token);
      this.pendingRequests.set(contextHash, promise);

      const completions = await promise;
      this.pendingRequests.delete(contextHash);

      return completions;
    } catch (error) {
      console.error('[Ollama] Completion error:', error);
      return [];
    }
  }

  private async requestCompletions(
    context: string,
    token: CancellationToken
  ): Promise<InlineCompletionItem[]> {
    const prompt = this.constructPrompt(context);

    try {
      const response = await axios.default.post(
        `${this.config.host}:${this.config.port}/api/generate`,
        {
          model: this.config.model,
          prompt,
          stream: false,
          num_predict: this.config.maxTokens,
          temperature: this.config.temperature,
          top_k: 40,
          top_p: 0.9,
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (token.isCancellationRequested) {
        return [];
      }

      const completion = response.data.response || '';
      return this.parseCompletions(completion);
    } catch (error) {
      console.error('[Ollama] Request failed:', error);
      return [];
    }
  }

  private constructPrompt(context: string): string {
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

  private parseCompletions(rawCompletion: string): InlineCompletionItem[] {
    const completions: InlineCompletionItem[] = [];

    // Clean up the completion
    const cleaned = rawCompletion
      .trim()
      .split('\n')[0] // Take only first line
      .replace(/^[\s\t]+/, '') // Remove leading whitespace
      .substring(0, 100); // Limit to 100 chars

    if (cleaned.length > 0) {
      completions.push(new InlineCompletionItem(cleaned));
    }

    // Also try to extract alternative completions if separated by newlines
    const lines = rawCompletion.split('\n').filter(l => l.trim().length > 0);
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      const alt = lines[i].substring(0, 100);
      if (alt.length > 0 && alt !== cleaned) {
        completions.push(new InlineCompletionItem(alt));
      }
    }

    return completions;
  }

  private hashContext(context: string): string {
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < Math.min(context.length, 50); i++) {
      const char = context.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  updateConfig(newConfig: Partial<OllamaConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export function createOllamaProvider(): OllamaInlineCompletionProvider {
  const config: OllamaConfig = {
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
