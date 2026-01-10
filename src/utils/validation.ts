/**
 * Input Validation Utility
 *
 * Provides validation functions for addresses, amounts, and other inputs
 * to prevent injection attacks and invalid transactions.
 */

import { isAddress, getAddress, parseEther, formatEther } from 'viem';
import { GiwaTransactionError, GiwaSecurityError } from './errors';

/**
 * Maximum allowed ETH amount (10,000 ETH as a sanity check)
 */
const MAX_ETH_AMOUNT = parseEther('10000');

/**
 * Validate an Ethereum address
 * @param address - The address to validate
 * @param fieldName - Optional field name for error messages
 * @throws GiwaTransactionError if address is invalid
 */
export function validateAddress(address: string, fieldName = 'address'): void {
  if (!address || typeof address !== 'string') {
    throw new GiwaTransactionError(
      `${fieldName} is required`,
      'INVALID_ADDRESS'
    );
  }

  const trimmed = address.trim();

  if (!isAddress(trimmed)) {
    throw new GiwaTransactionError(
      `Invalid Ethereum address for ${fieldName}: ${address}`,
      'INVALID_ADDRESS'
    );
  }
}

/**
 * Validate and normalize an Ethereum address with checksum
 * @param address - The address to validate
 * @param fieldName - Optional field name for error messages
 * @returns The checksummed address
 * @throws GiwaTransactionError if address is invalid
 */
export function validateAndChecksumAddress(
  address: string,
  fieldName = 'address'
): `0x${string}` {
  validateAddress(address, fieldName);

  try {
    return getAddress(address.trim());
  } catch {
    throw new GiwaTransactionError(
      `Invalid checksum for ${fieldName}: ${address}`,
      'INVALID_ADDRESS'
    );
  }
}

/**
 * Validate an ETH amount string
 * @param amount - The amount in ETH as a string
 * @param fieldName - Optional field name for error messages
 * @param maxAmount - Optional maximum amount in wei
 * @returns The amount in wei as bigint
 * @throws GiwaTransactionError if amount is invalid
 */
export function validateAmount(
  amount: string,
  fieldName = 'amount',
  maxAmount?: bigint
): bigint {
  if (!amount || typeof amount !== 'string') {
    throw new GiwaTransactionError(
      `${fieldName} is required`,
      'INVALID_AMOUNT'
    );
  }

  const trimmed = amount.trim();

  // Check for negative amounts
  if (trimmed.startsWith('-')) {
    throw new GiwaTransactionError(
      `${fieldName} cannot be negative`,
      'INVALID_AMOUNT'
    );
  }

  let parsed: bigint;
  try {
    parsed = parseEther(trimmed);
  } catch {
    throw new GiwaTransactionError(
      `Invalid ${fieldName} format: ${amount}`,
      'INVALID_AMOUNT'
    );
  }

  // Check for zero amount
  if (parsed <= 0n) {
    throw new GiwaTransactionError(
      `${fieldName} must be greater than zero`,
      'INVALID_AMOUNT'
    );
  }

  // Check for unreasonably large amounts
  if (parsed > MAX_ETH_AMOUNT) {
    throw new GiwaSecurityError(
      `${fieldName} exceeds maximum allowed (${formatEther(MAX_ETH_AMOUNT)} ETH)`,
      'AMOUNT_EXCEEDED',
      { amount: trimmed, maxAmount: formatEther(MAX_ETH_AMOUNT) }
    );
  }

  // Check against custom max amount
  if (maxAmount && parsed > maxAmount) {
    throw new GiwaTransactionError(
      `${fieldName} (${trimmed} ETH) exceeds maximum allowed (${formatEther(maxAmount)} ETH)`,
      'INSUFFICIENT_BALANCE'
    );
  }

  return parsed;
}

/**
 * Validate wei amount (already in bigint)
 * @param amount - The amount in wei
 * @param fieldName - Optional field name for error messages
 * @param maxAmount - Optional maximum amount in wei
 * @throws GiwaTransactionError if amount is invalid
 */
export function validateWeiAmount(
  amount: bigint,
  fieldName = 'amount',
  maxAmount?: bigint
): void {
  if (amount <= 0n) {
    throw new GiwaTransactionError(
      `${fieldName} must be greater than zero`,
      'INVALID_AMOUNT'
    );
  }

  if (maxAmount && amount > maxAmount) {
    throw new GiwaTransactionError(
      `${fieldName} (${formatEther(amount)} ETH) exceeds maximum allowed (${formatEther(maxAmount)} ETH)`,
      'INSUFFICIENT_BALANCE'
    );
  }
}

/**
 * Validate a token address (same as regular address validation)
 * @param tokenAddress - The token contract address
 * @throws GiwaTransactionError if address is invalid
 */
export function validateTokenAddress(tokenAddress: string): `0x${string}` {
  return validateAndChecksumAddress(tokenAddress, 'token address');
}

/**
 * Validate hex data string
 * @param data - The hex data string
 * @param fieldName - Optional field name for error messages
 * @throws GiwaTransactionError if data is invalid
 */
export function validateHexData(data: string, fieldName = 'data'): void {
  if (!data || typeof data !== 'string') {
    throw new GiwaTransactionError(
      `${fieldName} is required`,
      'INVALID_DATA'
    );
  }

  const trimmed = data.trim();

  // Check for valid hex format
  if (!/^0x[a-fA-F0-9]*$/.test(trimmed)) {
    throw new GiwaTransactionError(
      `Invalid hex format for ${fieldName}`,
      'INVALID_DATA'
    );
  }
}

/**
 * Validate a transaction hash
 * @param hash - The transaction hash
 * @throws GiwaTransactionError if hash is invalid
 */
export function validateTransactionHash(hash: string): void {
  if (!hash || typeof hash !== 'string') {
    throw new GiwaTransactionError(
      'Transaction hash is required',
      'INVALID_TX_HASH'
    );
  }

  const trimmed = hash.trim();

  // Transaction hash should be 66 characters (0x + 64 hex chars)
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    throw new GiwaTransactionError(
      `Invalid transaction hash format: ${hash}`,
      'INVALID_TX_HASH'
    );
  }
}

/**
 * Validate a spender address (used for approvals)
 * Also checks for suspicious patterns
 * @param spenderAddress - The spender contract address
 * @throws GiwaSecurityError if address is suspicious
 */
export function validateSpenderAddress(
  spenderAddress: string
): `0x${string}` {
  const checksummed = validateAndChecksumAddress(spenderAddress, 'spender');

  // Check for null/zero address
  if (checksummed === '0x0000000000000000000000000000000000000000') {
    throw new GiwaSecurityError(
      'Cannot approve zero address as spender',
      'INVALID_SPENDER',
      { spender: checksummed }
    );
  }

  return checksummed;
}

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters and null bytes
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate bridge amount with additional checks
 * @param amount - The amount to bridge
 * @param token - Token type ('ETH' or token address)
 * @returns Validated amount in wei
 */
export function validateBridgeAmount(
  amount: string,
  token: string = 'ETH'
): bigint {
  // Use stricter limits for bridge operations
  const maxBridgeAmount = parseEther('1000'); // 1000 ETH max for bridge

  const parsed = validateAmount(amount, 'bridge amount');

  if (parsed > maxBridgeAmount) {
    throw new GiwaSecurityError(
      `Bridge amount exceeds maximum allowed (${formatEther(maxBridgeAmount)} ${token})`,
      'AMOUNT_EXCEEDED',
      { amount, token, maxAmount: formatEther(maxBridgeAmount) }
    );
  }

  return parsed;
}
