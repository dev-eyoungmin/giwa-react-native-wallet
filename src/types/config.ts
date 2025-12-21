/**
 * SDK 설정 관련 타입 정의
 */
import type { NetworkType } from './network';

export interface GiwaConfig {
  network?: NetworkType;
  customRpcUrl?: string;
  autoConnect?: boolean;
  enableFlashblocks?: boolean;
}
