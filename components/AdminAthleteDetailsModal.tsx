"use client";

import React, { useState } from 'react';
import { X, FileText, ExternalLink, AlertTriangle, Loader2, CheckCircle, Edit, Camera, CreditCard, Award, Baby, KeyRound, Save, Download, Trash2 } from 'lucide-react';
import { User, DocumentStatus, PaymentStatus } from '../types';
import { modalLabelClass, modalInputClass } from './AdminShared';
import { AthleteFullDataAccordion } from './admin/AthleteFullDataAccordion';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';

interface AdminAthleteDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onApproveDoc: (userId: string, type: string) => Promise<void>;
    onRejectDoc: (userId: string, type: string) => void;
    onMarkAsPaid: (userId: string) => Promise<void>;
    onUpdateFederationId: (userId: string, newId: string) => Promise<void>;
    onApproveFederation: (userId: string) => Promise<void>;
    processingId: string | null;
}

export const AdminAthleteDetailsModal: React.FC<AdminAthleteDetailsModalProps> = ({
    isOpen, onClose, user, onApproveDoc, onRejectDoc, onMarkAsPaid, onUpdateFederationId, onApproveFederation, processingId
}) => {
    const { addToast } = useToast();
    const [isEditingId, setIsEditingId] = useState(false);
    const [tempId, setTempId] = useState('');
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
    
    // Estados para troca de senha
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Estados para exclusão
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !user) return null;

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

    const handleAdminChangePassword = async () => {
        if (newPassword.length < 6) {
            addToast('error', "A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.functions.invoke('admin-change-password', {
                body: { targetUserId: user.id, newPassword }
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

    const handleDeleteAthlete = async () => {
        setIsDeleting(true);
        try {
            await userService.deleteUser(user.id);
            addToast('success', "Atleta excluído permanentemente.");
            onClose();
            // O refetch ocorrerá na página pai devido ao fechamento e fluxo de navegação/query invalidation se necessário
            window.location.reload(); // Recarrega para limpar estado e listas globais
        } catch (err: any) {
            addToast('error', "Erro ao excluir atleta.");
        } finally {
            setIsDeleting(false);
        }
    };

    const allDocsApproved = 
        user.documents.identity.status === DocumentStatus.APPROVED &&
        (user.documents.profile?.status === DocumentStatus.APPROVED || !user.documents.profile) &&
        (user.documents.medical?.status === DocumentStatus.APPROVED || !user.documents.medical) &&
        (user.documents.belt?.status === DocumentStatus.APPROVED || !user.documents.belt);

    const isFullyApproved = user.isFederationApproved || (allDocsApproved && user.paymentStatus === PaymentStatus.PAID);

    const getStatusLabel = (status: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.MISSING: return 'Pendente';
            case DocumentStatus.PENDING: return 'Enviado';
            case DocumentStatus.APPROVED: return 'Aprovado';
            case DocumentStatus.REJECTED: return 'Recusado';
            default: return 'Pendente';
        }
    };

    const getStatusColor = (status: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.MISSING: return 'text-orange-500';
            case DocumentStatus.PENDING: return 'text-blue-500';
            case DocumentStatus.APPROVED: return 'text-green-500';
            case DocumentStatus.REJECTED: return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[82vh] md:max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative border dark:border-slate-700">
                <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-gray-400 hover:text-gray-900 z-10">
                    <X size={24} className="md:w-7 md:h-7"/>
                </button>
                
                <div className="flex flex-col items-center text-center space-y-4 mb-8">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gray-100 dark:bg-slate-700 overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative">
                        {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-300">{user.fullName.substring(0,2)}</div>}
                        {user.isDependent && <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1 md:p-1.5 rounded-xl border-4 border-white dark:border-slate-800"><Baby size={14}/></div>}
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black dark:text-white leading-tight tracking-tight">{user.fullName}</h3>
                        {user.isDependent ? (
                            <p className="text-indigo-600 font-bold text-xs md:text-sm uppercase tracking-tight flex items-center justify-center gap-1 mt-1"><Award size={14}/> Resp: {user.parentName}</p>
                        ) : (
                            <p className="text-gray-500 font-medium text-xs md:text-sm">{user.email}</p>
                        )}
                    </div>
                </div>

                {!user.isDependent && (
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
                                    <label className={modalLabelClass}>Defina uma Nova Senha Temporária</label>
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
                                    <p className="mt-2 text-[9px] text-amber-600 font-bold uppercase tracking-tighter">* Informe esta senha ao usuário.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 md:gap-6 py-6 md:py-8 border-y dark:border-slate-700 mb-2">
                    <div>
                        <span className={modalLabelClass}>ID Federação</span>
                        <div className="flex gap-2 items-center">
                            {isEditingId ? <input className="w-20 md:w-24 p-1.5 border rounded-lg text-sm dark:bg-slate-700 dark:text-white" value={tempId} onChange={e=>setTempId(e.target.value)}/> : <span className="font-mono text-cbjjs-blue font-black text-sm md:text-base">{user.federationId || '---'}</span>}
                            <button 
                                onClick={() => {
                                    if (isEditingId) {
                                        onUpdateFederationId(user.id, tempId).then(() => setIsEditingId(false));
                                    } else {
                                        setTempId(user.federationId?.toString() || '');
                                        setIsEditingId(true);
                                    }
                                }} 
                                className="p-1 text-gray-400 hover:text-cbjjs-blue transition-colors"
                            >
                                {isEditingId ? (processingId?.includes('update-id') ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>) : <Edit size={14}/>}
                            </button>
                        </div>
                    </div>
                    <div><span className={modalLabelClass}>CPF</span><p className="font-bold dark:text-white text-sm md:text-base">{user.cpf || 'Não inf.'}</p></div>
                    <div><span className={modalLabelClass}>Graduação</span><span className="px-2 py-0.5 bg-cbjjs-blue text-white text-[9px] md:text-[10px] font-black rounded uppercase">FAIXA {user.athleteData?.belt}</span></div>
                    <div>
                        <span className={modalLabelClass}>Financeiro</span>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] md:text-[10px] font-black w-fit ${user.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {user.paymentStatus === PaymentStatus.PAID ? 'PAGO' : 'PENDENTE'}
                                </span>
                            </div>
                            {user.paymentStatus !== PaymentStatus.PAID && (
                                <button 
                                    onClick={() => onMarkAsPaid(user.id)} 
                                    disabled={processingId === `${user.id}-payment`}
                                    className="text-[9px] md:text-[10px] font-black text-cbjjs-blue hover:underline flex items-center gap-1"
                                >
                                    {processingId === `${user.id}-payment` ? <Loader2 className="animate-spin" size={10}/> : <CreditCard size={10}/>}
                                    Liberar Pago
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AthleteFullDataAccordion user={user} />

                <div className="space-y-6 mt-10">
                    <h4 className="font-black text-xs md:text-sm uppercase tracking-widest text-gray-400 mb-4">Documentação do Atleta</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {['identity', 'profile', 'medical', 'belt'].map(type => {
                            const doc = user.documents[type as keyof typeof user.documents];
                            if (!doc) return null;
                            const label = type === 'identity' ? 'Identidade' : type === 'profile' ? 'Foto Carteirinha' : type === 'medical' ? 'Atestado' : 'Certificado de Faixa';
                            const isApproved = doc.status === DocumentStatus.APPROVED;
                            
                            return (
                                <div key={type} className="p-4 md:p-5 bg-gray-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-center mb-3 md:mb-4">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-tight">{label}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase ${getStatusColor(doc.status)} bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700`}>{getStatusLabel(doc.status)}</span>
                                    </div>
                                    
                                    <div className="relative group rounded-xl md:rounded-2xl overflow-hidden border dark:border-slate-700 bg-white dark:bg-slate-800 aspect-video flex items-center justify-center">
                                        {doc.url ? (
                                            <>
                                                {doc.url.match(/\.pdf$/i) ? <FileText size={40} className="text-gray-300" /> : <img src={doc.url} className="w-full h-full object-cover" />}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <a href={doc.url} target="_blank" className="p-2 md:p-3 bg-white rounded-full text-cbjjs-blue shadow-lg hover:scale-110 transition-transform"><ExternalLink size={20}/></a>
                                                </div>
                                            </>
                                        ) : <div className="text-center px-4"><AlertTriangle size={20} className="text-orange-200 mx-auto mb-1"/><span className="text-[8px] md:text-[9px] text-gray-400 font-black uppercase">Não Enviado</span></div>}
                                    </div>
                                    
                                    {doc.url && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <button 
                                                    onClick={()=>onApproveDoc(user.id, type)} 
                                                    disabled={isApproved || !!processingId} 
                                                    className="bg-cbjjs-green text-white py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg shadow-green-500/10 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {processingId === `${user.id}-${type}` ? <Loader2 className="animate-spin mx-auto" size={12}/> : 'Aprovar'}
                                                </button>
                                                <button 
                                                    onClick={() => onRejectDoc(user.id, type)} 
                                                    disabled={isApproved || doc.status === DocumentStatus.REJECTED || !!processingId} 
                                                    className="bg-red-600 text-white py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg shadow-red-500/10 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Recusar
                                                </button>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleDownload(doc.url!, `${type}_${user.fullName.replace(/\s+/g, '_')}`)}
                                                disabled={downloadingUrl === doc.url}
                                                className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {downloadingUrl === doc.url ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                                Baixar Documento
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t dark:border-slate-700 text-center">
                    {!isFullyApproved && (
                        <p className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Aprovar atleta sem que toda documentação esteja aprovada?</p>
                    )}
                    <button 
                        onClick={() => !isFullyApproved && onApproveFederation(user.id)}
                        disabled={isFullyApproved || !!processingId}
                        className={`w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl
                            ${isFullyApproved 
                                ? 'bg-cbjjs-green text-white opacity-100 cursor-default' 
                                : 'bg-cbjjs-blue text-white shadow-blue-500/20 hover:bg-blue-800 active:scale-95'
                            }
                        `}
                    >
                        {processingId === `${user.id}-federation` ? (
                            <Loader2 className="animate-spin" size={18}/>
                        ) : isFullyApproved ? (
                            <><CheckCircle size={18}/> Atleta Aprovado</>
                        ) : (
                            'Aprovar na Confederação'
                        )}
                    </button>
                </div>

                <div className="space-y-4 mt-8">
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
                            <Trash2 size={14}/> Excluir Conta do Atleta
                        </button>
                    ) : (
                        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl animate-fadeIn">
                            <div className="flex items-center gap-3 mb-4 text-red-600">
                                <AlertTriangle size={24}/>
                                <h4 className="font-black uppercase text-xs tracking-widest">Confirma a exclusão?</h4>
                            </div>
                            <p className="text-xs text-red-700 dark:text-red-400 mb-4 font-medium leading-relaxed">
                                Esta ação é irreversível. Todos os dados do atleta, histórico e documentos serão removidos do sistema permanentemente.
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
                                    onClick={handleDeleteAthlete}
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
    );
};