import React from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export const modalInputClass = "w-full p-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cbjjs-blue focus:border-transparent outline-none text-sm transition-colors placeholder-gray-400";
export const modalLabelClass = "text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5";

export const AdminListSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 h-24 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"></div>
        ))}
    </div>
);

export const AdminErrorState = ({ onRetry, message }: { onRetry: () => void, message?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ops! Falha na conexão</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs text-center font-medium">
                {message || "Não conseguimos carregar os dados. Verifique sua conexão com a internet."}
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full px-6">
                <button 
                    onClick={onRetry} 
                    className="flex items-center gap-2 px-8 py-3 bg-cbjjs-blue text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95 w-full md:w-auto justify-center"
                >
                    <RefreshCw size={16} /> Tentar Novamente
                </button>
            </div>
        </div>
    );
};

export const PaginationControls = ({ page, totalPages, onPrev, onNext, loading }: any) => (
    <div className="flex items-center justify-between mt-6 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <button 
            onClick={onPrev} 
            disabled={page === 1 || loading} 
            className="flex items-center px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
            <ArrowLeft size={16} className="mr-1 md:mr-2"/> 
            <span className="hidden sm:inline">Anterior</span>
            <span className="inline sm:hidden">Ant</span>
        </button>
        
        <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter text-gray-400">
            <span className="hidden sm:inline">Página</span>
            <span className="inline sm:hidden">Pág</span> {page} de {totalPages || 1}
        </span>
        
        <button 
            onClick={onNext} 
            disabled={page >= totalPages || loading} 
            className="flex items-center px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
            <span className="hidden sm:inline">Próxima</span>
            <span className="inline sm:hidden">Pró</span>
            <ArrowRight size={16} className="ml-1 md:mr-2"/>
        </button>
    </div>
);