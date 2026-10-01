export function isPaidOrder(order, charge) {
  const payment = order.transactions?.payments?.[0];
  const expected = Number(charge.amount);
  return [10,12.99].includes(expected) && order.id === charge.provider_order_id && order.external_reference === charge.id &&
    order.type === 'online' && order.country_code === 'BRA' &&
    (!order.currency_id || order.currency_id === 'BRL') &&
    order.status === 'processed' && order.status_detail === 'accredited' &&
    Number(order.total_amount) === expected && Number(order.total_paid_amount) === expected &&
    payment?.status === 'processed' && payment.status_detail === 'accredited' &&
    payment.payment_method?.id === 'pix' && Number(payment.amount) === expected &&
    Number(payment.paid_amount) === expected;
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
