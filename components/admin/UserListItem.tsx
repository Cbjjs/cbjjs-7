import React from 'react';
import { User, Role } from '../../types';
import { User as UserIcon, Shield, GraduationCap, UserCircle } from 'lucide-react';

interface UserListItemProps {
  user: User;
  onClick: (user: User) => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onClick }) => {
  const getRoleBadge = (role: Role) => {
    switch(role) {
      case Role.ADMIN: return <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1"><Shield size={8}/> ADMIN</span>;
      case Role.PROFESSOR: return <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1"><GraduationCap size={8}/> PROF</span>;
      default: return <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1"><UserCircle size={8}/> ATLETA</span>;
    }
  };

  return (
    <div 
      onClick={() => onClick(user)}
      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-cbjjs-blue hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center border dark:border-slate-600 shadow-inner">
        {user.profileImage ? (
          <img src={user.profileImage} className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="text-gray-300" size={20} />
        )}
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-bold text-sm dark:text-white truncate group-hover:text-cbjjs-blue transition-colors">
            {user.fullName}
          </h4>
          {getRoleBadge(user.role)}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        <div className="flex items-center gap-2 mt-1">
           <span className={`text-[8px] font-black uppercase tracking-tighter ${user.isBoardingComplete ? 'text-green-500' : 'text-orange-400'}`}>
             {user.isBoardingComplete ? 'Cadastro Completo' : 'Cadastro Inicial'}
           </span>
           {user.academy && (
             <span className="text-[8px] font-bold text-gray-400 truncate">• {user.academy.name}</span>
           )}
        </div>
      </div>
    </div>
  );
};