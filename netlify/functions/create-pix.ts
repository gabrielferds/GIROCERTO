
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIXED_PIX_KEY = 'gabrielferds044@gmail.com';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, email } = JSON.parse(event.body || '{}');

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
    }

    // Simulando chamada para API da InfinitePay
    // No mundo real: const ipResponse = await fetch('https://api.infinitepay.io/v1/pix/immediate-charge', { ... });
    const paymentId = `IP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pixCode = `00020126360014BR.GOV.BCB.PIX0125${FIXED_PIX_KEY}520400005303986540512.995802BR5910GiroCerto6009SaoPaulo62070503***6304${paymentId.slice(-4).toUpperCase()}`;

    // Registrar no Supabase usando a Service Role para garantir escrita segura
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      gateway: 'infinitepay',
      payment_id: paymentId,
      amount: 12.99,
      status: 'pendente',
      method: 'pix'
    });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: paymentId,
        qr_code: pixCode,
        qr_code_base64: '',
        status: 'pendente'
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
