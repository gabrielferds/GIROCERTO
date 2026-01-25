
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // TODO: Validar Signature/Headers da InfinitePay para segurança
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { payment_id, status } = body; // Estrutura depende da InfinitePay

    // Apenas processamos pagamentos confirmados
    if (status === 'approved' || status === 'confirmed') {
      // 1. Buscar o pagamento no banco para pegar o user_id
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id')
        .eq('payment_id', payment_id)
        .single();

      if (payment) {
        const planStart = new Date();
        const planEnd = new Date();
        planEnd.setDate(planEnd.getDate() + 30);

        // 2. Atualizar Pagamento
        await supabase
          .from('payments')
          .update({ status: 'pago', confirmed_at: planStart.toISOString() })
          .eq('payment_id', payment_id);

        // 3. Atualizar Perfil
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

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
