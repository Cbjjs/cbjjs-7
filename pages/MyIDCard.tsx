"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegistrationStatus, PaymentStatus, DocumentStatus, Dependent, Belt } from '../types';
import { Shield, ArrowRight, Lock, CheckCircle, UserPlus, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { IDCardView } from '../components/id-card/IDCardView';
import { MembershipBenefits } from '../components/id-card/MembershipBenefits';
import { PrintPreviewModal } from '../components/admin/id-cards/PrintPreviewModal';

interface MyIDCardProps {
  onNavigate?: (page: string) => void;
}

export const MyIDCard: React.FC<MyIDCardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showPrintModal, setShowPrintModal] = useState(false);

  const { data: dependentsData } = useSupabaseQuery<Dependent[]>(
    ['my-dependents-cards', user?.id],
    async (signal) => {
        const { data, error } = await supabase
            .from('dependents')
            .select('*')
            .eq('parent_id', user!.id)
            .abortSignal(signal!);

        if (error) return { data: null, error };
        
        const mapped = (data || []).map((d: any) => ({
            ...d,
            fullName: d.full_name,
            dob: d.dob,
            federationId: d.federation_id,
            profileImageUrl: d.profile_image_url,
            paymentConfirmedAt: d.payment_confirmed_at,
            belt: d.belt as Belt
        }));

        return { data: mapped as any, error: null };
    },
    { enabled: !!user?.id }
  );

  if (!user) return null;

  const dependents = dependentsData?.data || [];
  
  // REGRA DE EXIBIÇÃO: Além de tudo, a academia PRECISA estar aprovada (isAcademyApproved)
  const isAcademyApproved = user.academy?.status === RegistrationStatus.APPROVED;

  const isParentCardActive = user.isFederationApproved || (
    user.isBoardingComplete && 
    isAcademyApproved && // Exigência crítica adicionada
    user.documents.identity.status === DocumentStatus.APPROVED &&
    user.documents.profile?.status === DocumentStatus.APPROVED &&
    user.documents.medical?.status === DocumentStatus.APPROVED &&
    user.documents.belt?.status === DocumentStatus.APPROVED &&
    user.paymentStatus === PaymentStatus.PAID
  );

  const activeDependents = dependents.filter(d => 
    d.isFederationApproved || (d.paymentStatus === PaymentStatus.PAID && d.academyStatus === RegistrationStatus.APPROVED)
  );

  const totalCards = (isParentCardActive ? 1 : 0) + activeDependents.length;

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto flex flex-col items-center px-2 pb-20">
        <div className="w-full flex flex-col items-center print:hidden">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Carteirinhas Digitais</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-10 text-center font-medium">Temporada 2026 • Documentos Oficiais</p>
            
            <div className="w-full space-y-12">
                {totalCards === 0 ? (
                    <div className="max-w-lg mx-auto py-12 px-4 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 relative">
                            <Shield size={40} className="text-gray-400" />
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 border-4 border-white dark:border-slate-950">
                                <Lock size={16} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Aguardando Aprovação</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            {user.academyId && !isAcademyApproved 
                                ? `Sua carteirinha digital foi bloqueada temporariamente porque você alterou sua academia. Assim que o professor da "${user.academy?.name}" aprovar seu vínculo, ela voltará a aparecer aqui.`
                                : `Sua carteirinha digital e a de seus filhos aparecerão aqui assim que as afiliações forem aprovadas pela confederação e os vínculos com as academias confirmados.`}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button onClick={() => onNavigate?.('profile')} className="w-full font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center bg-cbjjs-blue hover:bg-blue-800 text-white">Minha Afiliação <ArrowRight size={14} className="ml-2"/></button>
                            <button onClick={() => onNavigate?.('my-dependents')} className="w-full font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white">Filho Atleta <UserPlus size={14} className="ml-2"/></button>
                        </div>
                    </div>
                ) : (
                    <>
                        {isParentCardActive && (
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase text-cbjjs-blue mb-4 tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Minha Carteirinha</span>
                                <IDCardView 
                                    fullName={user.fullName}
                                    profileImage={user.profileImage}
                                    federationId={user.federationId}
                                    dob={user.dob}
                                    belt={user.athleteData?.belt || 'Branca'}
                                    academyName={user.academy?.name || 'Não informada'}
                                    paymentConfirmedAt={user.paymentConfirmedAt}
                                />

                                <button 
                                    onClick={() => setShowPrintModal(true)}
                                    className="hidden md:flex mt-6 items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                                >
                                    <Printer size={18} /> Imprimir Carteirinha (8,6 x 5,4 cm)
                                </button>
                            </div>
                        )}

                        {activeDependents.map(child => (
                            <div key={child.id} className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase text-indigo-600 mb-4 tracking-widest bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-2 border border-indigo-100">
                                    <ArrowRight size={12}/> Carteirinha do Filho
                                </span>
                                <IDCardView 
                                    fullName={child.fullName}
                                    profileImage={child.profileImageUrl}
                                    federationId={child.federationId}
                                    dob={child.dob}
                                    belt={child.belt}
                                    academyName="---" 
                                    paymentConfirmedAt={child.paymentConfirmedAt}
                                    responsavel={user.fullName}
                                />
                            </div>
                        ))}

                        <div className="mt-8 flex flex-col items-center gap-4 text-center px-4">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-100 dark:border-green-800 shadow-sm animate-fadeIn">
                                <CheckCircle size={14} />
                                <span className="text-xs font-black uppercase tracking-wider">Documentos Autenticados</span>
                            </div>
                            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                                Estes documentos digitais são válidos para identificação em todos os campeonatos oficiais da CBJJS.
                            </p>
                        </div>
                    </>
                )}
            </div>
            <MembershipBenefits />
        </div>

        {/* Portal de Impressão Nativa */}
        <div className="print-portal-standalone">
            <div className="print-card-wrapper">
                <IDCardView 
                    fullName={user.fullName}
                    profileImage={user.profileImage}
                    federationId={user.federationId}
                    dob={user.dob}
                    belt={user.athleteData?.belt || 'Branca'}
                    academyName={user.academy?.name || 'Não informada'}
                    paymentConfirmedAt={user.paymentConfirmedAt}
                />
            </div>
        </div>

        <PrintPreviewModal 
            isOpen={showPrintModal}
            user={user}
            academyName={user.academy?.name || 'Não informada'}
            onClose={() => setShowPrintModal(false)}
            onPrint={() => window.print()}
            isAdmin={false}
        />

        <style>{`
            .print-portal-standalone { display: none; }

            @media print {
                body * {
                    visibility: hidden !important;
                }
                
                .print-portal-standalone, 
                .print-portal-standalone * {
                    visibility: visible !important;
                }

                .print-portal-standalone {
                    display: block !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                }

                .print-card-wrapper {
                    display: block !important;
                    width: 86mm !important; 
                    height: 54mm !important;
                    overflow: hidden !important;
                    background: white !important;
                    position: relative !important;
                }

                /* Escala aplicada DIRETAMENTE na carteirinha e não no container */
                .print-card-wrapper .id-card-root {
                    transform: scale(0.436) !important;
                    transform-origin: top left !important;
                    width: 745px !important;
                    height: 470px !important;
                    box-shadow: none !important;
                    border: none !important;
                }

                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    box-shadow: none !important;
                }

                @page { 
                    size: A4 portrait; 
                    margin: 10mm;
                }
            }
        `}</style>
    </div>
  );
};