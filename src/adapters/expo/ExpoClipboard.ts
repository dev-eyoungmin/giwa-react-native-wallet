import type { IClipboard } from '../interfaces/IClipboard';
import { DEFAULT_CLIPBOARD_CLEAR_DELAY } from '../interfaces/IClipboard';
import { Clipboard } from 'react-native';

/**
 * Expo/React Native Clipboard implementation
 * Uses React Native's built-in Clipboard API (0.71+)
 */
export class ExpoClipboard implements IClipboard {
  private clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

  async copy(text: string): Promise<void> {
    Clipboard.setString(text);
  }

  async paste(): Promise<string> {
    return Clipboard.getString();
  }

  async hasContent(): Promise<boolean> {
    const content = await this.paste();
    return content.length > 0;
  }

  async clear(): Promise<void> {
    Clipboard.setString('');
  }

  async copyWithAutoClear(
    text: string,
    clearAfterMs: number = DEFAULT_CLIPBOARD_CLEAR_DELAY
  ): Promise<void> {
    // Clear any existing timeout
    if (this.clearTimeoutId) {
      clearTimeout(this.clearTimeoutId);
    }

    await this.copy(text);

    // Set timeout to clear clipboard
    this.clearTimeoutId = setTimeout(async () => {
      const currentContent = await this.paste();
      // Only clear if content hasn't changed
      if (currentContent === text) {
        await this.clear();
      }
      this.clearTimeoutId = null;
    }, clearAfterMs);
  }
}
