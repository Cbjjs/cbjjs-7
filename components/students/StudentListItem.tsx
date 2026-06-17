import React from 'react';
import { User } from '../../types';

interface StudentListItemProps {
  student: User;
  onClick: (student: User) => void;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({ student, onClick }) => {
  return (
    <div 
      onClick={() => onClick(student)} 
      className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-cbjjs-blue hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-cbjjs-blue font-black overflow-hidden shadow-inner shrink-0">
          {student.profileImage ? (
            <img src={student.profileImage} className="w-full h-full object-cover" alt={student.fullName} />
          ) : (
            student.fullName.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold dark:text-white group-hover:text-cbjjs-blue transition-colors truncate">
              {student.fullName}
            </h4>
            {student.isDependent && (
              <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-indigo-100 shrink-0">
                Filho Atleta
              </span>
            )}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight truncate">
            Faixa {student.athleteData?.belt} • {student.academy?.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {(student.academy?.status || 'PENDING') === 'PENDING' && (
          <span className="bg-yellow-100 text-yellow-700 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border border-yellow-200">
            Novo Vínculo
          </span>
        )}
      </div>
    </div>
  );
};