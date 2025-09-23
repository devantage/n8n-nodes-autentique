export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' || Array.isArray(error)) {
    return JSON.stringify(error);
  }

  return 'Unknown error';
}
