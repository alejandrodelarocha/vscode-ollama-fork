/**
 * Suggestion Panel
 * Persistent sidebar panel for daily Ollama suggestions
 */
import * as vscode from 'vscode';
export interface Suggestion {
    id: string;
    title: string;
    description: string;
    action: () => Promise<void>;
    icon: string;
    category: 'feature' | 'productivity' | 'tips' | 'settings' | 'discovery';
}
export declare class SuggestionPanel {
    private extensionUri;
    private panel;
    private suggestions;
    private viewedSuggestions;
    private lastReset;
    constructor(extensionUri: vscode.Uri);
    show(suggestions: Suggestion[]): void;
    private handleMessage;
    private updatePanel;
    private getWebviewContent;
    hide(): void;
}
export declare function createSuggestionPanel(extensionUri: vscode.Uri): SuggestionPanel;
//# sourceMappingURL=suggestionPanel.d.ts.map