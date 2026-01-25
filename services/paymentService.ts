
import { supabase } from './supabase';
import { PixPaymentResponse } from '../types';

/**
 * Serviço de integração com InfinitePay utilizando chave PIX fixa.
 * Chave fixa: gabrielferds044@gmail.com
 */

const FIXED_PIX_KEY = 'gabrielferds044@gmail.com';

export const createPixPayment = async (userId: string, email: string): Promise<PixPaymentResponse> => {
  try {
    const mockPaymentId = `IP-${Math.floor(Math.random() * 1000000)}`;
    
    // O código PIX gerado é vinculado à chave gabrielferds044@gmail.com
    const mockPixCode = `00020126360014BR.GOV.BCB.PIX0125${FIXED_PIX_KEY}520400005303986540512.995802BR5910GiroCerto6009SaoPaulo62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    // Registrar a cobrança pendente no Supabase
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      gateway: 'infinitepay',
      payment_id: mockPaymentId,
      amount: 12.99,
      status: 'pendente',
      method: 'pix'
    });

    if (error) throw error;

    return {
      id: mockPaymentId,
      qr_code: mockPixCode,
      qr_code_base64: '', 
      status: 'pendente'
    };
  } catch (error) {
    console.error("Erro ao gerar cobrança InfinitePay:", error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  // Consulta o status real no banco (atualizado pelo Webhook da InfinitePay)
  const { data } = await supabase
    .from('payments')
    .select('status')
    .eq('payment_id', paymentId)
    .single();

  return data?.status || 'pendente';
};
