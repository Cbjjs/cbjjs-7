"use client";

import React from 'react';
import { ChevronRight, Users, Clock } from 'lucide-react';

interface AthleteAcademyListItemProps {
  academy: {
    id: string;
    name: string;
    team_name?: string;
    totalAthletes: number;
    pendingApprovalCount: number;
  };
  onClick: (academy: any) => void;
}

export const AthleteAcademyListItem: React.FC<AthleteAcademyListItemProps> = ({ academy, onClick }) => {
  return (
    <div 
      onClick={() => onClick(academy)}
      className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-all group hover:border-cbjjs-blue hover:shadow-xl cursor-pointer flex items-center justify-between"
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-cbjjs-blue font-black shadow-inner">
                {academy.name.substring(0,2).toUpperCase()}
            </div>
            <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-cbjjs-blue transition-colors leading-tight truncate">
                    {academy.name}
                </h3>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    {academy.team_name || 'Equipe não informada'}
                </p>
            </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-xl border dark:border-slate-700">
                <Users size={14} className="text-cbjjs-blue" />
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-tight">
                    Total de Atletas: <span className="text-gray-900 dark:text-white ml-1">{academy.totalAthletes}</span>
                </span>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${academy.pendingApprovalCount > 0 ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'}`}>
                <Clock size={14} className={academy.pendingApprovalCount > 0 ? 'text-amber-600' : 'text-green-600'} />
                <span className={`text-[10px] font-black uppercase tracking-tight ${academy.pendingApprovalCount > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    Aguardando Confederação: <span className="ml-1">{academy.pendingApprovalCount}</span>
                </span>
            </div>
        </div>
      </div>
      
      <div className="p-3 text-gray-300 group-hover:text-cbjjs-blue group-hover:translate-x-1 transition-all">
        <ChevronRight size={32} />
      </div>
    </div>
  );
};