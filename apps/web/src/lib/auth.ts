export const TOKEN_KEY = 'king_token';
export const AUTH_CHANGE_EVENT = 'king-auth-change';

function emitAuthChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function decodeBase64Url(value: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return atob(padded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) {
    return false;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (!decodedPayload) {
    return false;
  }

  try {
    const payload = JSON.parse(decodedPayload) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY);
    emitAuthChange();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthChange();
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  const existed = localStorage.getItem(TOKEN_KEY) !== null;
  localStorage.removeItem(TOKEN_KEY);
  if (existed) {
    emitAuthChange();
  }
}

export function subscribeAuthChange(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
