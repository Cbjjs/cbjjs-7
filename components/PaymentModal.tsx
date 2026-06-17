import React, { useState } from 'react';
import { X, Copy, Check, CreditCard, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixId: string;
  pixCode: string;
  qrCodeBase64: string;
  amount: string;
  dependentId?: string; // Prop opcional para saber se é pagamento de filho
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  pixId,
  pixCode, 
  qrCodeBase64, 
  amount,
  dependentId,
  onSuccess
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    addToast('success', 'Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckPayment = async () => {
      setIsVerifying(true);
      try {
          // Enviamos o pixId e o dependentId (se existir) para a função
          const { data, error } = await supabase.functions.invoke('check-abacate-payment', {
              body: { pixId, dependentId }
          });

          if (error) throw error;

          if (data.status === 'PAID') {
              addToast('success', 'Pagamento confirmado com sucesso!');
              onSuccess();
          } else {
              addToast('info', 'O pagamento ainda consta como pendente. Se você já pagou, aguarde de 30 a 60 segundos para o banco processar.');
          }
      } catch (err: any) {
          addToast('error', 'Falha ao verificar pagamento. Tente novamente em instantes.');
      } finally {
          setIsVerifying(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl shadow-2xl relative border border-gray-100 dark:border-gray-700">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <CreditCard size={32} className="text-green-600 dark:text-green-400" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Pagamento da Anuidade</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Escaneie o QR Code abaixo para finalizar sua afiliação.
            </p>

            <div className="bg-blue-900 p-8 rounded-3xl mb-8 text-white w-full shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-xs uppercase font-bold tracking-widest opacity-70 mb-1">Valor a pagar</p>
                <h4 className="text-4xl font-black">R$ {amount}</h4>
            </div>

            <div className="w-full space-y-6">
              {qrCodeBase64 && (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
                    <img src={qrCodeBase64} alt="QR Code Pix" className="w-48 h-48" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={handleCopy}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                    copied ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border-2 border-transparent hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                </button>

                <button 
                  onClick={handleCheckPayment}
                  disabled={isVerifying}
                  className="w-full py-4 bg-cbjjs-blue hover:bg-blue-800 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                  Já efetuei o pagamento
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-green-500" />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Pagamento Seguro • AbacatePay
          </p>
        </div>
      </div>
    </div>
  );
};