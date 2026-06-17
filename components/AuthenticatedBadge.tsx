import React from 'react';
import { CheckCircle } from 'lucide-react';

export const AuthenticatedBadge: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="animate-shimmer-green relative overflow-hidden flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-5 py-2.5 rounded-full border border-green-100 dark:border-green-800 shadow-sm">
            <CheckCircle size={16} className="relative z-10" />
            <span className="text-xs font-black uppercase tracking-wider relative z-10">Documentos Autenticados</span>
        </div>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Estes documentos digitais são válidos para identificação em todos os campeonatos oficiais da CBJJS.
        </p>
    </div>
  );
};