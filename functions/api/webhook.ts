
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Fixed: Using explicit any for context to avoid "Cannot find name 'PagesFunction'" error
export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    const body = await request.json() as any;
    const { payment_id, status } = body;

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    if (status === 'approved' || status === 'confirmed' || status === 'paid') {
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id')
        .eq('payment_id', payment_id)
        .single();

      if (payment) {
        const planStart = new Date();
        const planEnd = new Date();
        planEnd.setDate(planEnd.getDate() + 30);

        await supabase
          .from('payments')
          .update({ 
            status: 'pago', 
            confirmed_at: planStart.toISOString() 
          })
          .eq('payment_id', payment_id);

        await supabase
          .from('profiles')
          .update({
            plan_status: 'active',
            plano_inicio: planStart.toISOString(),
            plano_fim: planEnd.toISOString(),
            last_payment_id: payment_id
          })
          .eq('id', payment.user_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
