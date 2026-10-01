import React, { useRef, useState } from 'react';
import { Copy, CheckCircle2, Wallet } from 'lucide-react';
import { PIX_KEY } from '../config/payment';

interface PaymentScreenProps {
  userId: string;
  userName: string;
  userEmail: string;
  onPaymentSuccess: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = () => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const keyInput = useRef<HTMLInputElement>(null);

  const copyKey = async () => {
    setCopied(false);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(PIX_KEY);
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
        <label htmlFor="girocerto-pix-key" className="block text-left text-sm font-bold text-slate-600 mb-2">Chave PIX · e-mail</label>
        <input
          ref={keyInput}
          id="girocerto-pix-key"
          type="text"
          value={PIX_KEY}
          readOnly
          spellCheck={false}
          onClick={(event) => event.currentTarget.select()}
          className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-base text-slate-800 font-semibold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button onClick={copyKey} className="w-full mt-4 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
          {copied ? <CheckCircle2 size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
          {copied ? 'Chave copiada!' : 'Copiar chave PIX'}
        </button>
        <div aria-live="polite" className="text-sm mt-3">
          {copied && <p className="text-emerald-700">Cole a chave na opção de pagar por chave PIX do seu banco.</p>}
          {copyError && <p className="text-red-700">Não foi possível copiar automaticamente. A chave está selecionada: copie manualmente.</p>}
        </div>
        <p className="text-left text-sm text-slate-600 mt-6 leading-relaxed">No seu banco, escolha PIX, cole a chave e informe o valor acima. Confira o nome do recebedor antes de confirmar.</p>
        <p className="text-left text-sm text-slate-500 mt-3 leading-relaxed">A confirmação do pagamento e a liberação do plano são manuais por enquanto.</p>
      </div>
    </div>
  );
};

export default PaymentScreen;
