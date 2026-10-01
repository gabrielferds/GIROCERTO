import React, { useEffect, useRef, useState } from 'react';
import { Copy, CheckCircle2, Wallet } from 'lucide-react';
import { PIX_KEY } from '../config/payment';
import { paymentConfiguration, createPixPayment, checkPaymentStatus, PixCharge } from '../services/paymentService';

interface PaymentScreenProps {
  userId: string;
  userName: string;
  userEmail: string;
  onPaymentSuccess: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({userId,onPaymentSuccess}) => {
  const [ready,setReady] = useState<boolean | null>(null);
  const [charge,setCharge] = useState<PixCharge | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [now,setNow] = useState(Date.now());
  const checking = useRef(false);
  const success = useRef(onPaymentSuccess);
  success.current = onPaymentSuccess;
  const storageKey = `girocerto:pix:${userId}`;
  const expired = Boolean(charge && new Date(charge.expiresAt).getTime() <= now);
  const canceled = ['canceled','failed','expired'].includes(charge?.status || '');
  const acceptCharge = (next:PixCharge) => {
    setCharge(next);
    if(next.activated) { localStorage.removeItem(storageKey); success.current(); }
  };
  useEffect(()=>{
    let mounted=true;
    paymentConfiguration().then(async config=>{
      if(!mounted)return;
      setReady(config.ready);
      const id=localStorage.getItem(storageKey);
      if(config.ready && id){
        try{ const existing=await checkPaymentStatus(id); if(mounted) acceptCharge(existing); }
        catch{localStorage.removeItem(storageKey);}
      }
    }).catch(()=>{if(mounted){setReady(false);setError('Não foi possível consultar o pagamento automático. Tente atualizar a página.');}});
    return ()=>{mounted=false;};
  },[userId]);
  useEffect(()=>{
    if(!charge || charge.activated || canceled)return;
    let mounted=true;
    const poll=async()=>{
      if(checking.current || document.hidden)return;
      checking.current=true;
      try{const next=await checkPaymentStatus(charge.id);if(mounted){setError('');acceptCharge(next);}}
      catch(e){if(mounted)setError(e instanceof Error?e.message:'Não foi possível consultar o pagamento.');}
      finally{checking.current=false;}
    };
    const timer=window.setInterval(()=>{setNow(Date.now());void poll();},8000);
    window.addEventListener('focus',poll);
    return ()=>{mounted=false;window.clearInterval(timer);window.removeEventListener('focus',poll);};
  },[charge?.id,canceled]);
  const generate=async()=>{
    if(busy)return;
    setBusy(true);setError('');setCopied(false);setCopyError(false);
    try{const next=await createPixPayment();localStorage.setItem(storageKey,next.id);acceptCharge(next);setNow(Date.now());}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível gerar o PIX.');}
    finally{setBusy(false);}
  };
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const keyInput = useRef<HTMLInputElement>(null);

  const copyKey = async () => {
    setCopied(false);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(ready ? charge?.qrCode || '' : PIX_KEY);
      setCopied(true);
    } catch {
      keyInput.current?.focus();
      keyInput.current?.select();
      setCopyError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-6">
      <div className="w-full max-w-sm mx-auto bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 text-center">
        <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wallet size={30} aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Renove seu Giro</h2>
        <p className="text-slate-600 text-base mb-6">Pagamento por PIX</p>
        <div className="bg-orange-50 rounded-3xl p-5 mb-6 border border-orange-100">
          <span className="text-slate-900 font-black text-4xl">R$ 12,99</span>
          <span className="text-slate-600 font-bold text-sm"> /mês</span>
        </div>
        <p className="text-sm text-slate-600 mb-5">Mais 30 dias de acesso. Cada renovação exige um novo pagamento.</p>
        {ready === null && <p role="status">Carregando opções de pagamento…</p>}
        {ready && (!charge || expired || canceled) && <button disabled={busy} onClick={generate} className="w-full mb-4 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl">{busy?'Gerando PIX…':charge?'Gerar novo PIX':'Gerar PIX com Mercado Pago'}</button>}
        {ready && charge && <div className="mb-4" role="status">
          <p className="font-semibold text-slate-700">{charge.activated?'Pagamento confirmado!':canceled?'Cobrança cancelada.':expired?'Este código venceu. Gere um novo PIX.':charge.status==='confirming'?'Pagamento recebido. Aguardando confirmação.':'Aguardando pagamento'}</p>
          {!expired && !canceled && charge.qrCodeBase64 && <img className="mx-auto mt-4 w-56 h-56" alt="QR Code PIX do seu plano GiroCerto" src={`data:image/png;base64,${charge.qrCodeBase64}`} />}
          {!expired && !canceled && <p className="text-sm text-slate-500 mt-3">Válido até {new Date(charge.expiresAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}. A confirmação é verificada automaticamente.</p>}
          {!expired && !canceled && !charge.qrCode && <p className="text-sm mt-3">Preparando o código de pagamento…</p>}
        </div>}
        {(ready === false || (ready && charge?.qrCode && !expired && !canceled)) && <>
        <label htmlFor="girocerto-pix-key" className="block text-left text-sm font-bold text-slate-600 mb-2">{ready?'PIX Copia e Cola':'Chave PIX · e-mail'}</label>
        <input
          ref={keyInput}
          id="girocerto-pix-key"
          type="text"
          value={ready ? charge?.qrCode || '' : PIX_KEY}
          readOnly
          spellCheck={false}
          onClick={(event) => event.currentTarget.select()}
          className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-base text-slate-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button onClick={copyKey} className="w-full mt-4 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
          {copied ? <CheckCircle2 size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
          {copied ? 'PIX copiado!' : ready ? 'Copiar código PIX' : 'Copiar chave PIX'}
        </button>
        <div aria-live="polite" className="text-sm mt-3">
          {copied && <p className="text-emerald-700">{ready?'Cole na opção PIX Copia e Cola do seu banco.':'Cole na opção de pagar por chave PIX do seu banco.'}</p>}
          {copyError && <p className="text-red-700">Não foi possível copiar automaticamente. A chave está selecionada: copie manualmente.</p>}
        </div>
        </>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        {ready === false && <>
          <p className="text-left text-sm text-slate-600 mt-6 leading-relaxed">No seu banco, escolha PIX, cole a chave e informe o valor acima. Confira o nome do recebedor antes de confirmar.</p>
          <p className="text-left text-sm text-slate-500 mt-3 leading-relaxed">Nesta opção, a confirmação do pagamento e a liberação são manuais. O pagamento automático está em configuração.</p>
        </>}
        {ready && <p className="text-left text-sm text-slate-500 mt-6 leading-relaxed">Pague somente o código gerado acima para receber a liberação automática. Transferências para a chave de e-mail exigem confirmação manual.</p>}
      </div>
    </div>
  );
};

export default PaymentScreen;
