/**
 * Code Context Analyzer
 * Extracts relevant code context for Ollama completions
 */
import { Position, TextDocument } from 'vscode';
export declare class ContextAnalyzer {
    private contextLines;
    constructor(contextLines?: number);
    /**
     * Extract code context around cursor position
     */
    extractContext(document: TextDocument, position: Position): string;
    /**
     * Get file type/language hint
     */
    getLanguageHint(document: TextDocument): string;
    /**
     * Detect if we're inside a string or comment
     */
    isInsideStringOrComment(document: TextDocument, position: Position): boolean;
    /**
     * Get indentation level
     */
    getIndentation(document: TextDocument, line: number): string;
    /**
     * Extract function/class scope
     */
    extractScope(document: TextDocument, position: Position): string;
    /**
     * Check if this is a valid completion point
     */
    isValidCompletionPoint(document: TextDocument, position: Position): boolean;
}
//# sourceMappingURL=contextAnalyzer.d.ts.map