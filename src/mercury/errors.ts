/**
 * Mercury-specific error handling
 * Includes diffusion model-specific error types
 */

export enum MercuryErrorCode {
  // Standard errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Diffusion-specific errors
  DIFFUSION_CONVERGENCE_ERROR = 'DIFFUSION_CONVERGENCE_ERROR',
  DIFFUSION_STABILITY_ERROR = 'DIFFUSION_STABILITY_ERROR',
  CONTEXT_MISMATCH_ERROR = 'CONTEXT_MISMATCH_ERROR',
  FIM_BOUNDARY_ERROR = 'FIM_BOUNDARY_ERROR',
  NOISE_SCHEDULE_ERROR = 'NOISE_SCHEDULE_ERROR'
}

export interface MercuryErrorDetails {
  code: MercuryErrorCode;
  message: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number;
  suggestedFix?: string;
  diffusionMetadata?: {
    stepsCompleted?: number;
    convergenceScore?: number;
    stabilityThreshold?: number;
  };
}

export class MercuryAPIError extends Error {
  public readonly code: MercuryErrorCode;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly suggestedFix?: string;
  public readonly diffusionMetadata?: any;

  constructor(details: MercuryErrorDetails) {
    super(details.message);
    this.name = 'MercuryAPIError';
    this.code = details.code;
    this.retryable = details.retryable;
    this.retryAfter = details.retryAfter;
    this.suggestedFix = details.suggestedFix;
    this.diffusionMetadata = details.diffusionMetadata;
  }

  toMCPError() {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: {
            type: this.code.toLowerCase(),
            message: this.message,
            retryable: this.retryable,
            retryAfter: this.retryAfter,
            suggestedFix: this.suggestedFix,
            metadata: this.diffusionMetadata
          }
        })
      }]
    };
  }
}

/**
 * Error factory for common Mercury API errors
 */
export class MercuryErrorFactory {
  static validationError(message: string, details?: any): MercuryAPIError {
    return new MercuryAPIError({
      code: MercuryErrorCode.VALIDATION_ERROR,
      message,
      details,
      retryable: false
    });
  }

  static authenticationError(message: string): MercuryAPIError {
    return new MercuryAPIError({
      code: MercuryErrorCode.AUTHENTICATION_ERROR,
      message,
      retryable: false,
      suggestedFix: 'Check your MERCURY_API_KEY environment variable'
    });
  }

  static rateLimitError(message: string, retryAfter?: number): MercuryAPIError {
    return new MercuryAPIError({
      code: MercuryErrorCode.RATE_LIMIT_ERROR,
      message,
      retryable: true,
      retryAfter,
      suggestedFix: `Wait ${retryAfter} seconds before retrying`
    });
  }

  static diffusionConvergenceError(
    stepsCompleted: number,
    convergenceScore: number
  ): MercuryAPIError {
    return new MercuryAPIError({
      code: MercuryErrorCode.DIFFUSION_CONVERGENCE_ERROR,
      message: `Diffusion model failed to converge after ${stepsCompleted} steps`,
      retryable: true,
      suggestedFix: 'Increase diffusion_steps or adjust temperature',
      diffusionMetadata: {
        stepsCompleted,
        convergenceScore
      }
    });
  }

  static fimBoundaryError(message: string): MercuryAPIError {
    return new MercuryAPIError({
      code: MercuryErrorCode.FIM_BOUNDARY_ERROR,
      message,
      retryable: false,
      suggestedFix: 'Ensure prefix and suffix provide clear context boundaries'
    });
  }
}