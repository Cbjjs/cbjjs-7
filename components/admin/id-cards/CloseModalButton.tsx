"use client";

import React from 'react';
import { X } from 'lucide-react';

interface CloseModalButtonProps {
    onClose: () => void;
    label?: string;
}

export const CloseModalButton: React.FC<CloseModalButtonProps> = ({ onClose, label = "Fechar" }) => {
    return (
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all z-[10002] flex items-center gap-2 font-black uppercase text-[10px] tracking-widest group"
        >
            <span className="group-hover:translate-x-[-4px] transition-transform hidden md:inline">{label}</span>
            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-700 group-hover:bg-gray-200 transition-all">
                <X size={20}/>
            </div>
        </button>
    );
};