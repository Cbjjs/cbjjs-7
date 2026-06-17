import React from 'react';
import { School } from 'lucide-react';

export const AcademyEmptyState: React.FC = () => {
  return (
    <div className="col-span-full text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
      <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        <School size={40} className="text-gray-200 dark:text-gray-700" />
      </div>
      <h3 className="text-lg font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        Nenhuma unidade encontrada
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-600 mt-2 font-medium">
        Clique no botão "+" acima para registrar sua primeira academia.
      </p>
    </div>
  );
};