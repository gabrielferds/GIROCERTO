
import { supabase } from './supabase';
import { PixPaymentResponse } from '../types';

/**
 * Serviço de integração com InfinitePay via Vercel API.
 */

export const createPixPayment = async (userId: string, email: string): Promise<PixPaymentResponse> => {
  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao conectar com a API de pagamentos.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  const { data } = await supabase
    .from('payments')
    .select('status')
    .eq('payment_id', paymentId)
    .single();

  return data?.status || 'pendente';
};
