const AUTH_KEY = 'ghost_break_auth';

const ADMIN_EMAIL = 'admin';
const ADMIN_PASSWORD = 'kLaSiiNkOv1988@';

export interface AuthState {
  isLoggedIn: boolean;
  email: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  subscriptionStatus: 'none' | 'monthly' | 'annual' | 'lifetime';
  registeredAt: string | null;
}

const DEFAULT: AuthState = {
  isLoggedIn: false,
  email: '',
  role: 'user',
  isPremium: false,
  subscriptionStatus: 'none',
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

export function getAuthState(): AuthState {
  return readAuth();
}

export function isAdmin(): boolean {
  return readAuth().role === 'admin';
}

export function hasLifetimePremium(): boolean {
  const state = readAuth();
  return state.role === 'admin' && state.subscriptionStatus === 'lifetime';
}

export function registerUser(email: string, password: string): boolean {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const state: AuthState = {
      isLoggedIn: true,
      email: ADMIN_EMAIL,
      role: 'admin',
      isPremium: true,
      subscriptionStatus: 'lifetime',
      registeredAt: new Date().toISOString(),
    };
    return writeAuth(state);
  }
  if (!email.includes('@') || email.length < 5) return false;
  const state: AuthState = {
    isLoggedIn: true,
    email,
    role: 'user',
    isPremium: false,
    subscriptionStatus: 'none',
    registeredAt: new Date().toISOString(),
  };
  return writeAuth(state);
}

export function loginUser(email: string, password: string): boolean {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const state: AuthState = {
      isLoggedIn: true,
      email: ADMIN_EMAIL,
      role: 'admin',
      isPremium: true,
      subscriptionStatus: 'lifetime',
      registeredAt: new Date().toISOString(),
    };
    return writeAuth(state);
  }
  const stored = readAuth();
  if (stored.isLoggedIn && stored.email === email) {
    return true;
  }
  const state: AuthState = {
    isLoggedIn: true,
    email,
    role: 'user',
    isPremium: false,
    subscriptionStatus: 'none',
    registeredAt: stored.registeredAt ?? new Date().toISOString(),
  };
  return writeAuth(state);
}

export function logoutUser(): boolean {
  return writeAuth(DEFAULT);
}
