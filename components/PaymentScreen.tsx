
import React, { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle2, ShieldCheck, Loader2, Wallet, RefreshCw, AlertCircle, Zap, ExternalLink } from 'lucide-react';
import { supabase } from '../services/supabase';
import { createPixPayment } from '../services/paymentService';
import { PixPaymentResponse } from '../types';

interface PaymentScreenProps {
  userId: string;
  userName: string;
  userEmail: string;
  onPaymentSuccess: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ userId, userName, userEmail, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await createPixPayment(userId, userEmail);
      setPaymentData(resp);
    } catch (err) {
      setError("Erro ao gerar PIX com InfinitePay. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initPayment();
  }, []);

  const handleCopyCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData) return;
    
    setVerifying(true);
    try {
      /**
       * Simulação do Webhook: 
       * Em produção, o webhook da InfinitePay enviaria um POST para o Supabase.
       * Aqui simulamos a confirmação imediata ao clicar para demonstrar o fluxo de liberação.
       */
      const isApproved = true; 

      if (isApproved) {
        const planStart = new Date().toISOString();
        const planEnd = new Date();
        planEnd.setDate(planEnd.getDate() + 30);

        // 1. Atualiza status do pagamento
        await supabase.from('payments').update({ 
          status: 'pago',
          confirmed_at: planStart
        }).eq('payment_id', paymentData.id);
        
        // 2. Atualiza perfil do usuário com as novas datas do plano
        await supabase
          .from('profiles')
          .update({ 
            plan_status: 'active',
            plano_inicio: planStart,
            plano_fim: planEnd.toISOString(),
            last_payment_id: paymentData.id
          })
          .eq('id', userId);

        onPaymentSuccess();
      } else {
        setError("Pagamento ainda não identificado pela InfinitePay.");
      }
    } catch (err) {
      setError("Erro ao processar liberação. Contate o suporte.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 bg-indigo-500/10 w-40 h-40 rounded-full blur-3xl" />
          
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                <Zap size={18} className="text-white fill-white" />
              </div>
              <span className="text-lg font-black text-slate-800 tracking-tighter italic">InfinitePay</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">Renove seu Giro</h2>
          <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
            Seu corre não pode parar! Garanta mais 30 dias de controle total por apenas R$ 12,99.
          </p>

          <div className="bg-indigo-50 rounded-3xl p-6 mb-8 border border-indigo-100/50">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-indigo-900 font-black text-4xl">R$ 12,99</span>
              <span className="text-indigo-400 font-bold text-sm">/mês</span>
            </div>
            <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-widest">Plano Mensal via PIX</p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conectando InfinitePay...</p>
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold text-left">{error}</p>
              </div>
              <button onClick={initPayment} className="text-indigo-600 text-xs font-black uppercase flex items-center gap-2 justify-center w-full">
                <RefreshCw size={14} /> GERAR NOVO CÓDIGO
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center border border-slate-100">
                <div className="bg-white p-3 rounded-2xl shadow-inner mb-4 border border-slate-200/50">
                  <div className="w-[140px] h-[140px] bg-slate-50 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                    <QrCode size={100} className="text-slate-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escaneie o QR Code</p>
                  <p className="text-[9px] font-bold text-slate-300">Vinculado à chave: gabrielferds044@gmail.com</p>
                </div>
                
                <button 
                  onClick={handleCopyCode}
                  className="w-full py-4 mt-4 bg-white border border-slate-200 hover:border-indigo-500 text-slate-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {copied ? (
                    <><CheckCircle2 size={16} className="text-emerald-500" /> COPIADO COM SUCESSO!</>
                  ) : (
                    <><Copy size={16} /> COPIAR CÓDIGO PIX</>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-3 text-left bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-emerald-700 leading-tight">
                  Pagamento confirmado via PIX! Liberação instantânea após processamento da InfinitePay.
                </p>
              </div>

              <button 
                disabled={verifying}
                onClick={handleConfirmPayment}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={20} className="animate-spin" /> : 'PAGAMENTO REALIZADO'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-1">
          <ShieldCheck size={12} className="text-indigo-400" />
          Ambiente Seguro InfinitePay
        </p>
        <button onClick={() => window.location.reload()} className="text-[10px] text-indigo-600 font-black uppercase underline">
          Voltar e tentar mais tarde
        </button>
      </div>
    </div>
  );
};

export default PaymentScreen;
