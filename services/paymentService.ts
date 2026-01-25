
import { supabase } from './supabase';
import { PixPaymentResponse } from '../types';

/**
 * Serviço de integração com InfinitePay via Cloudflare Pages Functions.
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
      throw new Error(errorData.error || 'Falha ao gerar cobrança no Cloudflare.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao gerar cobrança InfinitePay:", error);
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
