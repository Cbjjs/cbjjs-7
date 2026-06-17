import React from 'react';
import { MoreVertical, Eye, Trash2, RotateCcw } from 'lucide-react';
import { AcademyWithProfile } from '../../services/academyService';

interface AcademyListItemProps {
  academy: AcademyWithProfile;
  onClick: (academy: AcademyWithProfile) => void;
  onDelete: (academy: AcademyWithProfile) => void;
  onRestore?: (id: string) => void;
  isActiveMenu: boolean;
  onMenuToggle: (id: string | null) => void;
  menuRef?: React.RefObject<HTMLDivElement>;
}

export const AcademyListItem: React.FC<AcademyListItemProps> = ({ 
  academy, onClick, onDelete, onRestore, isActiveMenu, onMenuToggle, menuRef 
}) => {
  const isDeleted = academy.deleted === 'yes';

  return (
    <div 
      onClick={() => onClick(academy)}
      className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-between group hover:border-cbjjs-blue transition-all relative cursor-pointer"
    >
      <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white group-hover:text-cbjjs-blue transition-colors truncate leading-tight">
          {academy.name}
        </h3>
        <p className="text-[11px] md:text-xs font-black text-cbjjs-blue uppercase tracking-tight mt-1 truncate">
          Prof: {academy.ownerProfile?.fullName || 'Não informado'}
        </p>
        
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Certificado:</span>
            <span className={`text-[9px] font-black uppercase ${academy.blackBeltCertificate?.url ? 'text-green-500' : 'text-red-500'}`}>
              {academy.blackBeltCertificate?.url ? '[OK]' : '[PENDENTE]'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Identidade:</span>
            <span className={`text-[9px] font-black uppercase ${academy.identityDocument?.url ? 'text-green-500' : 'text-red-500'}`}>
              {academy.identityDocument?.url ? '[OK]' : '[PENDENTE]'}
            </span>
          </div>
        </div>

        <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1 truncate leading-relaxed">
          {academy.address?.street}, {academy.address?.number} - {academy.address?.city}/{academy.address?.state}
        </p>
      </div>
      
      <div className="relative flex items-center h-full self-center" ref={isActiveMenu ? menuRef : null}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle(isActiveMenu ? null : academy.id);
          }}
          className="p-3 text-gray-400 hover:text-cbjjs-blue hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          <MoreVertical size={24} />
        </button>

        {isActiveMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[60] py-2 animate-fadeIn">
            <button 
              onClick={(e) => { e.stopPropagation(); onClick(academy); onMenuToggle(null); }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
            >
              <Eye size={16} /> Ver Detalhes
            </button>
            
            <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>
            
            {isDeleted ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onRestore?.(academy.id); onMenuToggle(null); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={16} /> Restaurar Unidade
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(academy); onMenuToggle(null); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Excluir Unidade
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};