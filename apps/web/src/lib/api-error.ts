export interface ApiBusinessError {
  code?: number;
  message?: string;
  data?: {
    requiredPlan?: string;
    pricing?: {
      monthly?: number;
      yearly?: number;
    };
    [key: string]: unknown;
  };
}

export function isApiBusinessError(error: unknown): error is ApiBusinessError {
  return !!error && typeof error === 'object' && ('code' in error || 'message' in error);
}

export function isVipRequiredError(error: unknown): error is ApiBusinessError {
  if (!isApiBusinessError(error)) {
    return false;
  }

  return error.code === 403 && (
    error.data?.requiredPlan === 'user' ||
    error.data?.requiredPlan === 'vip' ||
    (typeof error.message === 'string' && error.message.includes('登录')) ||
    (typeof error.message === 'string' && error.message.includes('VIP'))
  );
}

export function isVideoRequiredError(error: unknown): error is ApiBusinessError {
  if (!isApiBusinessError(error)) {
    return false;
  }

  return error.code === 403 && error.data?.requiredPlan === 'video';
}

export function isLoginRequiredError(error: unknown): error is ApiBusinessError {
  if (!isApiBusinessError(error)) {
    return false;
  }

  return error.code === 403 && error.data?.requiredPlan === 'user';
}

export function isUnauthorizedError(error: unknown): boolean {
  if (isApiBusinessError(error)) {
    return error.code === 401;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 401;
}
