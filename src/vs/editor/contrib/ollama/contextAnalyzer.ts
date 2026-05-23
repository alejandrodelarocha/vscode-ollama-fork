/**
 * Code Context Analyzer
 * Extracts relevant code context for Ollama completions
 */

import { Position, TextDocument } from 'vscode';

export class ContextAnalyzer {
  constructor(private contextLines: number = 50) {}

  /**
   * Extract code context around cursor position
   */
  extractContext(document: TextDocument, position: Position): string {
    const lineCount = document.lineCount;
    const cursorLine = position.line;
    const cursorColumn = position.character;

    // Calculate context window
    const startLine = Math.max(0, cursorLine - this.contextLines);
    const endLine = Math.min(lineCount - 1, cursorLine);

    // Build context string
    const contextLines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      const line = document.lineAt(i).text;
      contextLines.push(line);
    }

    // Get current line up to cursor
    const currentLine = document.lineAt(cursorLine).text;
    const linePrefix = currentLine.substring(0, cursorColumn);

    // Replace last line with prefix
    contextLines[contextLines.length - 1] = linePrefix;

    return contextLines.join('\n');
  }

  /**
   * Get file type/language hint
   */
  getLanguageHint(document: TextDocument): string {
    const lang = document.languageId;
    switch (lang) {
      case 'typescript':
      case 'javascript':
        return 'JavaScript/TypeScript';
      case 'python':
        return 'Python';
      case 'java':
        return 'Java';
      case 'cpp':
      case 'c':
        return 'C/C++';
      case 'csharp':
        return 'C#';
      case 'go':
        return 'Go';
      case 'rust':
        return 'Rust';
      case 'php':
        return 'PHP';
      default:
        return lang;
    }
  }

  /**
   * Detect if we're inside a string or comment
   */
  isInsideStringOrComment(document: TextDocument, position: Position): boolean {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);

    // Simple heuristic: count unmatched quotes
    const singleQuotes = (beforeCursor.match(/'/g) || []).length % 2;
    const doubleQuotes = (beforeCursor.match(/"/g) || []).length % 2;
    const backticks = (beforeCursor.match(/`/g) || []).length % 2;

    // Check for comments
    if (beforeCursor.includes('//') || beforeCursor.includes('/*')) {
      return true;
    }

    return singleQuotes === 1 || doubleQuotes === 1 || backticks === 1;
  }

  /**
   * Get indentation level
   */
  getIndentation(document: TextDocument, line: number): string {
    const lineText = document.lineAt(line).text;
    const match = lineText.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  /**
   * Extract function/class scope
   */
  extractScope(document: TextDocument, position: Position): string {
    const lines = document.getText().split('\n');
    const cursorLine = position.line;

    // Look backwards for function/class definition
    for (let i = cursorLine; i >= Math.max(0, cursorLine - 100); i--) {
      const line = lines[i];
      if (line.match(/^\s*(function|class|interface|type|def|fn)\s+/)) {
        const match = line.match(/^\s*(?:function|class|interface|type|def|fn)\s+(\w+)/);
        return match ? match[1] : 'unknown';
      }
    }

    return 'global';
  }

  /**
   * Check if this is a valid completion point
   */
  isValidCompletionPoint(document: TextDocument, position: Position): boolean {
    // Don't complete in comments or strings
    if (this.isInsideStringOrComment(document, position)) {
      return false;
    }

    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);

    // Don't complete if at start of line or only whitespace
    if (beforeCursor.trim().length === 0) {
      return false;
    }

    // Don't complete after certain characters
    if (beforeCursor.match(/[{;]\s*$/)) {
      return true; // Do complete after braces and semicolons
    }

    // Do complete after typical programming patterns
    return beforeCursor.match(/[a-zA-Z0-9_\)\]\}]\s*$/) !== null;
  }
}
