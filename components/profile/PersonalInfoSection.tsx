import React from 'react';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { BRAZIL_STATES } from '../../constants';
import { formatDateBR } from '../../utils/formatters';

interface PersonalInfoSectionProps {
  user: User;
  isEditing: boolean;
  editForm: Partial<User>;
  onEditChange: (updates: Partial<User>) => void;
  loadingZip: boolean;
  onZipChange: (zip: string) => void;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  user,
  isEditing,
  editForm,
  onEditChange,
  loadingZip,
  onZipChange
}) => {
  const labelClass = "block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-md h-auto";
  const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-cbjjs-blue focus:border-transparent text-sm shadow-sm";

  return (
    <div className="space-y-6">
      {/* Dados Pessoais */}
      <div className={cardClass}>
        <h3 className="text-lg font-black mb-6 border-b pb-4 dark:text-white">Dados Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <span className={labelClass}>Nome Completo</span>
            {isEditing ? (
              <input 
                className={inputClass} 
                value={editForm.fullName || ''} 
                onChange={e => onEditChange({ fullName: e.target.value })} 
              />
            ) : (
              <p className="font-bold text-gray-800 dark:text-white">{user.fullName}</p>
            )}
          </div>
          <div>
            <span className={labelClass}>Email</span>
            {isEditing ? (
              <input 
                className={inputClass} 
                value={editForm.email || ''} 
                onChange={e => onEditChange({ email: e.target.value })} 
              />
            ) : (
              <p className="font-bold text-gray-800 dark:text-white">{user.email}</p>
            )}
          </div>
          <div className="flex gap-8">
            <div>
              <span className={labelClass}>Data Nascimento</span>
              {isEditing ? (
                <input 
                  type="date" 
                  className={inputClass} 
                  value={editForm.dob || ''} 
                  onChange={e => onEditChange({ dob: e.target.value })} 
                />
              ) : (
                <p className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar size={14}/> {formatDateBR(user.dob)}
                </p>
              )}
            </div>
            <div>
              <span className={labelClass}>CPF</span>
              {isEditing ? (
                <input 
                  className={inputClass} 
                  value={editForm.cpf || ''} 
                  onChange={e => onEditChange({ cpf: e.target.value })} 
                />
              ) : (
                <p className="font-bold text-gray-800 dark:text-white">{user.cpf || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className={cardClass}>
        <h3 className="text-lg font-black mb-6 border-b pb-4 dark:text-white">Endereço</h3>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-2xl">
            <MapPin size={24} className="text-cbjjs-blue dark:text-blue-400" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>CEP</label>
                  <div className="relative">
                    <input 
                      className={inputClass} 
                      value={editForm.address?.zip || ''} 
                      onChange={e => onZipChange(e.target.value)} 
                    />
                    {loadingZip && <Loader2 className="absolute right-3 top-3.5 animate-spin text-cbjjs-blue" size={18}/>}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Rua</label>
                  <input 
                    className={inputClass} 
                    value={editForm.address?.street || ''} 
                    onChange={e => onEditChange({ address: { ...editForm.address!, street: e.target.value } })} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input className={inputClass} value={editForm.address?.city || ''} readOnly />
                  </div>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <select 
                      className={inputClass} 
                      value={editForm.address?.state || ''} 
                      onChange={e => onEditChange({ address: { ...editForm.address!, state: e.target.value } })}
                    >
                      {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.sigla}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Número</label>
                    <input 
                      className={inputClass} 
                      value={editForm.address?.number || ''} 
                      onChange={e => onEditChange({ address: { ...editForm.address!, number: e.target.value } })} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Complemento</label>
                    <input 
                      className={inputClass} 
                      value={editForm.address?.complement || ''} 
                      onChange={e => onEditChange({ address: { ...editForm.address!, complement: e.target.value } })} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="font-bold text-gray-800 dark:text-white text-lg">
                  {user.address?.street}, {user.address?.number} {user.address?.complement ? `- ${user.address.complement}` : ''}
                </p>
                <p className="text-gray-500 font-medium">
                  {user.address?.city} - {user.address?.state} (CEP: {user.address?.zip})
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};