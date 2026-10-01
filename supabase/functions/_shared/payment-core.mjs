export const PRICE = '12.99';
export function isPaidOrder(order, charge) {
  const payment = order.transactions?.payments?.[0];
  return order.id === charge.provider_order_id && order.external_reference === charge.id &&
    order.type === 'online' && order.country_code === 'BRA' &&
    (!order.currency_id || order.currency_id === 'BRL') &&
    order.status === 'processed' && order.status_detail === 'accredited' &&
    Number(order.total_amount) === Number(PRICE) && Number(order.total_paid_amount) === Number(PRICE) &&
    payment?.status === 'processed' && payment.status_detail === 'accredited' &&
    payment.payment_method?.id === 'pix' && Number(payment.amount) === Number(PRICE) &&
    Number(payment.paid_amount) === Number(PRICE);
}
export async function verifySignature(signature, requestId, dataId, secret) {
  if (!signature || !requestId || !dataId || !secret) return false;
  const values = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
  if (!/^\d+$/.test(values.ts || '') || !/^[a-f0-9]{64}$/i.test(values.v1 || '')) return false;
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['verify']);
  const bytes = Uint8Array.from(values.v1.match(/.{2}/g),x => parseInt(x,16));
  const message = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${values.ts};`;
  return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(message));
}
