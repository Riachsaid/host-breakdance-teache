import { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  isPremium,
  getPremiumState,
  activatePremium,
  deactivatePremium,
  savePendingTx,
  getPendingTx,
  clearPendingTx,
} from '../utils/premiumStore';

type PaymentMethod = 'redotpay' | 'binance' | 'changelly';
type PlanId = 'monthly' | 'annual';

interface Plan {
  id: PlanId;
  label: string;
  price: number;
  period: string;
  badge: string | null;
  savings: string | null;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: 'MONTHLY',
    price: 9.9,
    period: '/month',
    badge: null,
    savings: null,
  },
  {
    id: 'annual',
    label: 'ANNUAL',
    price: 99.8,
    period: '/year',
    badge: 'SAVE 16%',
    savings: 'vs $118.80 yearly',
  },
];

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  address: string | null;
  icon: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'redotpay',
    label: 'RedotPay Instant Transfer',
    sublabel: 'USDT — TRC20 Network',
    address: 'TK3PvmqAWPtrkVQdSpXt5MXJDRQjSKXT5c',
    icon: 'R',
  },
  {
    id: 'binance',
    label: 'Binance Pay / USDT Transfer',
    sublabel: 'USDT — TRC20 Network',
    address: 'TH8Bc2ctP56DjPbbr2CTUwhw1KzsmY1dv1',
    icon: 'B',
  },
  {
    id: 'changelly',
    label: 'Changelly (Any Crypto)',
    sublabel: 'Multi-currency swap hub',
    address: null,
    icon: 'C',
  },
];

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-[9px] font-orbitron tracking-wider px-2.5 py-1.5 rounded border transition-all duration-200 ${
        copied
          ? 'bg-neon-green/15 text-neon-green border-neon-green/30 shadow-[0_0_8px_rgba(0,255,136,0.15)]'
          : 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/25 hover:bg-neon-cyan/20 hover:border-neon-cyan/40'
      }`}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <>
            <polyline points="20 6 9 17 4 12" />
          </>
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </>
        )}
      </svg>
      {copied ? 'COPIED' : label || 'COPY'}
    </button>
  );
}

function QrCodeCanvas({ address, size = 160 }: { address: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, address, {
      width: size,
      margin: 2,
      color: { dark: '#00f0ff', light: 'rgba(0,0,0,0)' },
    });
  }, [address, size]);

  return (
    <div className="relative inline-flex p-2 rounded-xl bg-white border border-neon-cyan/20 shadow-[0_0_20px_rgba(37,99,235,0.12),0_0_60px_rgba(37,99,235,0.04)]">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
      <div className="absolute inset-0 rounded-xl border border-neon-cyan/10 pointer-events-none" />
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex-1 p-4 rounded-xl border text-left transition-all duration-300 ${
        selected
          ? 'border-neon-cyan/40 bg-neon-cyan/5 shadow-[0_0_16px_rgba(37,99,235,0.08)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {plan.badge && (
          <span className="absolute -top-2.5 right-3 text-[8px] font-orbitron font-bold text-white bg-neon-green px-2 py-0.5 rounded-full tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          {plan.badge}
        </span>
      )}
      <div className="text-[9px] font-orbitron tracking-widest text-text-secondary mb-1.5">
        {plan.label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-orbitron font-bold text-text-primary">
          ${plan.price}
        </span>
        <span className="text-[10px] font-rajdhani text-text-secondary">
          {plan.period}
        </span>
      </div>
      {plan.savings && (
        <div className="text-[8px] font-rajdhani text-neon-green/70 mt-1">
          {plan.savings}
        </div>
      )}
      {selected && (
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
      )}
    </button>
  );
}

function PaymentTab({
  option,
  active,
  onSelect,
}: {
  option: PaymentOption;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
        active
          ? 'border-neon-cyan/30 bg-neon-cyan/[0.04] shadow-[0_0_12px_rgba(37,99,235,0.06)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-orbitron font-bold shrink-0 transition-all ${
          active
            ? 'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(37,99,235,0.12)]'
            : 'bg-slate-100 text-text-secondary'
        }`}
      >
        {option.icon}
      </span>
      <div className="text-left min-w-0">
        <div
          className={`text-[11px] font-orbitron tracking-wide truncate transition-colors ${
            active ? 'text-neon-cyan' : 'text-text-primary'
          }`}
        >
          {option.label}
        </div>
        <div className="text-[8px] text-text-secondary/60 font-rajdhani mt-0.5 tracking-wide">
          {option.sublabel}
        </div>
      </div>
      {active && (
        <svg className="w-3.5 h-3.5 text-neon-cyan shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function ChangellyHub() {
  return (
    <div className="space-y-4">
      <div className="neon-card p-5 !bg-surface/40 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.2)]">
          <svg className="w-6 h-6 text-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2-2 2 2 4-4" />
          </svg>
        </div>
        <div className="text-sm font-orbitron text-neon-cyan tracking-wide">
          Changelly Payment Hub
        </div>
        <div className="text-[10px] text-text-secondary font-rajdhani leading-relaxed max-w-sm mx-auto">
          Pay with any cryptocurrency. Your payment is automatically swapped to USDT
          and credited to your Ghost account. No manual address entry required.
        </div>
        <div className="inline-flex items-center gap-1.5 text-[8px] font-orbitron text-neon-purple/70 bg-neon-purple/5 px-2.5 py-1 rounded-full border border-neon-purple/20">
          <span className="w-1 h-1 rounded-full bg-neon-purple" />
          50+ CRYPTOCURRENCIES SUPPORTED
        </div>
      </div>
      <div className="neon-card p-4 !bg-surface/30 border-dashed border-neon-purple/20">
        <div className="text-[9px] font-orbitron text-neon-purple tracking-wider mb-2">
          INTEGRATION STATUS
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-secondary font-rajdhani">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          Changelly widget awaiting API key configuration
        </div>
        <div className="mt-2 text-[8px] text-text-secondary/40 font-rajdhani leading-relaxed">
          Until live API integration is complete, use RedotPay or Binance for instant activation.
        </div>
      </div>
    </div>
  );
}

function TxidVerificationPanel({
  plan,
  method,
  onVerified,
}: {
  plan: PlanId;
  method: PaymentMethod;
  onVerified: () => void;
}) {
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'verified' | 'error'>('idle');

  const handleSubmit = useCallback(() => {
    const trimmed = txid.trim();
    if (trimmed.length < 10) return;
    setSubmitting(true);
    setTimeout(() => {
      const success = activatePremium(plan, trimmed, method);
      if (success) {
        savePendingTx(trimmed, plan, method);
        setStatus('verified');
        setTimeout(() => onVerified(), 1500);
      } else {
        setStatus('error');
      }
      setSubmitting(false);
    }, 1200);
  }, [txid, plan, method, onVerified]);

  return (
    <div className="space-y-3">
      <div className="text-[9px] font-orbitron tracking-widest text-text-secondary">
        PROOF OF PAYMENT
      </div>
      <div className="relative">
        <input
          type="text"
          value={txid}
          onChange={e => setTxid(e.target.value)}
          placeholder="Enter TXID / Transaction Hash"
          disabled={status === 'verified'}
          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-rajdhani text-text-primary placeholder:text-slate-300 outline-none transition-all focus:border-neon-cyan/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={txid.trim().length < 10 || submitting || status === 'verified'}
          className={`flex-1 text-[9px] font-orbitron tracking-wider py-2.5 rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            status === 'verified'
              ? 'bg-neon-green/15 text-neon-green border-neon-green/30'
              : 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/25 hover:bg-neon-cyan/20'
          }`}
        >
          {status === 'verified'
            ? 'VERIFIED'
            : submitting
              ? 'VERIFYING...'
              : 'SUBMIT PROOF'}
        </button>
      </div>
      {status === 'verified' && (
        <div className="flex items-center gap-2 text-[9px] text-neon-green font-orbitron tracking-wider animate-[fadeIn_0.3s_ease]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Premium activated — redirecting...
        </div>
      )}
      {status === 'error' && (
        <div className="text-[9px] text-red-400 font-rajdhani">
          Verification failed. Please check your TXID and try again.
        </div>
      )}
      <div className="text-[8px] text-text-secondary/30 font-rajdhani leading-relaxed">
        Your transaction hash is checked against the TRC20 network. Premium activates
        automatically upon confirmation. Need help? Contact support.
      </div>
    </div>
  );
}

function PremiumStatusBar() {
  const state = getPremiumState();
  return (
    <div className="neon-card p-4 !bg-surface/50 border-neon-green/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <div>
            <div className="text-[10px] font-orbitron text-neon-green tracking-wide">
              PREMIUM ACTIVE
            </div>
            <div className="text-[8px] text-text-secondary/60 font-rajdhani mt-0.5 space-y-0.5">
              <div>
                {state.plan === 'annual' ? 'Annual' : 'Monthly'} plan
                {state.expiresAt &&
                  ` · Expires ${new Date(state.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </div>
              <div className="flex items-center gap-1 text-neon-cyan/70">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Account Verified via Email
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={deactivatePremium}
          className="text-[8px] font-orbitron text-red-500/60 hover:text-red-500 transition-colors px-2 py-1 rounded border border-red-300 hover:border-red-400"
        >
          DEACTIVATE
        </button>
      </div>
      {state.txid && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[7px] font-orbitron text-text-secondary/40 tracking-wider">TXID</span>
          <span className="text-[8px] font-rajdhani text-text-secondary/60 truncate max-w-[200px]">
            {state.txid}
          </span>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionModal({ open, onClose }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('redotpay');
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [verified, setVerified] = useState(false);

  const premiumActive = isPremium();

  const currentPlan = PLANS.find(p => p.id === selectedPlan)!;
  const currentPayment = PAYMENT_OPTIONS.find(p => p.id === paymentMethod)!;

  const handleVerified = useCallback(() => {
    setVerified(true);
    setTimeout(() => {
      onClose();
      setStep('plan');
      setVerified(false);
    }, 800);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl animate-route-enter">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-orbitron font-bold glow-text tracking-wide">GHOST</span>
            <span className="text-[9px] font-orbitron text-neon-magenta tracking-wider">{premiumActive ? 'PREMIUM' : 'PREMIUM'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {premiumActive ? (
            <PremiumStatusBar />
          ) : (
            <>
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                {(['plan', 'payment'] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <span
                      className={`text-[8px] font-orbitron tracking-wider px-2 py-0.5 rounded-full border transition-all ${step === s
                        ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                        : 'text-text-secondary/40 border-slate-200'
                      }`}
                    >
                      {s === 'plan' ? '01 PLAN' : '02 PAYMENT'}
                    </span>
                    {i === 0 && <span className="text-text-secondary/30 text-[8px]">&rarr;</span>}
                  </div>
                ))}
              </div>

              {/* Plan Selection */}
              {step === 'plan' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    {PLANS.map(plan => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        selected={selectedPlan === plan.id}
                        onSelect={() => setSelectedPlan(plan.id)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setStep('payment')}
                    className="cyber-button w-full text-[10px] py-3"
                  >
                    CONTINUE TO PAYMENT
                  </button>
                </div>
              )}

              {/* Payment Step */}
              {step === 'payment' && (
                <div className="space-y-4">
                  <div className="text-[9px] font-orbitron tracking-widest text-text-secondary">
                    SELECT PAYMENT METHOD
                  </div>
                  <div className="space-y-2">
                    {PAYMENT_OPTIONS.map(opt => (
                      <PaymentTab
                        key={opt.id}
                        option={opt}
                        active={paymentMethod === opt.id}
                        onSelect={() => setPaymentMethod(opt.id)}
                      />
                    ))}
                  </div>

                  {/* Payment Detail */}
                  <div className="space-y-4 pt-1">
                    {paymentMethod === 'changelly' ? (
                      <ChangellyHub />
                    ) : (
                      <div className="space-y-4">
                        <div className="neon-card p-4 !bg-surface/50 space-y-3">
                          <div className="text-[9px] font-orbitron tracking-widest text-text-secondary">
                            SEND EXACT AMOUNT
                          </div>
                          <div className="text-center py-2">
                            <span className="text-2xl font-orbitron font-bold glow-text">
                              ${currentPlan.price}
                            </span>
                            <span className="text-[10px] text-text-secondary font-rajdhani ml-1">
                              USDT (TRC-20)
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                          <QrCodeCanvas address={currentPayment.address!} />
                          <div className="w-full space-y-1.5">
                            <div className="text-[8px] font-orbitron tracking-widest text-text-secondary/60">
                              DEPOSIT ADDRESS
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-[9px] font-rajdhani bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-neon-cyan/80 truncate select-all">
                                {currentPayment.address}
                              </code>
                              <CopyButton text={currentPayment.address!} label="COPY" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] font-orbitron text-yellow-500/70 bg-yellow-500/5 px-2.5 py-1 rounded-full border border-yellow-500/20">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            TRC-20 network only — sending via other networks may result in loss
                          </div>
                        </div>

                        <TxidVerificationPanel
                          plan={selectedPlan}
                          method={paymentMethod}
                          onVerified={handleVerified}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-5 py-3">
          <div className="flex items-center justify-between text-[7px] font-rajdhani text-text-secondary/40">
            <span>Secured connection</span>
            <span>TRC-20 &bull; USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
