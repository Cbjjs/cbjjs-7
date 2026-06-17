import React from 'react';
import { User, Role, Belt, PaymentStatus } from '../types';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProfileProps {
  user: User | null;
}

export const SidebarProfile: React.FC<SidebarProfileProps> = ({ user }) => {
  const { isProfileLoading } = useAuth();

  // Se o usuário ainda não carregou do DB, mostra um estado de carregamento elegante
  if (!user || isProfileLoading) {
    return (
        <div className="w-full flex flex-col items-center pt-6 pb-6 px-4 mb-2 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-400">
                <Loader2 size={24} className="animate-spin opacity-20" />
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/50 rounded-full"></div>
            </div>
        </div>
    );
  }

  const getRoleLabel = () => {
    if (!user.isBoardingComplete) return 'Seja bem-vindo';
    if (user.role === Role.ADMIN) return 'Administrador';

    const isHighBelt = [Belt.PURPLE, Belt.BROWN, Belt.BLACK].includes(user.athleteData?.belt as Belt);
    const isAcademyOwner = user.academy?.isOwner;
    const isProfessorRole = user.role === Role.PROFESSOR;

    if (isProfessorRole || isAcademyOwner || isHighBelt) {
        return `Professor ${user.athleteData?.belt ? `- Faixa ${user.athleteData.belt}` : ''}`;
    }

    return `Atleta ${user.athleteData?.belt ? `- Faixa ${user.athleteData.belt}` : ''}`;
  };

  const hasPaid = user.paymentStatus === PaymentStatus.PAID;
  const formattedId = (hasPaid && user.federationId) 
    ? String(user.federationId).padStart(6, '0') 
    : null;

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-6 px-4 mb-2">
      <div className="relative group cursor-pointer">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-cbjjs-blue to-cbjjs-green rounded-full opacity-70 group-hover:opacity-100 transition duration-500 blur-sm"></div>
          <div className="relative w-20 h-20 rounded-full p-0.5 bg-white dark:bg-slate-900">
            {user.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full border-2 border-white dark:border-slate-800" />
            ) : (
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-white dark:border-slate-800">
                <Shield size={32} />
            </div>
            )}
          </div>
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
             <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight px-2">
            {user.fullName}
        </h3>
        
        <div className="mt-1 flex flex-col items-center gap-1">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                ${!user.isBoardingComplete 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}
            `}>
                {getRoleLabel()}
            </span>

            {formattedId ? (
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest mt-1">ID: {formattedId}</span>
            ) : user.isBoardingComplete ? (
                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded mt-1">Aguardando Pagamento</span>
            ) : (
                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1">Cadastro Pendente</span>
            )}
        </div>
      </div>
    </div>
  );
};