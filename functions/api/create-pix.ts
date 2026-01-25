
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const FIXED_PIX_KEY = 'gabrielferds044@gmail.com';

// Fixed: Using explicit any for context to avoid "Cannot find name 'PagesFunction'" error
export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    const { userId, email } = await request.json() as any;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Identificador único da transação
    const paymentId = `IP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Código PIX estático simulado
    const pixCode = `00020126360014BR.GOV.BCB.PIX0125${FIXED_PIX_KEY}520400005303986540512.995802BR5910GiroCerto6009SaoPaulo62070503***6304${paymentId.slice(-4).toUpperCase()}`;

    // Registro seguro no Supabase
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      gateway: 'infinitepay',
      payment_id: paymentId,
      amount: 12.99,
      status: 'pendente',
      method: 'pix'
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      id: paymentId,
      qr_code: pixCode,
      qr_code_base64: '',
      status: 'pendente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
