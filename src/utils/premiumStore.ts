import { hasLifetimePremium } from './authStore';

const PREMIUM_KEY = 'ghost_break_premium';
const PENDING_TX_KEY = 'ghost_break_pending_tx';

export interface PremiumState {
  active: boolean;
  plan: 'monthly' | 'annual' | null;
  activatedAt: string | null;
  expiresAt: string | null;
  txid: string | null;
  paymentMethod: 'redotpay' | 'binance' | 'changelly' | null;
}

export interface PendingTx {
  txid: string;
  plan: 'monthly' | 'annual';
  method: 'redotpay' | 'binance' | 'changelly';
  submittedAt: string;
  verified: boolean;
}

const DEFAULT_STATE: PremiumState = {
  active: false,
  plan: null,
  activatedAt: null,
  expiresAt: null,
  txid: null,
  paymentMethod: null,
};

function readPremium(): PremiumState {
  try {
    const raw = localStorage.getItem(PREMIUM_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function writePremium(state: PremiumState): boolean {
  try {
    localStorage.setItem(PREMIUM_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function isPremium(): boolean {
  if (hasLifetimePremium()) return true;
  const state = readPremium();
  if (!state.active) return false;
  if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
    state.active = false;
    writePremium(state);
    return false;
  }
  return true;
}

export function getPremiumState(): PremiumState {
  if (hasLifetimePremium()) {
    return {
      active: true,
      plan: 'annual',
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      txid: 'ADMIN_LIFETIME_OVERRIDE',
      paymentMethod: null,
    };
  }
  return readPremium();
}

export function activatePremium(
  plan: 'monthly' | 'annual',
  txid: string,
  method: 'redotpay' | 'binance' | 'changelly',
): boolean {
  const now = new Date();
  const expiresAt =
    plan === 'annual'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

  return writePremium({
    active: true,
    plan,
    activatedAt: now.toISOString(),
    expiresAt,
    txid,
    paymentMethod: method,
  });
}

export function deactivatePremium(): boolean {
  return writePremium(DEFAULT_STATE);
}

export function savePendingTx(
  txid: string,
  plan: 'monthly' | 'annual',
  method: 'redotpay' | 'binance' | 'changelly',
): boolean {
  try {
    const pending: PendingTx = { txid, plan, method, submittedAt: new Date().toISOString(), verified: false };
    localStorage.setItem(PENDING_TX_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

export function getPendingTx(): PendingTx | null {
  try {
    const raw = localStorage.getItem(PENDING_TX_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingTx(): void {
  try {
    localStorage.removeItem(PENDING_TX_KEY);
  } catch { /* ignore */ }
}
