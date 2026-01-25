
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    const { payment_id, status } = body;

    // Lógica de validação do status enviado pela InfinitePay
    if (status === 'approved' || status === 'confirmed' || status === 'paid') {
      // Busca o registro original do pagamento
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id')
        .eq('payment_id', payment_id)
        .single();

      if (payment) {
        const planStart = new Date();
        const planEnd = new Date();
        planEnd.setDate(planEnd.getDate() + 30);

        // Atualiza pagamento para status final
        await supabase
          .from('payments')
          .update({ 
            status: 'pago', 
            confirmed_at: planStart.toISOString() 
          })
          .eq('payment_id', payment_id);

        // Atualiza perfil do usuário para plano ativo
        await supabase
          .from('profiles')
          .update({
            plan_status: 'active',
            plano_inicio: planStart.toISOString(),
            plano_fim: planEnd.toISOString(),
            last_payment_id: payment_id
          })
          .eq('id', payment.user_id);
          
        console.log(`Plano ativado com sucesso para o usuário: ${payment.user_id}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
