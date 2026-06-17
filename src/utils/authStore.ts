const AUTH_KEY = 'ghost_break_auth';

export interface AuthState {
  isLoggedIn: boolean;
  email: string;
  registeredAt: string | null;
}

const DEFAULT: AuthState = {
  isLoggedIn: false,
  email: '',
  registeredAt: null,
};

function readAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function writeAuth(state: AuthState): boolean {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function isLoggedIn(): boolean {
  return readAuth().isLoggedIn;
}

export function getAuthEmail(): string {
  return readAuth().email;
}

export function registerUser(email: string, _password: string): boolean {
  if (!email.includes('@') || email.length < 5) return false;
  const state: AuthState = {
    isLoggedIn: true,
    email,
    registeredAt: new Date().toISOString(),
  };
  return writeAuth(state);
}

export function loginUser(email: string, _password: string): boolean {
  const stored = readAuth();
  if (stored.isLoggedIn && stored.email === email) {
    return true;
  }
  const state: AuthState = {
    isLoggedIn: true,
    email,
    registeredAt: stored.registeredAt ?? new Date().toISOString(),
  };
  return writeAuth(state);
}

export function logoutUser(): boolean {
  return writeAuth(DEFAULT);
}
