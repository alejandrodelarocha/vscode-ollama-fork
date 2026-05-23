/**
 * Suggestion Engine
 * Daily contextual prompts inspired by Lovable
 * Shows 5 helpful suggestions spaced throughout the day
 */
export interface Suggestion {
    id: string;
    title: string;
    description: string;
    action: () => Promise<void>;
    icon: string;
    category: 'feature' | 'productivity' | 'tips' | 'settings' | 'discovery';
}
export declare class SuggestionEngine {
    private lastSuggestionTime;
    private suggestionInterval;
    private dailyMax;
    private dailySuggestionCount;
    private lastResetDate;
    constructor();
    private resetDailyCount;
    showRandomSuggestion(): Promise<void>;
    private buildSuggestions;
    private presentSuggestion;
    getSuggestions(): Suggestion[];
    startDailyReminders(onSuggestions?: (suggestions: Suggestion[]) => void): void;
    private scheduleNextReset;
}
export declare function createSuggestionEngine(): SuggestionEngine;
//# sourceMappingURL=suggestionEngine.d.ts.map