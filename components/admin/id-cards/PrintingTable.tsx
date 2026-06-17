import React from 'react';
import { User as UserIcon, CheckSquare, Square, CheckCircle, Printer, Eye, XCircle, Loader2 } from 'lucide-react';
import { User } from '../../../types';

interface PrintingTableProps {
    athletes: User[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onPreview: (user: User) => void;
    onTogglePrinted: (user: User) => void;
    processingId: string | null;
}

export const PrintingTable: React.FC<PrintingTableProps> = ({
    athletes, selectedIds, onToggleSelection, onPreview, onTogglePrinted, processingId
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-slate-700">
                        <th className="pb-4 pl-2 w-10"></th>
                        <th className="pb-4 pl-2">Atleta</th>
                        <th className="pb-4">Matrícula</th>
                        <th className="pb-4">Graduação</th>
                        <th className="pb-4 text-center">Status</th>
                        <th className="pb-4 text-right pr-2">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                    {athletes.map(athlete => (
                        <tr key={athlete.id} className={`group hover:bg-gray-50 dark:hover:bg-slate-900/40 transition-colors ${selectedIds.includes(athlete.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                            <td className="py-4 pl-2">
                                <button onClick={() => onToggleSelection(athlete.id)} className="text-cbjjs-blue">
                                    {selectedIds.includes(athlete.id) ? <CheckSquare size={20}/> : <Square size={20} className="text-gray-300"/>}
                                </button>
                            </td>
                            <td className="py-4 pl-2" onClick={() => onToggleSelection(athlete.id)}>
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 overflow-hidden shadow-inner flex-shrink-0">
                                        {athlete.profileImage ? <img src={athlete.profileImage} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-2 text-gray-300"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm dark:text-white group-hover:text-cbjjs-blue transition-colors line-clamp-1">{athlete.fullName}</p>
                                        {athlete.isDependent && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Filho</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="py-4">
                                <span className="font-mono text-xs font-bold text-gray-500">
                                    {athlete.federationId ? String(athlete.federationId).padStart(6, '0') : '---'}
                                </span>
                            </td>
                            <td className="py-4">
                                <span className="text-[10px] font-black text-cbjjs-blue uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                    {athlete.athleteData?.belt}
                                </span>
                            </td>
                            <td className="py-4 text-center">
                                <div className="flex justify-center">
                                    {athlete.isIdCardPrinted ? (
                                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                            <CheckCircle size={14}/>
                                            <span className="text-[9px] font-black uppercase">Impresso</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                            <Printer size={14}/>
                                            <span className="text-[9px] font-black uppercase">Na Fila</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 text-right pr-2">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => onPreview(athlete)}
                                        className="p-2 text-gray-400 hover:text-cbjjs-blue hover:bg-blue-50 rounded-xl transition-all"
                                        title="Ver Carteirinha"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button 
                                        onClick={() => onTogglePrinted(athlete)}
                                        disabled={processingId === athlete.id}
                                        className={`p-2 rounded-xl transition-all ${athlete.isIdCardPrinted ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                        title={athlete.isIdCardPrinted ? "Remover de 'Impressos' e voltar para fila" : "Marcar como Impresso"}
                                    >
                                        {processingId === athlete.id ? <Loader2 size={18} className="animate-spin"/> : athlete.isIdCardPrinted ? <XCircle size={18}/> : <CheckCircle size={18}/>}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};