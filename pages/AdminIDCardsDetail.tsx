import React from 'react';
import { AcademyStats } from '../services/idCardService';
import { ChevronLeft, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { AdminListSkeleton } from '../components/AdminShared';
import { useAdminIDCardsDetail } from '../hooks/useAdminIDCardsDetail';
import { PrintingTable } from '../components/admin/id-cards/PrintingTable';
import { PrintPreviewModal } from '../components/admin/id-cards/PrintPreviewModal';
import { IDCardView } from '../components/id-card/IDCardView';

interface AdminIDCardsDetailProps {
    academy: AcademyStats;
    onBack: () => void;
}

export const AdminIDCardsDetail: React.FC<AdminIDCardsDetailProps> = ({ academy, onBack }) => {
    const logic = useAdminIDCardsDetail(academy);

    const filterBtnClass = (active: boolean) => `
        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
        ${active ? 'bg-cbjjs-blue text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}
    `;

    return (
        <div className="animate-fadeIn space-y-6">
            
            {/* PORTAL DE IMPRESSÃO NATIVA */}
            <div className="print-portal-standalone">
                {logic.previewUser && (
                    <div className="print-card-wrapper">
                        <IDCardView 
                            fullName={logic.previewUser.fullName}
                            profileImage={logic.previewUser.profileImage}
                            federationId={logic.previewUser.federationId}
                            dob={logic.previewUser.dob}
                            belt={logic.previewUser.athleteData?.belt || 'Branca'}
                            academyName={academy.name}
                            paymentConfirmedAt={logic.previewUser.paymentConfirmedAt}
                            responsavel={logic.previewUser.isDependent ? logic.previewUser.parentName : undefined}
                        />
                    </div>
                )}
                
                {!logic.previewUser && logic.athletesToPrint.map(athlete => (
                    <div key={athlete.id} className="print-card-wrapper break-after-page">
                        <IDCardView 
                            fullName={athlete.fullName}
                            profileImage={athlete.profileImage}
                            federationId={athlete.federationId}
                            dob={athlete.dob}
                            belt={athlete.athleteData?.belt || 'Branca'}
                            academyName={academy.name}
                            paymentConfirmedAt={athlete.paymentConfirmedAt}
                            responsavel={athlete.isDependent ? athlete.parentName : undefined}
                        />
                    </div>
                ))}
            </div>

            {/* INTERFACE DO ADMINISTRADOR */}
            <div className="print:hidden space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-400 font-black hover:text-cbjjs-blue transition-colors uppercase text-[10px] tracking-widest">
                        <ChevronLeft size={16}/> Voltar
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border flex gap-1 shadow-sm">
                            <button 
                                onClick={() => logic.setPlanFilter('ALL')} 
                                className={filterBtnClass(logic.planFilter === 'ALL')}
                            >
                                <Layers size={14}/> Todos
                            </button>
                            <button 
                                onClick={() => logic.setPlanFilter('PRINTED')} 
                                className={filterBtnClass(logic.planFilter === 'PRINTED')}
                            >
                                <CheckCircle2 size={14}/> Plano Impresso
                            </button>
                        </div>
                        <button onClick={() => logic.refetch()} className="p-2.5 bg-white border rounded-xl text-cbjjs-blue">
                            <RefreshCw size={20} className={logic.isFetching ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black dark:text-white tracking-tight">{academy.name}</h2>
                        <p className="text-sm text-gray-500 font-medium">Gestão de Carteirinhas</p>
                    </div>
                    {logic.isLoading ? <AdminListSkeleton /> : <PrintingTable athletes={logic.filteredAthletes} selectedIds={logic.selectedIds} onToggleSelection={logic.handleToggleSelection} onPreview={logic.setPreviewUser} onTogglePrinted={logic.handleTogglePrinted} processingId={logic.processingId} />}
                </div>
            </div>

            <PrintPreviewModal 
                isOpen={!!logic.previewUser}
                user={logic.previewUser}
                academyName={academy.name}
                onClose={() => logic.setPreviewUser(null)}
                onPrint={() => window.print()}
                onTogglePrinted={(u) => logic.handleTogglePrinted(u).then(() => logic.setPreviewUser(null))}
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
                    }

                    .print-card-wrapper {
                        display: block !important;
                        width: 86mm !important; 
                        height: 54mm !important;
                        overflow: hidden !important;
                        background: white !important;
                        position: relative !important;
                    }

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

                    .break-after-page { page-break-after: always !important; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
            `}</style>
        </div>
    );
};