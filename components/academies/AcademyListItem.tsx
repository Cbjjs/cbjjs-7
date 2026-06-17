import React from 'react';
import { MapPin, AlertCircle, FileCheck, Upload, Clock, Package, CheckCircle } from 'lucide-react';
import { Academy, DocumentStatus, AcademyCertificate } from '../../types';

interface AcademyListItemProps {
  academy: Academy;
  onClick: (academy: Academy) => void;
  onUploadClick: (id: string) => void;
  onRequestCertificate: (academy: Academy) => void;
  getDocStatusLabel: (status: DocumentStatus) => string;
  getDocStatusColor: (status: DocumentStatus) => string;
  certificate?: AcademyCertificate; // Prop opcional para o status do certificado
}

export const AcademyListItem: React.FC<AcademyListItemProps> = ({
  academy, onClick, onUploadClick, onRequestCertificate, getDocStatusLabel, getDocStatusColor, certificate
}) => {

  const isRejected = academy.blackBeltCertificate?.status === DocumentStatus.REJECTED || 
                     academy.identityDocument?.status === DocumentStatus.REJECTED;
  
  const isPendingDocs = !academy.identityDocument?.url || 
                        !academy.blackBeltCertificate?.url || 
                        isRejected;

  // Define o botão de certificado com base no status de pagamento e entrega
  const renderCertificateButton = () => {
    if (!certificate) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onRequestCertificate(academy); }}
          className="flex-1 h-12 bg-cbjjs-green text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest"
        >
          <FileCheck size={16} /> Certificado
        </button>
      );
    }

    if (certificate.statusPayment === 'PAID') {
      if (certificate.statusDelivery === 'DELIVERED') {
        return (
          <button
            disabled
            className="flex-1 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-2xl shadow-sm flex items-center justify-center gap-2 border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
          >
            <CheckCircle size={16} /> Entregue
          </button>
        );
      }
      if (certificate.statusDelivery === 'PRODUCING') {
        return (
          <button
            disabled
            className="flex-1 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-2xl shadow-sm flex items-center justify-center gap-2 border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest cursor-not-allowed animate-pulse"
          >
            <Package size={16} /> Em Produção
          </button>
        );
      }
      return (
        <button
          disabled
          className="flex-1 h-12 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-2xl shadow-sm flex items-center justify-center gap-2 border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
        >
          <CheckCircle size={16} /> Certificado Pago
        </button>
      );
    }

    // Pendente de pagamento
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onRequestCertificate(academy); }}
        className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest"
      >
        <Clock size={16} /> Pagar Certificado
      </button>
    );
  };
  
  return (
    <div className="relative">
      <div 
        onClick={() => onClick(academy)} 
        className={`bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border transition-all group relative overflow-visible cursor-pointer
            ${isRejected ? 'border-red-200 bg-red-50/10' : isPendingDocs ? 'animate-pulse-yellow-border border-yellow-200' : 'border-gray-100 dark:border-slate-800 hover:border-cbjjs-blue hover:shadow-xl'}
        `}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black dark:text-white group-hover:text-cbjjs-blue transition-colors leading-none mb-1">{academy.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-bold uppercase tracking-wider">
              <MapPin size={16} className="text-cbjjs-blue" /> {academy.address?.city} - {academy.address?.state}
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${academy.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {academy.status === 'PENDING' ? 'Em Análise' : 'Aprovada'}
          </span>
        </div>
        
        {isPendingDocs && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-2.5 shadow-sm ${isRejected ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
            {isRejected ? <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />}
            <p className={`text-[10px] font-black uppercase leading-relaxed tracking-tight ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
              {isRejected ? 'Documento Recusado: Verifique os detalhes e reenvie.' : 'Envio da documentação necessário. Clique no +.'}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">Identidade / CNH</span>
            <span className={getDocStatusColor(academy.identityDocument?.status || DocumentStatus.MISSING)}>
              {getDocStatusLabel(academy.identityDocument?.status || DocumentStatus.MISSING)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">Certificado Faixa Preta</span>
            <span className={getDocStatusColor(academy.blackBeltCertificate?.status || DocumentStatus.MISSING)}>
              {getDocStatusLabel(academy.blackBeltCertificate?.status || DocumentStatus.MISSING)}
            </span>
          </div>
        </div>

        <div className="h-4"></div>
        
        <div className="absolute bottom-[-24px] left-0 right-0 px-8 flex gap-3 justify-center z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onUploadClick(academy.id); }}
            className={`flex-1 h-12 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border-4 border-white dark:border-slate-800 text-[10px] font-black uppercase tracking-widest ${isRejected ? 'bg-red-600' : 'bg-cbjjs-blue'}`}
          >
            <Upload size={16} /> Documentos
          </button>
          
          {renderCertificateButton()}
        </div>
      </div>
    </div>
  );
};