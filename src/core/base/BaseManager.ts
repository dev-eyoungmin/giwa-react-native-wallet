import type { GiwaClient } from '../GiwaClient';
import type { TransactionReceipt, TransactionResult } from '../../types';
import type { Hash, PublicClient } from 'viem';

/**
 * 매니저 기본 인터페이스
 * 클린 아키텍처: 의존성 역전 원칙 (DIP)
 */
export interface IManager {
  readonly client: GiwaClient;
}

/**
 * 트랜잭션 매니저 인터페이스
 * 트랜잭션을 생성하는 모든 매니저가 구현
 */
export interface ITransactionManager extends IManager {
  // 마커 인터페이스 - 트랜잭션 결과를 반환하는 메서드를 가진 매니저
}

/**
 * 매니저 기본 클래스
 * 클린 코드: 템플릿 메서드 패턴
 */
export abstract class BaseManager implements IManager {
  public readonly client: GiwaClient;

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * 지갑 클라이언트 확인
   * @throws 지갑이 연결되지 않은 경우 에러
   */
  protected requireWalletClient() {
    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }
    return walletClient;
  }

  /**
   * Public 클라이언트 반환
   */
  protected getPublicClient() {
    return this.client.getPublicClient();
  }

  /**
   * TransactionResult 생성 헬퍼
   * 클린 코드: DRY 원칙 - 반복되는 TransactionResult 생성 로직 추상화
   */
  protected createTransactionResult(
    hash: Hash,
    publicClient: PublicClient
  ): TransactionResult {
    return {
      hash,
      wait: async (): Promise<TransactionReceipt> => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }
}
