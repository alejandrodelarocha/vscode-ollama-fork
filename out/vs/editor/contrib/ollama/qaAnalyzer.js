"use strict";
/**
 * Auto QA Analyzer
 * Real-time code quality analysis using Ollama
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
exports.AutoQAAnalyzer = void 0;
exports.createAutoQAAnalyzer = createAutoQAAnalyzer;
const axios = __importStar(require("axios"));
const vscode_1 = require("vscode");
class AutoQAAnalyzer {
    constructor(config) {
        this.analysisCache = new Map();
        this.config = config;
    }
    async analyzeDocument(document) {
        if (!this.config.enabled) {
            return [];
        }
        try {
            const docHash = this.hashDocument(document.getText());
            if (this.analysisCache.has(docHash)) {
                return this.issuesToDiagnostics(this.analysisCache.get(docHash));
            }
            const issues = await this.requestQAAnalysis(document.getText(), document.languageId);
            this.analysisCache.set(docHash, issues);
            return this.issuesToDiagnostics(issues);
        }
        catch (error) {
            console.error('[Ollama QA] Analysis error:', error);
            return [];
        }
    }
    async requestQAAnalysis(code, language) {
        const prompt = this.constructQAPrompt(code, language);
        try {
            const response = await axios.default.post(`${this.config.host}:${this.config.port}/api/generate`, {
                model: this.config.model,
                prompt,
                stream: false,
                num_predict: 200,
                temperature: 0.1,
                top_k: 30,
                top_p: 0.9,
            }, {
                timeout: this.config.timeout,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const analysis = response.data.response || '';
            return this.parseQAResponse(analysis);
        }
        catch (error) {
            console.error('[Ollama QA] Request failed:', error);
            return [];
        }
    }
    constructQAPrompt(code, language) {
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
    parseQAResponse(response) {
        const issues = [];
        const lines = response.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            const match = line.match(/^(\d+):(\w+):(\w+):(.+)$/);
            if (match) {
                issues.push({
                    line: parseInt(match[1], 10) - 1,
                    severity: match[2],
                    code: match[3],
                    message: match[4].trim(),
                });
            }
        }
        return issues;
    }
    issuesToDiagnostics(issues) {
        return issues.map(issue => {
            const severity = this.severityToDiagnostic(issue.severity);
            const range = new vscode_1.Range(new vscode_1.Position(issue.line, 0), new vscode_1.Position(issue.line, Number.MAX_SAFE_INTEGER));
            const diagnostic = new vscode_1.Diagnostic(range, `[${issue.code}] ${issue.message}`, severity);
            diagnostic.source = 'Ollama QA';
            diagnostic.code = issue.code;
            return diagnostic;
        });
    }
    severityToDiagnostic(severity) {
        switch (severity) {
            case 'error':
                return vscode_1.DiagnosticSeverity.Error;
            case 'warning':
                return vscode_1.DiagnosticSeverity.Warning;
            case 'info':
            default:
                return vscode_1.DiagnosticSeverity.Information;
        }
    }
    hashDocument(content) {
        let hash = 0;
        for (let i = 0; i < Math.min(content.length, 200); i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.analysisCache.clear();
    }
}
exports.AutoQAAnalyzer = AutoQAAnalyzer;
function createAutoQAAnalyzer(config) {
    const defaultConfig = {
        host: process.env.OLLAMA_HOST || 'http://142.54.161.210',
        port: parseInt(process.env.OLLAMA_PORT || '11434'),
        model: process.env.VSCODE_OLLAMA_MODEL || 'qwen3:14b',
        timeout: 10000,
        enabled: true,
    };
    return new AutoQAAnalyzer({ ...defaultConfig, ...config });
}
//# sourceMappingURL=qaAnalyzer.js.map