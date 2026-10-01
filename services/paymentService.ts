
import { supabase } from './supabase';
import { PixPaymentResponse } from '../types';

/**
 * Serviço de integração com InfinitePay via Vercel API.
 */

export const createPixPayment = async (userId: string, email: string): Promise<PixPaymentResponse> => {
  throw new Error('Pagamento PIX ainda não disponível. A integração de cobrança precisa ser concluída.');
};

export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  const { data } = await supabase
    .from('payments')
    .select('status')
    .eq('payment_id', paymentId)
    .single();

  return data?.status || 'pendente';
};
