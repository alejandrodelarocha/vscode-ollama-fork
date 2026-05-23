/**
 * Extension Tests
 * Basic tests for Ollama extension modules
 */

import * as assert from 'assert';
import { ContextAnalyzer } from '../src/vs/editor/contrib/ollama/contextAnalyzer';

suite('ContextAnalyzer', () => {
  test('should detect language hints', () => {
    const analyzer = new ContextAnalyzer(50);

    assert.strictEqual(analyzer.getLanguageHint({ languageId: 'typescript' } as any), 'JavaScript/TypeScript');
    assert.strictEqual(analyzer.getLanguageHint({ languageId: 'python' } as any), 'Python');
    assert.strictEqual(analyzer.getLanguageHint({ languageId: 'rust' } as any), 'Rust');
  });

  test('should detect strings correctly', () => {
    const analyzer = new ContextAnalyzer(50);

    // Mock document with string
    const mockDoc = {
      lineAt: (line: number) => ({
        text: 'const x = "hello world";'
      })
    };

    // String detection should work
    const insideString = analyzer.isInsideStringOrComment(mockDoc as any, { line: 0, character: 15 } as any);
    assert.strictEqual(insideString, true);
  });

  test('should get indentation', () => {
    const analyzer = new ContextAnalyzer(50);

    const mockDoc = {
      lineAt: (line: number) => ({
        text: '  function foo() {'
      })
    };

    const indent = analyzer.getIndentation(mockDoc as any, 0);
    assert.strictEqual(indent, '  ');
  });

  test('should extract scope', () => {
    const analyzer = new ContextAnalyzer(50);

    const mockDoc = {
      getText: () => `
function myFunction() {
  const x = 1;
}
      `.trim()
    };

    const scope = analyzer.extractScope(mockDoc as any, { line: 2, character: 5 } as any);
    assert.strictEqual(scope, 'myFunction');
  });

  test('should validate completion points', () => {
    const analyzer = new ContextAnalyzer(50);

    const mockDoc = {
      lineAt: (line: number) => ({
        text: 'const x = foo.'
      })
    };

    // Should be valid completion point after "."
    const isValid = analyzer.isValidCompletionPoint(mockDoc as any, { line: 0, character: 14 } as any);
    assert.strictEqual(isValid, true);
  });
});

suite('SuggestionEngine', () => {
  test('should initialize without errors', () => {
    // Just verify the engine can be created
    const { createSuggestionEngine } = require('../src/vs/editor/contrib/ollama/suggestionEngine');
    const engine = createSuggestionEngine();
    assert.ok(engine);
  });
});

suite('AutoQAAnalyzer', () => {
  test('should initialize with config', () => {
    const { createAutoQAAnalyzer } = require('../src/vs/editor/contrib/ollama/qaAnalyzer');
    const analyzer = createAutoQAAnalyzer();
    assert.ok(analyzer);
  });
});

suite('OllamaProvider', () => {
  test('should initialize with default config', () => {
    const { createOllamaProvider } = require('../src/vs/editor/contrib/ollama/ollamaProvider');
    const provider = createOllamaProvider();
    assert.ok(provider);
  });
});
