import React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Globe, User as UserIcon, Mail, Calendar, School } from 'lucide-react';
import { User } from '../../types';
import { modalLabelClass } from '../AdminShared';
import { formatDateBR } from '../../utils/formatters';

interface AthleteFullDataAccordionProps {
    user: User;
}

export const AthleteFullDataAccordion: React.FC<AthleteFullDataAccordionProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Lógica de busca resiliente: tenta o campo dob, se não existir tenta no athleteData (legado)
    const rawDob = user.dob || (user as any).athleteData?.dob || (user as any).birth_date;
    const displayDob = rawDob ? formatDateBR(rawDob) : 'Não informado';

    return (
        <div className="mt-4 border-t dark:border-slate-700 pt-6">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <UserIcon size={18} className="text-cbjjs-blue" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                        Ver ficha cadastral completa
                    </span>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400 group-hover:translate-y-0.5 transition-transform" />}
            </button>

            {isOpen && (
                <div className="mt-4 p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-gray-100 dark:border-slate-700 space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className={modalLabelClass}>Unidade Vinculada</span>
                            <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                <School size={14} className="text-cbjjs-blue"/> {user.academy?.name || 'Não informada'}
                            </p>
                        </div>
                        <div>
                            <span className={modalLabelClass}>Data de Nascimento</span>
                            <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400"/> {displayDob}
                            </p>
                        </div>
                        <div>
                            <span className={modalLabelClass}>Nacionalidade</span>
                            <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                <Globe size={14} className="text-gray-400"/> {user.nationality || 'Brasil'}
                            </p>
                        </div>
                        <div>
                            <span className={modalLabelClass}>Gênero</span>
                            <p className="font-bold text-sm dark:text-white">{user.gender || 'Não informado'}</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t dark:border-slate-700">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className={modalLabelClass}>Nome Completo</span>
                                <p className="font-bold text-sm dark:text-white">{user.fullName}</p>
                            </div>
                            <div>
                                <span className={modalLabelClass}>E-mail de Cadastro</span>
                                <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400"/> {user.email || 'Acesso via Responsável'}
                                </p>
                            </div>
                         </div>
                    </div>

                    <div className="pt-6 border-t dark:border-slate-700">
                        <span className={modalLabelClass}>Endereço Residencial</span>
                        <div className="flex items-start gap-3 mt-2">
                            <div className="p-2 bg-blue-50 dark:bg-slate-700 rounded-lg">
                                <MapPin size={18} className="text-cbjjs-blue" />
                            </div>
                            <div>
                                <p className="font-bold text-sm dark:text-white">
                                    {user.address?.street}, {user.address?.number}
                                    {user.address?.complement && ` - ${user.address.complement}`}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    {user.address?.city} - {user.address?.state} | CEP: {user.address?.zip}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};