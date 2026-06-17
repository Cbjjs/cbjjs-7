import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User, PaymentStatus } from '../../types';
import { IDCardView } from '../id-card/IDCardView';

interface EventAccessModalProps {
  user: User | null;
  onClose: () => void;
}

export const EventAccessModal: React.FC<EventAccessModalProps> = ({ user, onClose }) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        const newScale = Math.min((availableWidth - 40) / 745, 0.9);
        setScale(newScale);
      }
    };

    if (user) {
        updateScale();
        window.addEventListener('resize', updateScale);
        const timer = setTimeout(updateScale, 150);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }
  }, [user]);

  if (!user) return null;

  const isPaid = user.paymentStatus === PaymentStatus.PAID;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-700 relative flex flex-col shadow-black/50">
        
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all z-50 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20"
        >
            <X size={28}/>
        </button>

        {/* Cabeçalho com padding reforçado para evitar cortes laterais */}
        <div className="px-10 md:px-14 pt-10 pb-8 border-b dark:border-slate-700/50 shrink-0">
            <h3 className="text-3xl font-black dark:text-white tracking-tight leading-tight mb-2">Validação de Acesso</h3>
            <p className="text-gray-500 text-sm font-medium">Confirme os dados e o status da anuidade.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide bg-gray-50/30 dark:bg-slate-900/10">
            <div className="flex flex-col items-center max-w-3xl mx-auto">
                
                <div ref={containerRef} className="w-full flex justify-center overflow-hidden mb-10 min-h-[220px]">
                    <div 
                        className="relative origin-top transition-transform duration-500 ease-out"
                        style={{ 
                            width: '745px', 
                            height: `${470 * scale}px`,
                            transform: `scale(${scale})`,
                        }}
                    >
                        <IDCardView 
                            fullName={user.fullName}
                            profileImage={user.profileImage}
                            federationId={user.federationId}
                            dob={user.dob}
                            belt={user.athleteData?.belt || 'Branca'}
                            academyName={user.academy?.name || 'Não informada'}
                            paymentConfirmedAt={user.paymentConfirmedAt}
                            responsavel={user.isDependent ? user.parentName : undefined}
                        />
                    </div>
                </div>

                <div className={`w-full p-6 md:p-8 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-6 mb-4
                    ${isPaid 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}
                `}>
                    <div className="flex items-center gap-5 text-center md:text-left">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0
                            ${isPaid ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}
                        `}>
                            {isPaid ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
                        </div>
                        <div>
                            <h4 className={`text-xl font-black uppercase tracking-tight ${isPaid ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                                {isPaid ? 'Anuidade em Dia' : 'Anuidade Pendente'}
                            </h4>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 opacity-80 uppercase tracking-tighter">
                                {isPaid ? 'Participação Autorizada' : 'Pagamento não identificado'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95
                            ${isPaid 
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' 
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'}
                        `}
                    >
                        {isPaid ? 'Liberar Entrada' : 'Fechar'}
                    </button>
                </div>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 text-center border-t dark:border-slate-700 shrink-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Confederação Brasileira de Jiu-Jitsu Social • Validação Oficial</p>
        </div>
      </div>
    </div>
  );
};