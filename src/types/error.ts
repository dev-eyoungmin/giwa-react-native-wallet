/**
 * Error type definitions
 */

export interface GiwaErrorDetails {
  code: string;
  message: string;
  cause?: Error;
}
