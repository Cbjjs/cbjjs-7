import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, Smartphone, Printer, Star, ShieldCheck } from 'lucide-react';

export interface PaymentPlanOption {
    id: 'DIGITAL' | 'PRINTED';
    title: string;
    price: number;
    description: string;
    icon: any;
    color: string;
    featured?: boolean;
}

interface PaymentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: (plan: PaymentPlanOption) => void;
  isLoading: boolean;
  availablePlans?: PaymentPlanOption[];
}

export const PaymentInviteModal: React.FC<PaymentInviteModalProps> = ({
  isOpen,
  onClose,
  onPay,
  isLoading,
  availablePlans = []
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'DIGITAL' | 'PRINTED' | null>(
      availablePlans.find(p => p.id === 'PRINTED')?.id || availablePlans[0]?.id || null
  );

  if (!isOpen) return null;

  if (availablePlans.length === 0) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] text-center max-w-sm">
                <Loader2 className="animate-spin mx-auto mb-4 text-cbjjs-blue" size={32} />
                <p className="text-sm font-bold dark:text-white uppercase tracking-widest">Carregando Planos...</p>
            </div>
        </div>
      );
  }

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId) || availablePlans[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem] p-8 shadow-2xl border dark:border-slate-700 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-20"
          disabled={isLoading}
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
            <h3 className="text-2xl font-black dark:text-white tracking-tight">Finalizar Afiliação</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Escolha como deseja receber sua carteirinha.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {availablePlans.map((option) => (
                <div 
                    key={option.id}
                    onClick={() => !isLoading && setSelectedPlanId(option.id)}
                    className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center text-center
                        ${selectedPlanId === option.id 
                            ? (option.color === 'blue' ? 'border-cbjjs-blue bg-blue-50/50 dark:bg-blue-900/20' : 'border-cbjjs-green bg-green-50/50 dark:bg-green-900/20') 
                            : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200'
                        }
                    `}
                >
                    {option.featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cbjjs-gold text-black text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Mais Escolhida
                        </div>
                    )}

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 
                        ${selectedPlanId === option.id 
                            ? (option.color === 'blue' ? 'bg-cbjjs-blue text-white' : 'bg-cbjjs-green text-white')
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                        }
                    `}>
                        <option.icon size={24} />
                    </div>

                    <h4 className="font-black text-sm dark:text-white mb-1">{option.title}</h4>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-snug mb-4 flex-1">
                        {option.description}
                    </p>
                    
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                        R$ {option.price.toFixed(2).replace('.', ',')}
                    </div>

                    {selectedPlanId === option.id && (
                        <div className="absolute top-3 right-3 text-cbjjs-blue">
                            <CheckCircle size={18} fill="currentColor" className="text-white" />
                        </div>
                    )}
                </div>
            ))}
        </div>

        <button
          onClick={() => onPay(selectedPlan)}
          disabled={isLoading}
          className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
            ${selectedPlan.id === 'PRINTED' 
                ? 'bg-cbjjs-green text-white shadow-green-500/20 hover:bg-green-700 animate-pulse-green' 
                : 'bg-cbjjs-blue text-white shadow-blue-500/20 hover:bg-blue-800'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <CreditCard size={18} />
          )}
          Gerar PIX: R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
        </button>
        
        <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400">
            <ShieldCheck size={14} className="text-green-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
                Pagamento Seguro
            </p>
        </div>
      </div>
    </div>
  );
};