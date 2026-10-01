export const DAY_MS = 24 * 60 * 60 * 1000;
export function planTiming(expiresAt, isFirstMonth, now = Date.now()) {
  const expiry = Date.parse(expiresAt || '');
  if (!Number.isFinite(expiry)) return {expired:false,earlyRenewal:false,daysLeft:0};
  const remaining=expiry-now;
  return {expired:remaining<=0,earlyRenewal:!isFirstMonth && remaining>0 && remaining<=2*DAY_MS,
    daysLeft:Math.max(0,Math.ceil(remaining/DAY_MS))};
}
