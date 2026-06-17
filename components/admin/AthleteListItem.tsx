import React from 'react';
import { Camera, Baby } from 'lucide-react';
import { User, DocumentStatus, PaymentStatus, RegistrationStatus } from '../../types';

interface AthleteListItemProps {
  athlete: User;
  onClick: (athlete: User) => void;
  getStatusLabel: (status: DocumentStatus) => string;
  getStatusColor: (status: DocumentStatus) => string;
  showAcademyName?: boolean; // Nova prop para trocar Faixa por Academia
}

export const AthleteListItem: React.FC<AthleteListItemProps> = ({ 
  athlete, onClick, getStatusLabel, getStatusColor, showAcademyName = false
}) => {
  return (
    <div 
      onClick={() => onClick(athlete)} 
      className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between group cursor-pointer hover:border-cbjjs-blue transition-all"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
          {athlete.profileImage ? (
            <img src={athlete.profileImage} className="w-full h-full object-cover" alt={athlete.fullName} />
          ) : (
            <Camera className="text-gray-300" size={24}/>
          )}
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold dark:text-white truncate leading-tight">{athlete.fullName}</h4>
            {athlete.isDependent && (
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-indigo-100 uppercase">
                <Baby size={10}/> Filho
              </span>
            )}
          </div>
          
          <p className="text-[10px] font-black text-cbjjs-blue uppercase tracking-widest mb-1 truncate">
            {showAcademyName ? (
              `UNIDADE: ${athlete.academy?.name || '---'}`
            ) : (
              `FAIXA ${athlete.athleteData?.belt || 'BRANCA'}`
            )}
          </p>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-3">
              <span className={`text-[9px] font-black uppercase ${getStatusColor(athlete.documents.identity.status)}`}>
                ID: [{getStatusLabel(athlete.documents.identity.status)}]
              </span>
              <span className={`text-[9px] font-black uppercase ${getStatusColor(athlete.documents.profile?.status || DocumentStatus.MISSING)}`}>
                FOTO: [{getStatusLabel(athlete.documents.profile?.status || DocumentStatus.MISSING)}]
              </span>
            </div>
            <div className="flex gap-3">
              <span className={`text-[9px] font-black uppercase ${getStatusColor(athlete.documents.medical?.status || DocumentStatus.MISSING)}`}>
                MED: [{getStatusLabel(athlete.documents.medical?.status || DocumentStatus.MISSING)}]
              </span>
              <span className={`text-[9px] font-black uppercase ${getStatusColor(athlete.documents.belt?.status || DocumentStatus.MISSING)}`}>
                CERT: [{getStatusLabel(athlete.documents.belt?.status || DocumentStatus.MISSING)}]
              </span>
            </div>
          </div>
          
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${athlete.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              PAGAMENTO: {athlete.paymentStatus === PaymentStatus.PAID ? 'OK' : 'PEND'}
            </span>
            {athlete.isDependent && <span className="text-[8px] font-bold text-gray-400">Resp: {athlete.parentName}</span>}
            {athlete.academy?.status === RegistrationStatus.PENDING && (
              <span className="text-[8px] font-black text-yellow-600 bg-yellow-50 px-1 rounded border border-yellow-100 uppercase">
                Aguard. Academia
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};