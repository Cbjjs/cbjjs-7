import React, { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { useProfessorStudents } from '../hooks/useProfessorStudents';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { StudentListItem } from '../components/students/StudentListItem';
import { StudentDetailsModal } from '../components/students/StudentDetailsModal';
import { User } from '../types';

export const MyStudents: React.FC = () => {
  const { 
    students, isLoading, isFetching, isError, filter, setFilter, 
    processingId, handleApproveStudent, refetch 
  } = useProfessorStudents();
  
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  return (
    <div className="animate-fadeIn">
        {/* Header e Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Meus Alunos</h1>
              <p className="text-gray-500 font-medium">Gestão de atletas vinculados à sua academia.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 flex gap-2 shadow-sm">
                <button 
                  onClick={() => setFilter('PENDING')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filter === 'PENDING' ? 'bg-cbjjs-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Pendentes
                </button>
                <button 
                  onClick={() => setFilter('APPROVED')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filter === 'APPROVED' ? 'bg-cbjjs-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Aprovados
                </button>
                <button onClick={() => refetch()} className="p-2.5 text-cbjjs-blue hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        {/* Lista de Alunos */}
        {isLoading ? (
          <AdminListSkeleton />
        ) : isError ? (
          <AdminErrorState onRetry={() => refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {students.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                <Users size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum aluno encontrado nesta categoria.</p>
              </div>
            ) : (
              students.map(student => (
                <StudentListItem 
                  key={student.id} 
                  student={student} 
                  onClick={setSelectedStudent} 
                />
              ))
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        <StudentDetailsModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
          onApprove={handleApproveStudent}
          processingId={processingId}
        />
    </div>
  );
};