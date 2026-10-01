
import React, { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle2, ShieldCheck, Loader2, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { checkPaymentStatus, createPixPayment } from '../services/paymentService';
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
      setError(err instanceof Error ? err.message : "Pagamento indisponível.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initPayment();
  }, []);

  // Polling para verificar se o Webhook já atualizou o banco
  useEffect(() => {
    let interval: any;
    if (paymentData && !verifying) {
      interval = setInterval(async () => {
        const status = await checkPaymentStatus(paymentData.id);
        if (status === 'pago') {
          onPaymentSuccess();
        }
      }, 5000); // Checa a cada 5 segundos
    }
    return () => clearInterval(interval);
  }, [paymentData, verifying]);

  const handleCopyCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualVerify = async () => {
    if (!paymentData) return;
    setVerifying(true);
    try {
      const status = await checkPaymentStatus(paymentData.id);
      if (status === 'pago') {
        onPaymentSuccess();
      } else {
        setError("Pagamento ainda não identificado. Aguarde um momento.");
      }
    } catch (err) {
      setError("Erro ao processar. Tente novamente.");
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
            Seu corre não pode parar! Garanta mais 30 dias de controle total.
          </p>

          <div className="bg-indigo-50 rounded-3xl p-6 mb-8 border border-indigo-100/50">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-indigo-900 font-black text-4xl">R$ 12,99</span>
              <span className="text-indigo-400 font-bold text-sm">/mês</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conectando Servidor...</p>
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold text-left">{error}</p>
              </div>
              <button onClick={initPayment} className="text-indigo-600 text-xs font-black uppercase flex items-center gap-2 justify-center w-full">
                <RefreshCw size={14} /> TENTAR NOVAMENTE
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
                <button 
                  onClick={handleCopyCode}
                  className="w-full py-4 bg-white border border-slate-200 hover:border-indigo-500 text-slate-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {copied ? (
                    <><CheckCircle2 size={16} className="text-emerald-500" /> COPIADO!</>
                  ) : (
                    <><Copy size={16} /> COPIAR CÓDIGO PIX</>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-3 text-left bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-emerald-700 leading-tight">
                  A liberação é automática via InfinitePay. Se já pagou, aguarde alguns segundos ou clique abaixo.
                </p>
              </div>

              <button 
                disabled={verifying}
                onClick={handleManualVerify}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={20} className="animate-spin" /> : 'VERIFICAR PAGAMENTO'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
          Pagamento disponível após configurar o provedor de cobrança.
        </p>
      </div>
    </div>
  );
};

export default PaymentScreen;
