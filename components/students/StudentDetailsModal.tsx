import React from 'react';
import { X, Users, Baby, CheckCircle, Loader2 } from 'lucide-react';
import { User, PaymentStatus } from '../../types';

interface StudentDetailsModalProps {
  student: User | null;
  onClose: () => void;
  onApprove: (student: User) => void;
  processingId: string | null;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ 
  student, onClose, onApprove, processingId 
}) => {
  if (!student) return null;

  const labelClass = "text-[10px] font-black text-gray-400 uppercase block mb-1 tracking-widest";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col relative border dark:border-slate-700 p-8 md:p-12 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10">
          <X size={28}/>
        </button>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 text-center sm:text-left">
          <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-cbjjs-blue font-black text-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl shrink-0">
            {student.profileImage ? (
              <img src={student.profileImage} className="w-full h-full object-cover" alt={student.fullName} />
            ) : (
              <Users size={40} className="text-gray-300"/>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-black dark:text-white leading-tight tracking-tight">{student.fullName}</h3>
            <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border dark:border-slate-600">
                ID: {student.federationId ? String(student.federationId).padStart(6, '0') : 'Pendente'}
              </span>
              {student.isDependent && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 flex items-center gap-1">
                  <Baby size={12}/> Filho Atleta
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y dark:border-slate-700 mb-8">
          {student.isDependent && (
            <div className="col-span-1 sm:col-span-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
              <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1 tracking-widest">Responsável Legal</span>
              <p className="font-black text-gray-900 dark:text-white text-lg">{student.parentName || 'Responsável Cadastrado'}</p>
            </div>
          )}
          <div>
            <span className={labelClass}>CPF / Doc Atleta</span>
            <p className="font-bold dark:text-white text-sm">{student.cpf || 'Não informado'}</p>
          </div>
          <div>
            <span className={labelClass}>Graduação Atual</span>
            <span className="px-2.5 py-1 bg-cbjjs-blue text-white rounded-lg text-[10px] font-black uppercase inline-block">Faixa {student.athleteData?.belt}</span>
          </div>
          <div>
            <span className={labelClass}>Data de Nascimento</span>
            <p className="font-bold dark:text-white text-sm">{new Date(student.dob).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <span className={labelClass}>Situação Financeira</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${student.paymentStatus === PaymentStatus.PAID ? 'text-green-600' : 'text-orange-500'}`}>
              {student.paymentStatus === PaymentStatus.PAID ? 'PAGO (2026)' : 'PENDENTE'}
            </span>
          </div>
        </div>

        {(student.academy?.status || 'PENDING') === 'PENDING' ? (
          <button 
            onClick={() => onApprove(student)} 
            disabled={!!processingId} 
            className="w-full bg-cbjjs-green text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {processingId === student.id ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle size={24}/>} 
            Aprovar Vínculo com Academia
          </button>
        ) : (
          <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800/30 flex items-center justify-center gap-3">
            <CheckCircle className="text-green-600" size={24}/>
            <span className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Atleta Aprovado na sua Unidade</span>
          </div>
        )}
      </div>
    </div>
  );
};