const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid subscription ID, username, or password.",
  Configuration: "Server configuration error. Please contact support.",
  AccessDenied: "Access denied. Your account may be inactive.",
  default: "An unexpected error occurred. Please try again.",
};

export function getAuthErrorMessage(errorCode?: string): string {
  if (!errorCode) return AUTH_ERROR_MESSAGES.default;
  return AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.default;
}
