
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIXED_PIX_KEY = 'gabrielferds044@gmail.com';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const paymentId = `GC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Código PIX Estático para demonstração/suporte
    const pixCode = `00020126360014BR.GOV.BCB.PIX0125${FIXED_PIX_KEY}520400005303986540512.995802BR5910GiroCerto6009SaoPaulo62070503***6304${paymentId.slice(-4).toUpperCase()}`;

    // Registro da intenção de pagamento no banco
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      gateway: 'infinitepay',
      payment_id: paymentId,
      amount: 12.99,
      status: 'pendente',
      method: 'pix'
    });

    if (error) throw error;

    return res.status(200).json({
      id: paymentId,
      qr_code: pixCode,
      qr_code_base64: '',
      status: 'pendente'
    });
  } catch (err: any) {
    console.error('Erro na Vercel Function (create-pix):', err);
    return res.status(500).json({ error: 'Erro interno ao gerar PIX' });
  }
}
