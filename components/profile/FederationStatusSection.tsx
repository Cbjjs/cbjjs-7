import React from 'react';
import { Award, CheckCircle, Clock, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { User, PaymentStatus, DocumentStatus } from '../../types';

interface FederationStatusSectionProps {
  user: User;
  isFederationApproved: boolean;
  onPayClick: () => void;
  onCheckPayment: () => void;
  isCheckingPayment: boolean;
}

export const FederationStatusSection: React.FC<FederationStatusSectionProps> = ({
  user,
  isFederationApproved,
  onPayClick,
  onCheckPayment,
  isCheckingPayment
}) => {
  const labelClass = "block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-md h-auto";

  return (
    <div className={cardClass}>
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Award className="text-cbjjs-gold" size={18} /> Status Federação
      </h3>
      <div className="space-y-4">
        <div>
          <span className={labelClass}>Situação Cadastral</span>
          <div className="mt-1">
            {isFederationApproved ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                <CheckCircle size={14} className="mr-2"/> Ativo
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                <Clock size={14} className="mr-2"/> Pendente
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t dark:border-slate-700">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Pagamento 2026</span>
            <span className={`font-black uppercase text-[10px] ${user.paymentStatus === PaymentStatus.PAID ? 'text-green-600' : 'text-red-500'}`}>
              {user.paymentStatus === PaymentStatus.PAID ? 'Confirmado' : 'Pendente'}
            </span>
          </div>
          
          {user.paymentStatus !== PaymentStatus.PAID && (
            <div className="space-y-3">
              <button 
                onClick={onPayClick} 
                className="w-full py-4 bg-cbjjs-green text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse-green"
              >
                <CreditCard size={16} /> Pagar Anuidade
              </button>
              <button 
                onClick={onCheckPayment} 
                disabled={isCheckingPayment}
                className="w-full py-3 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
              >
                {isCheckingPayment ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                Já realizei o pagamento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};