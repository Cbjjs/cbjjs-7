import React, { useState } from 'react';
import { X, Eye, FileText, ExternalLink, Download, AlertCircle, Building, Shield, Loader2, KeyRound, Save, Trash2, AlertTriangle } from 'lucide-react';
import { User, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { modalLabelClass, modalInputClass } from './AdminShared';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { useQueryClient } from '@tanstack/react-query';

interface AdminProfessorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    professorId: string | null;
}

export const AdminProfessorDetailsModal: React.FC<AdminProfessorDetailsModalProps> = ({
    isOpen,
    onClose,
    professorId
}) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
    
    // Estados para troca de senha
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Estados para exclusão
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Busca os dados completos do professor quando o ID é fornecido
    const { data: profData, isLoading } = useSupabaseQuery<User>(
        ['admin-professor-detail', professorId],
        async (signal) => {
            if (!professorId) return { data: null, error: null };

            // 1. Busca perfil
            const { data: p, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', professorId)
                .single()
                .abortSignal(signal!);

            if (pError) return { data: null, error: pError };

            // 2. Busca academias
            const { data: academiesData } = await supabase
                .from('academies')
                .select('id, name, status')
                .eq('owner_id', professorId);

            const owned = (academiesData || []).map(acc => ({
                id: acc.id,
                name: acc.name,
                status: acc.status as RegistrationStatus
            }));

            const mapped: User = {
                id: p.id,
                fullName: p.full_name,
                email: p.email,
                dob: p.dob,
                role: p.role,
                cpf: p.cpf,
                isBoardingComplete: p.is_boarding_complete,
                profileImage: p.profile_image_url,
                federationId: p.federation_id,
                paymentStatus: p.payment_status,
                athleteData: { belt: p.belt },
                documents: {
                    identity: { status: p.doc_identity_status, url: p.doc_identity_url },
                    belt: { status: p.doc_belt_status, url: p.doc_belt_url }
                },
                ownedAcademies: owned
            };

            return { data: mapped, error: null };
        },
        { enabled: !!professorId && isOpen }
    );

    const professor = profData?.data;

    if (!isOpen || !professorId) return null;

    const handleAdminChangePassword = async () => {
        if (newPassword.length < 6) {
            addToast('error', "A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.functions.invoke('admin-change-password', {
                body: { targetUserId: professorId, newPassword }
            });

            if (error) throw error;

            addToast('success', "Senha alterada com sucesso!");
            setShowPasswordChange(false);
            setNewPassword('');
        } catch (err: any) {
            addToast('error', err.message || "Erro ao alterar senha.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteProfessor = async () => {
        setIsDeleting(true);
        try {
            await userService.deleteUser(professorId);
            addToast('success', "Professor excluído permanentemente.");
            queryClient.invalidateQueries({ queryKey: ['admin-professors'] });
            onClose();
        } catch (err: any) {
            addToast('error', "Erro ao excluir professor.");
        } finally {
            setIsDeleting(false);
        }
    };

    const isImage = (url?: string) => {
        if (!url) return false;
        return url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    };

    const handleDownload = async (url: string, filename: string) => {
        setDownloadingUrl(url);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(url, '_blank');
        } finally {
            setDownloadingUrl(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700 p-8 md:p-12 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors z-20">
                    <X size={28}/>
                </button>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={48} className="animate-spin text-cbjjs-blue" />
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Carregando Professor...</p>
                    </div>
                ) : professor ? (
                    <>
                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner overflow-hidden">
                                {professor.profileImage ? <img src={professor.profileImage} className="w-full h-full object-cover"/> : professor.fullName.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black dark:text-white tracking-tight">{professor.fullName}</h3>
                                <p className="text-gray-500 font-medium">{professor.email}</p>
                            </div>
                        </div>

                        {/* Seção de Segurança do Professor */}
                        <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-700 border-dashed">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-cbjjs-blue">
                                        <KeyRound size={20}/>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase dark:text-white tracking-widest">Segurança da Conta</h4>
                                        <p className="text-[10px] text-gray-500 font-medium">Troca de senha pelo Admin</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showPasswordChange ? 'bg-gray-200 text-gray-600' : 'bg-cbjjs-blue text-white shadow-lg shadow-blue-500/20'}`}
                                >
                                    {showPasswordChange ? 'Cancelar' : 'Alterar Senha'}
                                </button>
                            </div>

                            {showPasswordChange && (
                                <div className="mt-6 space-y-4 animate-fadeIn">
                                    <div>
                                        <label className={modalLabelClass}>Defina uma Nova Senha para o Professor</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text"
                                                className={`${modalInputClass} flex-1`}
                                                placeholder="Mínimo 6 caracteres"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                            />
                                            <button 
                                                onClick={handleAdminChangePassword}
                                                disabled={isChangingPassword || newPassword.length < 6}
                                                className="bg-cbjjs-green text-white px-6 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all"
                                            >
                                                {isChangingPassword ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y dark:border-slate-700">
                            <div><span className={modalLabelClass}>CPF</span><p className="font-bold dark:text-white text-sm">{professor.cpf || '-'}</p></div>
                            <div><span className={modalLabelClass}>Graduação</span><span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded uppercase">Faixa {professor.athleteData?.belt}</span></div>
                            
                            <div className="col-span-1 md:col-span-2">
                                <span className={modalLabelClass}>Unidades Registradas</span>
                                <div className="space-y-2 mt-2">
                                    {professor.ownedAcademies && professor.ownedAcademies.length > 0 ? (
                                        professor.ownedAcademies.map(acc => (
                                            <div key={acc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <Building size={18} className="text-cbjjs-blue"/>
                                                    <span className="text-sm font-bold dark:text-white">{acc.name}</span>
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${acc.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {acc.status === 'APPROVED' ? 'Aprovada' : 'Pendente'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Nenhuma academia encontrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 mt-10">
                            <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Documentação Digital (Professor)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { key: 'belt', label: 'Diploma Faixa Preta', url: professor.documents.belt?.url },
                                    { key: 'identity', label: 'Identidade do Professor', url: professor.documents.identity.url }
                                ].map(docInfo => (
                                    <div key={docInfo.key} className="p-6 bg-gray-50 dark:bg-slate-900 rounded-[2rem] border dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tight">{docInfo.label}</span>
                                        </div>
                                        
                                        <div className="relative group rounded-2xl overflow-hidden border dark:border-slate-700 bg-white dark:bg-slate-800 aspect-video flex items-center justify-center mb-4">
                                            {docInfo.url ? (
                                                <>
                                                    {isImage(docInfo.url) ? (
                                                        <img src={docInfo.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileText size={48} className="text-gray-300" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <a href={docInfo.url} target="_blank" className="p-3 bg-white rounded-full text-cbjjs-blue shadow-lg hover:scale-110 transition-transform" title="Visualizar">
                                                            <ExternalLink size={24}/>
                                                        </a>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center px-4">
                                                    <AlertCircle size={24} className="text-orange-200 mx-auto mb-1"/>
                                                    <span className="text-[9px] text-gray-400 font-black uppercase">Não Enviado</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {docInfo.url && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <a 
                                                    href={docInfo.url} 
                                                    target="_blank" 
                                                    className="bg-cbjjs-blue text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/10 hover:bg-blue-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Eye size={14}/> Ver
                                                </a>
                                                <button 
                                                    onClick={() => handleDownload(docInfo.url!, `${docInfo.key}_${professor.fullName.replace(/\s+/g, '_')}`)}
                                                    disabled={downloadingUrl === docInfo.url}
                                                    className="bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {downloadingUrl === docInfo.url ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                                    Baixar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 mt-12">
                            <button 
                                onClick={onClose} 
                                className="w-full py-5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                Fechar Detalhes
                            </button>

                            {!showDeleteConfirm ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14}/> Excluir Conta do Professor
                                </button>
                            ) : (
                                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl animate-fadeIn">
                                    <div className="flex items-center gap-3 mb-4 text-red-600">
                                        <AlertTriangle size={24}/>
                                        <h4 className="font-black uppercase text-xs tracking-widest">Confirma a exclusão?</h4>
                                    </div>
                                    <p className="text-xs text-red-700 dark:text-red-400 mb-4 font-medium leading-relaxed">
                                        Ao excluir este professor, todas as suas academias vinculadas e o acesso do usuário serão removidos permanentemente.
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
                                            onClick={handleDeleteProfessor}
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
                    </>
                ) : (
                    <div className="py-20 text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="font-bold dark:text-white">Não foi possível encontrar este professor.</p>
                        <button onClick={onClose} className="mt-6 text-cbjjs-blue font-bold uppercase text-xs tracking-widest">Voltar</button>
                    </div>
                )}
            </div>
        </div>
    );
};