/**
 * Ollama Code Completion Provider
 * Connects to GPU-accelerated Ollama instance for AI-powered suggestions
 */
import { CancellationToken, InlineCompletionItem, InlineCompletionItemProvider, Position, TextDocument } from 'vscode';
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
export declare class OllamaInlineCompletionProvider implements InlineCompletionItemProvider {
    private config;
    private contextAnalyzer;
    private lastRequestTime;
    private pendingRequests;
    constructor(config: OllamaConfig);
    provideInlineCompletionItems(document: TextDocument, position: Position, _completionContext: any, token: CancellationToken): Promise<InlineCompletionItem[]>;
    private requestCompletions;
    private constructPrompt;
    private parseCompletions;
    private hashContext;
    updateConfig(newConfig: Partial<OllamaConfig>): void;
}
export declare function createOllamaProvider(): OllamaInlineCompletionProvider;
export {};
//# sourceMappingURL=ollamaProvider.d.ts.map