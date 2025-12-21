/**
 * 에러 관련 타입 정의
 */

export interface GiwaErrorDetails {
  code: string;
  message: string;
  cause?: Error;
}
