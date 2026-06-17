"use client";

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortButtonProps {
    order: 'asc' | 'desc';
    onClick: () => void;
}

export const SortButton: React.FC<SortButtonProps> = ({ order, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Ordenar Lista"
        >
            <ArrowUpDown size={18} className={order === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ordem A-Z</span>
        </button>
    );
};