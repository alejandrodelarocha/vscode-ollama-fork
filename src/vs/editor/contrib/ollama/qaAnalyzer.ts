/**
 * Auto QA Analyzer
 * Real-time code quality analysis using Ollama
 */

import * as axios from 'axios';
import { TextDocument, Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode';

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

export class AutoQAAnalyzer {
  private config: QAConfig;
  private analysisCache = new Map<string, QAIssue[]>();

  constructor(config: QAConfig) {
    this.config = config;
  }

  async analyzeDocument(document: TextDocument): Promise<Diagnostic[]> {
    if (!this.config.enabled) {
      return [];
    }

    try {
      const docHash = this.hashDocument(document.getText());
      if (this.analysisCache.has(docHash)) {
        return this.issuesToDiagnostics(this.analysisCache.get(docHash)!);
      }

      const issues = await this.requestQAAnalysis(document.getText(), document.languageId);
      this.analysisCache.set(docHash, issues);

      return this.issuesToDiagnostics(issues);
    } catch (error) {
      console.error('[Ollama QA] Analysis error:', error);
      return [];
    }
  }

  private async requestQAAnalysis(code: string, language: string): Promise<QAIssue[]> {
    const prompt = this.constructQAPrompt(code, language);

    try {
      const response = await axios.default.post(
        `${this.config.host}:${this.config.port}/api/generate`,
        {
          model: this.config.model,
          prompt,
          stream: false,
          num_predict: 200,
          temperature: 0.1,
          top_k: 30,
          top_p: 0.9,
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const analysis = response.data.response || '';
      return this.parseQAResponse(analysis);
    } catch (error) {
      console.error('[Ollama QA] Request failed:', error);
      return [];
    }
  }

  private constructQAPrompt(code: string, language: string): string {
    return `You are a strict code quality analyzer. Analyze the following ${language} code and identify issues.

For each issue found, respond with ONE line in this format:
LINE:SEVERITY:CODE:MESSAGE

Where:
- LINE is the line number
- SEVERITY is one of: error, warning, info
- CODE is a short issue code (e.g., UNUSED_VAR, SECURITY, PERF)
- MESSAGE is a brief description

ONLY output issues in the format above. Do not explain. Do not output valid code.

Code:
\`\`\`${language}
${code}
\`\`\`

Issues found:`;
  }

  private parseQAResponse(response: string): QAIssue[] {
    const issues: QAIssue[] = [];
    const lines = response.split('\n').filter(l => l.trim().length > 0);

    for (const line of lines) {
      const match = line.match(/^(\d+):(\w+):(\w+):(.+)$/);
      if (match) {
        issues.push({
          line: parseInt(match[1], 10) - 1,
          severity: match[2] as 'error' | 'warning' | 'info',
          code: match[3],
          message: match[4].trim(),
        });
      }
    }

    return issues;
  }

  private issuesToDiagnostics(issues: QAIssue[]): Diagnostic[] {
    return issues.map(issue => {
      const severity = this.severityToDiagnostic(issue.severity);
      const range = new Range(
        new Position(issue.line, 0),
        new Position(issue.line, Number.MAX_SAFE_INTEGER)
      );

      const diagnostic = new Diagnostic(
        range,
        `[${issue.code}] ${issue.message}`,
        severity
      );
      diagnostic.source = 'Ollama QA';
      diagnostic.code = issue.code;

      return diagnostic;
    });
  }

  private severityToDiagnostic(severity: string): DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return DiagnosticSeverity.Error;
      case 'warning':
        return DiagnosticSeverity.Warning;
      case 'info':
      default:
        return DiagnosticSeverity.Information;
    }
  }

  private hashDocument(content: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(content.length, 200); i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  updateConfig(newConfig: Partial<QAConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.analysisCache.clear();
  }
}

export function createAutoQAAnalyzer(config?: Partial<QAConfig>): AutoQAAnalyzer {
  const defaultConfig: QAConfig = {
    host: process.env.OLLAMA_HOST || 'http://142.54.161.210',
    port: parseInt(process.env.OLLAMA_PORT || '11434'),
    model: process.env.VSCODE_OLLAMA_MODEL || 'qwen3:14b',
    timeout: 10000,
    enabled: true,
  };

  return new AutoQAAnalyzer({ ...defaultConfig, ...config });
}
