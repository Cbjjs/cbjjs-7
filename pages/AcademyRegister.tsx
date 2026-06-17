import React, { useState } from 'react';
import { Building, CheckCircle, ChevronRight, ChevronLeft, Plus, Loader2, FileText, X, Edit, Save, RefreshCw, Camera } from 'lucide-react';

import { useMyAcademies } from '../hooks/useMyAcademies';
import { DocumentStatus } from '../types';
import { BRAZIL_STATES } from '../constants';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { AcademyListItem } from '../components/academies/AcademyListItem';
import { AcademyEmptyState } from '../components/academies/AcademyEmptyState';
import { RequestCertificateModal } from '../components/academies/RequestCertificateModal';
import { useAcademyCertificates } from '../hooks/useAcademyCertificates';
import { Academy } from '../types';

const inputClass = (hasError: boolean, isReadOnly: boolean = false) =>

    `w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400 
    ${isReadOnly ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-70' : 'bg-gray-50 dark:bg-slate-700'}
    ${hasError ? 'border-red-500 ring-1 ring-red-200 focus:ring-red-200' : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-cbjjs-blue focus:border-transparent'}`;

const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-wider text-[10px]";

export const AcademyRegister: React.FC = () => {
    const {
        academies, isLoading, isError, view, setView, isSubmitting,
        selectedAcademy, setSelectedAcademy, isEditing, setIsEditing,
        step, setStep, loadingZip, formErrors, formData, handleZipLookup,
        validateStep, handleSubmitNew, handleSaveUpdate, resetForm,
        startEditing, refetch, setFormData
    } = useMyAcademies();

    const { price, isRequesting, handleRequest, myCertificates, fetchMyCertificates } = useAcademyCertificates();
    const [requestingAcademy, setRequestingAcademy] = useState<Academy | null>(null);

    const handleOpenUploadPortal = (academyId: string) => {

        window.location.href = `/upload-docs.html?id=${academyId}`;
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const getDocStatusLabel = (status: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.APPROVED: return 'Aprovado';
            case DocumentStatus.REJECTED: return 'Recusado';
            case DocumentStatus.PENDING: return 'Em Análise';
            default: return 'Pendente';
        }
    };

    const getDocStatusColor = (status: DocumentStatus) => {
        switch(status) {
            case DocumentStatus.APPROVED: return 'text-green-500';
            case DocumentStatus.REJECTED: return 'text-red-500';
            case DocumentStatus.PENDING: return 'text-blue-500';
            default: return 'text-orange-500';
        }
    };

    return (
        <div className="relative">
            <div className="animate-fadeIn">
                {view === 'LIST' ? (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-2xl mb-10 p-10">
                            <div className="relative z-10">
                                <h1 className="text-4xl font-black mb-4 tracking-tighter">Gestão da Academia</h1>
                                <p className="text-blue-100 max-w-xl font-medium leading-relaxed">Painel oficial para professores e proprietários de equipes.</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-6">
                            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Minhas Unidades</h2>
                            <div className="flex gap-4">
                                <button onClick={() => refetch()} className="p-3 text-cbjjs-blue hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><RefreshCw size={22} className={isLoading ? 'animate-spin' : ''} /></button>
                                <button onClick={resetForm} className="bg-cbjjs-blue text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20 uppercase text-xs tracking-widest"><Plus size={18} /> Nova Academia</button>
                            </div>
                        </div>

                        {isLoading ? <AdminListSkeleton /> : isError ? <AdminErrorState onRetry={() => refetch()} /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                                {academies.length === 0 ? (
                                    <AcademyEmptyState />
                                ) : academies.map(acc => (
                                    <AcademyListItem
                                        key={acc.id}
                                        academy={acc}
                                        onClick={setSelectedAcademy}
                                        onUploadClick={handleOpenUploadPortal}
                                        onRequestCertificate={(academy) => setRequestingAcademy(academy)}
                                        getDocStatusLabel={getDocStatusLabel}
                                        getDocStatusColor={getDocStatusColor}
                                        certificate={myCertificates.find(c => c.academyId === acc.id)}
                                    />

                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-6 px-4">
                        <button onClick={() => setView('LIST')} className="mb-8 flex items-center gap-2 text-gray-400 font-black hover:text-gray-900 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Voltar</button>
                        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="p-10 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                                 <div className="flex items-center gap-5 mb-8"><img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS" className="w-14 h-auto" /><h2 className="text-3xl font-black dark:text-white tracking-tighter">Ficha de Registro</h2></div>
                                 <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden"><div className="bg-cbjjs-blue h-full transition-all duration-700" style={{width: `${(step/2)*100}%`}}></div></div>
                            </div>
                            <div className="p-10 md:p-14">
                                {step === 1 && (
                                    <div className="space-y-8 animate-fadeIn">
                                        <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter">1. Informações Básicas</h3>
                                        <div><label className={labelClass}>Nome Completo da Academia *</label><input className={inputClass(!!formErrors.teamName)} value={formData.teamName} onChange={e => handleChange('teamName', e.target.value)} placeholder="Ex: Gracie Barra Centro" required /></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={labelClass}>CPF do Responsável *</label><input className={inputClass(!!formErrors.responsibleCpf)} value={formData.responsibleCpf} onChange={e => handleChange('responsibleCpf', e.target.value)} maxLength={14} placeholder="000.000.000-00" required /></div>
                                            <div><label className={labelClass}>CNPJ (Opcional)</label><input className={inputClass(false)} value={formData.cnpj} onChange={e => handleChange('cnpj', e.target.value)} maxLength={18} placeholder="00.000.000/0000-00" /></div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2"><label className={labelClass}>Telefone para Atletas *</label><input className={inputClass(!!formErrors.phone)} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(00) 00000-0000" required /></div>
                                    </div>
                                )}
                                {step === 2 && (
                                    <div className="space-y-8 animate-fadeIn">
                                        <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter">2. Localização</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>CEP *</label>
                                                <div className="relative">
                                                    <input className={inputClass(!!formErrors.zip)} value={formData.zip} onChange={e => handleChange('zip', e.target.value)} placeholder="00000-000" required />
                                                    {loadingZip && <Loader2 className="absolute right-3 top-3.5 animate-spin text-cbjjs-blue" size={18}/>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Estado *</label>
                                                <select className={inputClass(!!formErrors.state)} value={formData.state} onChange={e => handleChange('state', e.target.value)} required>
                                                    <option value="">UF</option>
                                                    {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.sigla}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-1 md:col-span-2"><label className={labelClass}>Rua / Logradouro *</label><input className={inputClass(!!formErrors.street)} value={formData.street} onChange={e => handleChange('street', e.target.value)} placeholder="Rua, Avenida, etc." required /></div>
                                            <div><label className={labelClass}>Cidade *</label><input className={inputClass(!!formErrors.city)} value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="Nome da cidade" required /></div>
                                            <div><label className={labelClass}>Número *</label><input className={inputClass(!!formErrors.number)} value={formData.number} onChange={e => handleChange('number', e.target.value)} placeholder="S/N" required /></div>
                                            <div className="col-span-1 md:col-span-2"><label className={labelClass}>Complemento</label><input className={inputClass(false)} value={formData.complement} onChange={e => handleChange('complement', e.target.value)} placeholder="Opcional" /></div>
                                        </div>
                                        <button onClick={handleSubmitNew} disabled={isSubmitting} className="w-full mt-8 bg-cbjjs-green text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-green-500/30 active:scale-[0.98] flex items-center justify-center gap-3">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle size={24}/>}
                                            {isSubmitting ? 'Salvando Registro...' : 'Concluir Cadastro Base'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {step < 2 && (
                                <div className="p-10 bg-gray-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end items-center">
                                    <button onClick={() => { if(validateStep(1)) setStep(2); }} className="bg-cbjjs-blue text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-[10px] tracking-widest flex items-center gap-2">Próximo Passo <ChevronRight size={16}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedAcademy && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border dark:border-slate-700 m-auto">
                        <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
                            <h2 className="text-3xl font-black dark:text-white tracking-tighter leading-none">{isEditing ? 'Atualizar Dados' : selectedAcademy.name}</h2>
                            <div className="flex gap-4">
                                {!isEditing && <button onClick={() => startEditing(selectedAcademy)} className="px-6 py-2.5 bg-blue-50 text-cbjjs-blue rounded-xl hover:bg-blue-100 font-black text-[10px] uppercase flex items-center gap-2"><Edit size={16}/> Editar</button>}
                                <button onClick={() => { setSelectedAcademy(null); setIsEditing(false); }} className="p-2 text-gray-400 hover:text-gray-900"><X size={32}/></button>
                            </div>
                        </div>
                        <div className="p-10 md:p-14 overflow-y-auto space-y-10">
                            {isEditing ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="col-span-2"><label className={labelClass}>Nome Academia *</label><input className={inputClass(!!formErrors.teamName)} value={formData.teamName} onChange={e => handleChange('teamName', e.target.value)} /></div>
                                        <div><label className={labelClass}>Telefone *</label><input className={inputClass(!!formErrors.phone)} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
                                        <div>
                                            <label className={labelClass}>CEP *</label>
                                            <div className="relative">
                                                <input className={inputClass(!!formErrors.zip)} value={formData.zip} onChange={e => handleChange('zip', e.target.value)} />
                                                {loadingZip && <Loader2 className="absolute right-3 top-3.5 animate-spin text-cbjjs-blue" size={18}/>}
                                            </div>
                                        </div>
                                        <div className="col-span-2"><label className={labelClass}>Rua *</label><input className={inputClass(!!formErrors.street)} value={formData.street} onChange={e => handleChange('street', e.target.value)} /></div>
                                        <div><label className={labelClass}>Cidade *</label><input className={inputClass(!!formErrors.city)} value={formData.city} onChange={e => handleChange('city', e.target.value)} /></div>
                                        <div><label className={labelClass}>Número *</label><input className={inputClass(!!formErrors.number)} value={formData.number} onChange={e => handleChange('number', e.target.value)} /></div>
                                        <div className="col-span-2"><label className={labelClass}>Complemento</label><input className={inputClass(false)} value={formData.complement} onChange={e => handleChange('complement', e.target.value)} /></div>
                                    </div>
                                    <button onClick={handleSaveUpdate} disabled={isSubmitting} className="w-full bg-cbjjs-blue text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest">{isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} {isSubmitting ? 'Salvando...' : 'Salvar Atualizações'}</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="col-span-2"><label className={labelClass}>Equipe Oficial</label><p className="text-3xl font-black dark:text-white leading-tight">{selectedAcademy.teamName}</p></div>
                                    <div className="bg-gray-50 dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800">
                                        <label className={labelClass}>Localização</label>
                                        <p className="text-sm dark:text-gray-300 font-bold leading-relaxed">
                                            {selectedAcademy.address?.street}, {selectedAcademy.address?.number} {selectedAcademy.address?.complement ? `- ${selectedAcademy.address.complement}` : ''}<br/>
                                            {selectedAcademy.address?.city} - {selectedAcademy.address?.state}
                                        </p>
                                    </div>
                                    <div className="col-span-2 pt-10 border-t dark:border-slate-700">
                                        <label className={labelClass}>Documentação Digital</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {/* Diploma Section */}
                                            <div className="space-y-4">
                                                <div className={`p-6 rounded-3xl flex items-center justify-between shadow-sm border ${selectedAcademy.blackBeltCertificate?.status === DocumentStatus.REJECTED ? 'bg-red-50 border-red-200' : 'bg-gray-50 dark:bg-slate-700 border-transparent'}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-black dark:text-gray-300 uppercase tracking-widest block mb-1">Diploma Faixa Preta</span>
                                                        <span className={`text-[11px] font-black uppercase ${getDocStatusColor(selectedAcademy.blackBeltCertificate?.status || DocumentStatus.MISSING)}`}>
                                                            {getDocStatusLabel(selectedAcademy.blackBeltCertificate?.status || DocumentStatus.MISSING)}
                                                        </span>
                                                    </div>
                                                    {selectedAcademy.blackBeltCertificate?.url ? (
                                                        <a href={selectedAcademy.blackBeltCertificate.url} target="_blank" rel="noreferrer" className="p-3 bg-white dark:bg-slate-600 rounded-xl text-cbjjs-blue hover:scale-110 transition-transform">
                                                            <FileText size={20} />
                                                        </a>
                                                    ) : (
                                                        <div className="p-3 bg-gray-200 dark:bg-slate-800 rounded-xl text-gray-400"><X size={20}/></div>
                                                    )}
                                                </div>
                                                {selectedAcademy.blackBeltCertificate?.status === DocumentStatus.REJECTED && (
                                                    <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-r-xl">
                                                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">Motivo da Recusa:</p>
                                                        <p className="text-xs font-bold text-red-800">{selectedAcademy.blackBeltCertificate.rejectionReason || 'Não informado'}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ID Section */}
                                            <div className="space-y-4">
                                                <div className={`p-6 rounded-3xl flex items-center justify-between shadow-sm border ${selectedAcademy.identityDocument?.status === DocumentStatus.REJECTED ? 'bg-red-50 border-red-200' : 'bg-gray-50 dark:bg-slate-700 border-transparent'}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-black dark:text-gray-300 uppercase tracking-widest block mb-1">ID do Responsável</span>
                                                        <span className={`text-[11px] font-black uppercase ${getDocStatusColor(selectedAcademy.identityDocument?.status || DocumentStatus.MISSING)}`}>
                                                            {getDocStatusLabel(selectedAcademy.identityDocument?.status || DocumentStatus.MISSING)}
                                                        </span>
                                                    </div>
                                                    {selectedAcademy.identityDocument?.url ? (
                                                        <a href={selectedAcademy.identityDocument.url} target="_blank" rel="noreferrer" className="p-3 bg-white dark:bg-slate-600 rounded-xl text-cbjjs-blue hover:scale-110 transition-transform">
                                                            <Camera size={20} />
                                                        </a>
                                                    ) : (
                                                        <div className="p-3 bg-gray-200 dark:bg-slate-800 rounded-xl text-gray-400"><X size={20}/></div>
                                                    )}
                                                </div>
                                                {selectedAcademy.identityDocument?.status === DocumentStatus.REJECTED && (
                                                    <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-r-xl">
                                                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">Motivo da Recusa:</p>
                                                        <p className="text-xs font-bold text-red-800">{selectedAcademy.identityDocument.rejectionReason || 'Não informado'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {(selectedAcademy.blackBeltCertificate?.status === DocumentStatus.REJECTED || selectedAcademy.identityDocument?.status === DocumentStatus.REJECTED) && (
                                            <div className="mt-8">
                                                <button 
                                                    onClick={() => handleOpenUploadPortal(selectedAcademy.id)}
                                                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw size={18}/> Reenviar Documentos Corrigidos
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {requestingAcademy && (
                <RequestCertificateModal
                    academy={requestingAcademy}
                    price={price}
                    isOpen={!!requestingAcademy}
                    onClose={() => setRequestingAcademy(null)}
                    onEdit={() => {
                        const academyToEdit = requestingAcademy;
                        setRequestingAcademy(null); 
                        startEditing(academyToEdit); 
                        setSelectedAcademy(academyToEdit);
                    }}
                    onConfirm={handleRequest}
                    isSubmitting={isRequesting}
                    onSuccess={fetchMyCertificates}
                />
            )}
        </div>
    );
};