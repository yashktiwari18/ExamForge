export const AI_ERROR_CODES = {
  CONFIGURATION: "AI_CONFIGURATION_ERROR",
  NETWORK: "AI_NETWORK_ERROR",
  AUTH: "AI_AUTH_ERROR",
  QUOTA: "AI_QUOTA_ERROR",
  INVALID_REQUEST: "AI_INVALID_REQUEST",
  INVALID_RESPONSE: "AI_INVALID_RESPONSE",
  PROVIDER: "AI_PROVIDER_ERROR",
};

export class AIServiceError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AIServiceError";
    this.code = details.code || AI_ERROR_CODES.PROVIDER;
    this.provider = details.provider || "unknown";
    this.status = details.status;
    this.retriable = Boolean(details.retriable);
    this.userMessage = details.userMessage || "Something went wrong while building your test. Please try again.";
    this.cause = details.cause;
  }
}

export function getAIErrorMessage(error) {
  if (error instanceof AIServiceError) {
    return error.userMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong while building your test. Please try again.";
}
