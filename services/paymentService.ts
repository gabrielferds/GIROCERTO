
import { supabase } from './supabase';
export interface PixCharge {
  id: string; status: string; amount: number; qrCode: string | null;
  qrCodeBase64: string | null; expiresAt: string; activated: boolean;
}
async function call<T>(body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke('girocerto-payments', { body });
  if (error) {
    let message = 'Não foi possível acessar o pagamento. Tente novamente.';
    try { message = (await error.context?.json())?.error || message; } catch { /* preserve message */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export const paymentConfiguration = () => call<{ready:boolean}>({action:'config'});
export const createPixPayment = () => call<PixCharge>({action:'create'});
export const checkPaymentStatus = (id: string) => call<PixCharge>({action:'status',id});
