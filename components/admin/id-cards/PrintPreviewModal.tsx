"use client";

import React from 'react';
import { Printer, CheckCircle, XCircle } from 'lucide-react';
import { User } from '../../../types';
import { IDCardView } from '../../id-card/IDCardView';
import { CloseModalButton } from './CloseModalButton';

interface PrintPreviewModalProps {
    isOpen: boolean; // Adicionado
    user: User | null;
    academyName: string;
    onClose: () => void;
    onPrint: () => void;
    onTogglePrinted?: (user: User) => void;
    isAdmin?: boolean;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
    isOpen, user, academyName, onClose, onPrint, onTogglePrinted, isAdmin = true
}) => {
    // Se não estiver aberto ou não tiver usuário, não renderiza nada
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn print:hidden">
            <div className="w-full max-w-4xl relative">
                <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-slate-800 relative">
                    <CloseModalButton onClose={onClose} />
                    
                    <div className="mb-8">
                        <h3 className="text-2xl font-black dark:text-white tracking-tight">Impressão Digital</h3>
                        <p className="text-gray-500 text-sm font-medium">Versão oficial idêntica à do atleta.</p>
                    </div>

                    <div className="w-full flex justify-center">
                        <IDCardView 
                            fullName={user.fullName}
                            profileImage={user.profileImage}
                            federationId={user.federationId}
                            dob={user.dob}
                            belt={user.athleteData?.belt || 'Branca'}
                            academyName={academyName}
                            paymentConfirmedAt={user.paymentConfirmedAt}
                            responsavel={user.isDependent ? user.parentName : undefined}
                        />
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row gap-4">
                        <button 
                            onClick={onPrint} 
                            className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                            <Printer size={20}/> Imprimir Carteirinha
                        </button>
                        
                        {isAdmin && onTogglePrinted && (
                            <button 
                                onClick={() => onTogglePrinted(user)}
                                className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${user.isIdCardPrinted ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                                {user.isIdCardPrinted ? (
                                    <><XCircle size={20}/> Voltar para Fila</>
                                ) : (
                                    <><CheckCircle size={20}/> Marcar como Impresso</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};