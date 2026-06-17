import { hasLifetimePremium, getAuthEmail } from './authStore';
import { supabase } from './supabase';

const PREMIUM_KEY = 'ghost_break_premium';
const PENDING_TX_KEY = 'ghost_break_pending_tx';
const SUPABASE_CACHE_KEY = 'ghost_break_supabase_cache';

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

let _cachedServerResponse: PremiumState | null = null;

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

async function fetchServerPremium(): Promise<PremiumState | null> {
  const email = getAuthEmail();
  if (!email) return null;
  try {
    const { data, error } = await supabase
      .rpc('sync_premium_status', { p_user_id: email } as any);
    if (error) return null;
    if (data?.active) {
      const result: PremiumState = {
        active: true,
        plan: data.plan ?? null,
        activatedAt: null,
        expiresAt: data.expires_at ?? null,
        txid: data.txid ?? null,
        paymentMethod: data.payment_method ?? null,
      };
      try { localStorage.setItem(SUPABASE_CACHE_KEY, JSON.stringify(result)); } catch {}
      _cachedServerResponse = result;
      return result;
    }
  } catch {}
  return null;
}

export function isPremium(): boolean {
  if (hasLifetimePremium()) return true;
  if (_cachedServerResponse?.active) {
    if (_cachedServerResponse.expiresAt && new Date(_cachedServerResponse.expiresAt) < new Date()) {
      _cachedServerResponse = null;
      writePremium({ ...DEFAULT_STATE });
      return false;
    }
    return true;
  }
  try {
    const cached = localStorage.getItem(SUPABASE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as PremiumState;
      if (parsed.active) {
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          localStorage.removeItem(SUPABASE_CACHE_KEY);
        } else {
          return true;
        }
      }
    }
  } catch {}
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
  if (_cachedServerResponse?.active) return _cachedServerResponse;
  try {
    const cached = localStorage.getItem(SUPABASE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as PremiumState;
      if (parsed.active) return parsed;
    }
  } catch {}
  return readPremium();
}

export async function refreshServerPremium(): Promise<void> {
  await fetchServerPremium();
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

  if (getAuthEmail()) {
    supabase.from('subscriptions').insert({
      user_id: getAuthEmail(),
      plan,
      txid,
      payment_method: method,
      expires_at: expiresAt,
    }).then(({ error }) => {
      if (error) console.warn('Supabase insert failed, saved locally:', error.message);
    });
  }

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
  _cachedServerResponse = null;
  try { localStorage.removeItem(SUPABASE_CACHE_KEY); } catch {}
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
