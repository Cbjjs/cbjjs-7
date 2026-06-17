import React from 'react';
import { FileText, Camera } from 'lucide-react';
import { User, DocumentStatus } from '../../types';

interface DocumentsSectionProps {
  user: User;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ user }) => {
  const labelClass = "block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-md h-auto";

  const getDocStatusLabel = (docStatus: DocumentStatus, url?: string) => {
    if (docStatus === DocumentStatus.APPROVED) return 'Aprovado';
    if (docStatus === DocumentStatus.REJECTED) return 'Recusado';
    if (url) return 'Em Análise';
    return 'Pendente';
  };

  const getDocStatusColor = (docStatus: DocumentStatus, url?: string) => {
    if (docStatus === DocumentStatus.APPROVED) return 'text-green-600';
    if (docStatus === DocumentStatus.REJECTED) return 'text-red-600';
    if (url) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className={cardClass}>
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="text-cbjjs-blue" size={18} /> Documentos
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Foto para Carteirinha</span>
          <span className={`font-black uppercase text-[10px] ${getDocStatusColor(user.documents.profile?.status || DocumentStatus.MISSING, user.profileImage)}`}>
            {getDocStatusLabel(user.documents.profile?.status || DocumentStatus.MISSING, user.profileImage)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Identidade (RG/CNH)</span>
          <span className={`font-black uppercase text-[10px] ${getDocStatusColor(user.documents.identity.status, user.documents.identity.url)}`}>
            {getDocStatusLabel(user.documents.identity.status, user.documents.identity.url)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Atestado Médico</span>
          <span className={`font-black uppercase text-[10px] ${getDocStatusColor(user.documents.medical?.status || DocumentStatus.MISSING, user.documents.medical?.url)}`}>
            {getDocStatusLabel(user.documents.medical?.status || DocumentStatus.MISSING, user.documents.medical?.url)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Certificado de Faixa</span>
          <span className={`font-black uppercase text-[10px] ${getDocStatusColor(user.documents.belt?.status || DocumentStatus.MISSING, user.documents.belt?.url)}`}>
            {getDocStatusLabel(user.documents.belt?.status || DocumentStatus.MISSING, user.documents.belt?.url)}
          </span>
        </div>

        {(user.documents.identity.status === DocumentStatus.REJECTED || 
          user.documents.profile?.status === DocumentStatus.REJECTED || 
          user.documents.medical?.status === DocumentStatus.REJECTED || 
          user.documents.belt?.status === DocumentStatus.REJECTED) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl space-y-4">
            {user.documents.profile?.status === DocumentStatus.REJECTED && (
              <div className="text-[11px]">
                <p className="font-black text-red-600 uppercase">Foto Carteirinha recusada:</p>
                <p className="text-red-500 font-medium mt-0.5">{user.documents.profile.rejectionReason || 'Motivo não especificado'}</p>
              </div>
            )}
            {user.documents.identity.status === DocumentStatus.REJECTED && (
              <div className="text-[11px]">
                <p className="font-black text-red-600 uppercase">Identidade recusada:</p>
                <p className="text-red-500 font-medium mt-0.5">{user.documents.identity.rejectionReason || 'Motivo não especificado'}</p>
              </div>
            )}
            {user.documents.medical?.status === DocumentStatus.REJECTED && (
              <div className="text-[11px]">
                <p className="font-black text-red-600 uppercase">Atestado Médico recusado:</p>
                <p className="text-red-500 font-medium mt-0.5">{user.documents.medical.rejectionReason || 'Motivo não especificado'}</p>
              </div>
            )}
            {user.documents.belt?.status === DocumentStatus.REJECTED && (
              <div className="text-[11px]">
                <p className="font-black text-red-600 uppercase">Certificado de Faixa recusado:</p>
                <p className="text-red-500 font-medium mt-0.5">{user.documents.belt.rejectionReason || 'Motivo não especificado'}</p>
              </div>
            )}
            <p className="text-[10px] font-black text-red-700 uppercase tracking-tight text-center pt-2 border-t border-red-100 dark:border-red-800/50">
              Clique no botão abaixo e reenvie o documento
            </p>
          </div>
        )}

        <div className="pt-4 border-t dark:border-slate-700">
          <button 
            onClick={() => window.location.href = `/upload-student-docs.html?id=${user.id}`} 
            className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Camera size={14} /> Enviar / Alterar documentos
          </button>
        </div>
      </div>
    </div>
  );
};