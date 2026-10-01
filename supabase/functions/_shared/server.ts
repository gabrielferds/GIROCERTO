import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { isPaidOrder } from './payment-core.mjs';
export const admin = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {auth:{persistSession:false,autoRefreshToken:false}});
export const ready = () => Boolean(Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') && Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET'));
export async function provider(path:string, init:RequestInit = {}) {
  const response = await fetch(`https://api.mercadopago.com${path}`,{
    ...init,headers:{'Authorization':`Bearer ${Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')}`,
    'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(10000)});
  if (!response.ok) {
    console.error('Mercado Pago request failed',{status:response.status,path:path.split('?')[0]});
    throw new Error('Não foi possível consultar o Mercado Pago. Tente novamente em instantes.');
  }
  return response.json();
}
export async function syncCharge(charge:any, signedWebhook=false) {
  const order = await provider(`/v1/orders/${encodeURIComponent(charge.provider_order_id)}`);
  if (order.id !== charge.provider_order_id || order.external_reference !== charge.id) throw new Error('Cobrança inválida.');
  const method = order.transactions?.payments?.[0]?.payment_method;
  const updates:any = {};
  if (method?.qr_code) updates.qr_code = method.qr_code;
  if (method?.qr_code_base64) updates.qr_code_base64 = method.qr_code_base64;
  if (isPaidOrder(order,charge) && !charge.paid_at && order.last_updated_date) {
    const paidAt = new Date(order.last_updated_date);
    if (Number.isNaN(paidAt.getTime())) throw new Error('Data do pagamento inválida.');
    updates.paid_at = paidAt.toISOString();
  }
  // Only a validated webhook can unlock a plan. Polling can complete an earlier
  // signed webhook whose order was still processing at the time of delivery.
  if (signedWebhook) updates.webhook_received_at = new Date().toISOString();
  if (!charge.activated_at) updates.status = isPaidOrder(order,charge) ? 'confirming' : order.status;
  if (Object.keys(updates).length) {
    const {error} = await admin.from('gc_payments').update(updates).eq('id',charge.id).is('activated_at',null);
    if (error) throw new Error('Não foi possível registrar a confirmação.');
  }
  if (isPaidOrder(order,charge) && (signedWebhook || charge.webhook_received_at)) {
    const {error} = await admin.rpc('gc_activate_payment',{p_id:charge.id,p_order_id:charge.provider_order_id});
    if (error) throw new Error('Não foi possível liberar o plano.');
  }
  const {data,error} = await admin.from('gc_payments').select('*').eq('id',charge.id).single();
  if (error) throw new Error('Não foi possível consultar a cobrança.');
  return data;
}
export const publicCharge = (charge:any) => ({id:charge.id,status:charge.status,amount:Number(charge.amount),
  earlyRenewal:charge.pricing_kind==='early_renewal',
  qrCode:charge.qr_code,qrCodeBase64:charge.qr_code_base64,expiresAt:charge.expires_at,
  activated:Boolean(charge.activated_at)});
