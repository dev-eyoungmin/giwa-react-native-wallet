/**
 * Clipboard interface for copy/paste operations
 * Implementations: ExpoClipboard, RNClipboard
 */
export interface IClipboard {
  /**
   * Copy text to clipboard
   * @param text - Text to copy
   */
  copy(text: string): Promise<void>;

  /**
   * Get text from clipboard
   * @returns Clipboard text or empty string
   */
  paste(): Promise<string>;

  /**
   * Check if clipboard has content
   * @returns true if clipboard has text
   */
  hasContent(): Promise<boolean>;

  /**
   * Clear clipboard content
   * For security, call this after pasting sensitive data
   */
  clear(): Promise<void>;

  /**
   * Copy with auto-clear after delay
   * @param text - Text to copy
   * @param clearAfterMs - Clear after milliseconds (default: 60000)
   */
  copyWithAutoClear(text: string, clearAfterMs?: number): Promise<void>;
}

// Default auto-clear delay (60 seconds)
export const DEFAULT_CLIPBOARD_CLEAR_DELAY = 60000;
