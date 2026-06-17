import React, { useState } from 'react';
import { X, Mail, User as UserIcon, KeyRound, Loader2, Save, Fingerprint, Calendar, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import { User } from '../../types';
import { modalLabelClass, modalInputClass } from '../AdminShared';
import { formatDateBR } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface UserDetailsModalProps {
  user: User | null;
  onClose: () => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  onUpdatePassword: () => void;
  onDeleteUser: (userId: string) => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user, onClose, newPassword, setNewPassword, isSubmitting, isDeleting, onUpdatePassword, onDeleteUser
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    addToast('success', 'E-mail copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10">
          <X size={24}/>
        </button>

        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-slate-700 overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
              {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><UserIcon size={40}/></div>}
            </div>
            <div>
              <h3 className="text-2xl font-black dark:text-white tracking-tight">{user.fullName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                 <span className="text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-cbjjs-blue px-2 py-0.5 rounded-full">{user.role}</span>
                 {user.federationId && <span className="text-[10px] font-mono font-bold text-gray-400">ID: {String(user.federationId).padStart(6, '0')}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y dark:border-slate-700 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-xl text-gray-400"><Mail size={18}/></div>
              <div className="min-w-0 flex-1">
                <span className={modalLabelClass}>E-mail</span>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold dark:text-white truncate">{user.email}</p>
                    <button 
                        onClick={handleCopyEmail}
                        className={`p-1.5 rounded-lg transition-all ${copied ? 'bg-green-50 text-green-600' : 'hover:bg-gray-100 text-gray-400'}`}
                        title="Copiar e-mail"
                    >
                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-xl text-gray-400"><Fingerprint size={18}/></div>
              <div>
                <span className={modalLabelClass}>CPF</span>
                <p className="text-sm font-bold dark:text-white">{user.cpf || 'Não informado'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-xl text-gray-400"><Calendar size={18}/></div>
              <div>
                <span className={modalLabelClass}>Nascimento</span>
                <p className="text-sm font-bold dark:text-white">{formatDateBR(user.dob)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-xl text-gray-400"><KeyRound size={18}/></div>
              <div>
                <span className={modalLabelClass}>Criado em</span>
                <p className="text-sm font-bold dark:text-white">{formatDateBR(user.registrationDate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border dark:border-slate-700 border-dashed mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-cbjjs-blue">
                <KeyRound size={20}/>
              </div>
              <h4 className="text-xs font-black uppercase dark:text-white tracking-widest">Resetar Senha de Acesso</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className={modalLabelClass}>Nova Senha Temporária</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    className={`${modalInputClass} flex-1`}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button 
                    onClick={onUpdatePassword}
                    disabled={isSubmitting || newPassword.length < 6}
                    className="bg-cbjjs-green text-white px-6 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-500/10"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    Salvar
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">
                * O usuário deve ser informado manualmente da nova senha para o primeiro acesso.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
            >
                Fechar Detalhes
            </button>

            {!showDeleteConfirm ? (
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                    <Trash2 size={14}/> Excluir Conta permanentemente
                </button>
            ) : (
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl animate-fadeIn">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertTriangle size={24}/>
                        <h4 className="font-black uppercase text-xs tracking-widest">Confirma a exclusão?</h4>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-4 font-medium leading-relaxed">
                        Esta ação é irreversível. Todos os dados do atleta, histórico e documentos serão removidos do sistema.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1 py-3 bg-white dark:bg-slate-800 text-gray-500 font-black uppercase text-[10px] rounded-xl border border-red-100"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => onDeleteUser(user.id)}
                            disabled={isDeleting}
                            className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                            Sim, Excluir
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};