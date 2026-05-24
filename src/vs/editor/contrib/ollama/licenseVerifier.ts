/**
 * License Token Verification for Ollama
 */

import * as vscode from 'vscode';
import axios from 'axios';

export interface LicenseStatus {
  valid: boolean;
  tier?: string;
  expiresAt?: string;
  creditsRemaining?: number;
}

export class LicenseVerifier {
  private licenseServerUrl = 'https://license.rochastudios.ai';
  private cache: Map<string, { status: LicenseStatus; timestamp: number }> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hour

  async verifyLicense(token: string): Promise<LicenseStatus> {
    if (!token || token.trim().length === 0) {
      return { valid: false };
    }

    // Check cache
    const cached = this.cache.get(token);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.status;
    }

    try {
      const response = await axios.post(
        `${this.licenseServerUrl}/api/licenses/verify`,
        { token },
        { timeout: 3000 }
      );

      const status: LicenseStatus = {
        valid: response.data.valid,
        tier: response.data.tier,
        expiresAt: response.data.expiresAt,
        creditsRemaining: response.data.creditsRemaining
      };

      // Cache the result
      this.cache.set(token, { status, timestamp: Date.now() });
      return status;
    } catch (error) {
      console.warn('License verification failed:', error);
      return { valid: false };
    }
  }

  async promptForLicense(): Promise<string | undefined> {
    const token = await vscode.window.showInputBox({
      prompt: 'Enter your Ollama license token',
      placeHolder: 'Paste token from https://license.rochastudios.ai',
      password: true,
      ignoreFocusOut: true
    });

    if (token) {
      const config = vscode.workspace.getConfiguration('vscodeOllama');
      await config.update('licenseToken', token, vscode.ConfigurationTarget.Global);
      return token;
    }

    return undefined;
  }

  showLicenseRequired(): void {
    vscode.window.showWarningMessage(
      'Ollama completions require a valid license',
      'Get License',
      'Enter Token'
    ).then(selection => {
      if (selection === 'Get License') {
        vscode.env.openExternal(vscode.Uri.parse('https://license.rochastudios.ai'));
      } else if (selection === 'Enter Token') {
        this.promptForLicense();
      }
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export function createLicenseVerifier(): LicenseVerifier {
  return new LicenseVerifier();
}
