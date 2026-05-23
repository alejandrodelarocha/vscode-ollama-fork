/**
 * Auto QA Analyzer
 * Real-time code quality analysis using Ollama
 */
import { TextDocument, Diagnostic } from 'vscode';
interface QAConfig {
    host: string;
    port: number;
    model: string;
    timeout: number;
    enabled: boolean;
}
export interface QAIssue {
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    code: string;
}
export declare class AutoQAAnalyzer {
    private config;
    private analysisCache;
    constructor(config: QAConfig);
    analyzeDocument(document: TextDocument): Promise<Diagnostic[]>;
    private requestQAAnalysis;
    private constructQAPrompt;
    private parseQAResponse;
    private issuesToDiagnostics;
    private severityToDiagnostic;
    private hashDocument;
    updateConfig(newConfig: Partial<QAConfig>): void;
}
export declare function createAutoQAAnalyzer(config?: Partial<QAConfig>): AutoQAAnalyzer;
export {};
//# sourceMappingURL=qaAnalyzer.d.ts.map