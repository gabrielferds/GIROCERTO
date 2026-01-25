
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { payment_id, status } = req.body;

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

        // Atualização atômica do status de pagamento
        await supabase
          .from('payments')
          .update({ 
            status: 'pago', 
            confirmed_at: planStart.toISOString() 
          })
          .eq('payment_id', payment_id);

        // Ativação do plano no perfil do motoboy
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

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Erro no Webhook (Vercel):', err.message);
    return res.status(500).json({ error: 'Falha ao processar Webhook' });
  }
}
