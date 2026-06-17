import React from 'react';
import { CheckCircle, Clock, Award } from 'lucide-react';
import { User, Belt } from '../types';
import { formatDateBR } from '../utils/formatters';

interface GraduationHistoryProps {
  athleteData: User['athleteData'];
  isEditing?: boolean;
  onUpdate?: (updates: Partial<User['athleteData']>) => void;
}

const BELTS_ORDER = [
  Belt.WHITE, 
  Belt.GREY, 
  Belt.YELLOW, 
  Belt.ORANGE, 
  Belt.GREEN, 
  Belt.BLUE, 
  Belt.PURPLE, 
  Belt.BROWN, 
  Belt.BLACK,
  Belt.BLACK_1,
  Belt.BLACK_2,
  Belt.BLACK_3,
  Belt.BLACK_4,
  Belt.BLACK_5,
  Belt.BLACK_6,
  Belt.RED_BLACK,
  Belt.RED_WHITE,
  Belt.RED
];

export const GraduationHistory: React.FC<GraduationHistoryProps> = ({ athleteData, isEditing = false, onUpdate }) => {
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-md h-auto";
  const currentBelt = athleteData?.belt || Belt.WHITE;
  const currentBeltIndex = BELTS_ORDER.indexOf(currentBelt);

  const getBeltStatus = (index: number) => {
    if (index < currentBeltIndex) return 'GRADUADO';
    if (index === currentBeltIndex) return 'ATUAL';
    return 'FUTURO';
  };

  const getBeltDateKey = (belt: Belt) => {
      // Map display name to a key-friendly format if needed
      // For simplicity, we can use a lookup or just the belt string sanitized
      return `date_${belt.replace(/\s+/g, '_').toLowerCase()}`;
  };

  const getBeltDate = (belt: Belt) => {
      const key = getBeltDateKey(belt);
      return athleteData?.[key] || '';
  };

  return (
    <div className={cardClass}>
      <h3 className="text-lg font-black mb-6 border-b pb-4 dark:text-white flex items-center gap-2">
        <Award className="text-cbjjs-gold" size={20} /> Histórico de Graduação
      </h3>

      {isEditing && (
        <div className="mb-8">
          <label className="text-[10px] font-black text-cbjjs-blue uppercase tracking-widest block mb-4">Selecione sua Faixa Atual</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {BELTS_ORDER.map((b) => (
              <button
                key={b}
                onClick={() => onUpdate?.({ belt: b })}
                className={`py-3 px-4 rounded-xl border-2 text-[10px] font-black transition-all text-center uppercase tracking-tighter
                  ${currentBelt === b 
                    ? 'bg-cbjjs-blue text-white border-cbjjs-blue shadow-lg shadow-blue-500/20' 
                    : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-cbjjs-blue/30'}
                `}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 relative">
        {/* Vertical Line Decoration */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-slate-700 z-0"></div>

        {BELTS_ORDER.map((belt, index) => {
          const status = getBeltStatus(index);
          const rawDate = getBeltDate(belt);
          const formattedDate = rawDate ? formatDateBR(rawDate) : null;

          // No histórico, mostramos apenas até a faixa atual ou um nível acima para não ficar muito longo
          if (index > currentBeltIndex + 1 && !isEditing) return null;

          return (
            <div key={belt} className={`flex gap-4 relative z-10 ${isEditing ? 'items-start' : 'items-center'}`}>
              <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className={`w-4 h-4 rounded-full border-2 
                  ${status === 'GRADUADO' ? 'bg-green-500 border-green-200' : 
                    status === 'ATUAL' ? 'bg-cbjjs-blue border-blue-200' : 
                    'bg-gray-200 border-gray-100 dark:bg-slate-700 dark:border-slate-600'}`}
                ></div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-black dark:text-white uppercase tracking-tight`}>
                      Faixa {belt}
                    </p>
                    {status === 'GRADUADO' && <CheckCircle size={14} className="text-green-500"/>}
                    {status === 'ATUAL' && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">ATUAL</span>}
                    {status === 'FUTURO' && <Clock size={14} className="text-gray-300"/>}
                  </div>
                  
                  {!isEditing && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {status === 'GRADUADO' ? (formattedDate ? `Graduado em ${formattedDate}` : 'Graduação confirmada') : 
                       status === 'ATUAL' ? (formattedDate ? `Promovido em ${formattedDate}` : 'Nível atual') : 
                       'Próxima graduação'}
                    </p>
                  )}
                </div>

                {isEditing && (
                   <div className="w-full md:w-auto">
                      <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Data (Opcional)</label>
                      <input 
                        type="date" 
                        value={rawDate || ''}
                        onChange={(e) => onUpdate?.({ [getBeltDateKey(belt)]: e.target.value })}
                        className="text-xs p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-1 focus:ring-cbjjs-blue w-full md:w-40"
                      />
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};