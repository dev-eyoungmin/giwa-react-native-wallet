/**
 * SDK configuration type definitions
 */
import type { NetworkType } from './network';

export interface GiwaConfig {
  network?: NetworkType;
  customRpcUrl?: string;
  autoConnect?: boolean;
  enableFlashblocks?: boolean;
}
