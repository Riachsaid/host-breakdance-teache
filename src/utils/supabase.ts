import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnaigavvtyaqyqspbjyk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vbVs4v4x8D6E5h9wZJQLSg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALLOWED_HOSTS = new Set([
  'meek-liger-66ffe2.netlify.app',
  'localhost',
  '127.0.0.1',
]);

export function checkDomainLock(): boolean {
  const host = window.location.hostname;
  return ALLOWED_HOSTS.has(host);
}

export function renderLockScreen(): void {
  document.body.innerHTML = `
    <div style="
      display:flex;align-items:center;justify-content:center;
      height:100vh;width:100vw;
      background:#0a0a1a;color:#e11d48;
      font-family:system-ui,sans-serif;
      flex-direction:column;gap:1rem;
      position:fixed;inset:0;z-index:99999;
    ">
      <div style="font-size:3rem;font-weight:900;letter-spacing:2px;">⛔ UNAUTHORIZED</div>
      <div style="font-size:1.1rem;color:#94a3b8;max-width:400px;text-align:center;">
        This application is registered to a licensed domain only.<br>
        <span style="color:#e11d48;font-weight:600;">Unauthorized App Clone Detected.</span>
      </div>
      <div style="font-size:0.85rem;color:#64748b;margin-top:0.5rem;">
        All local data has been purged.
      </div>
    </div>
  `;
}
