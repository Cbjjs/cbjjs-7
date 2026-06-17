import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Belt, PaymentStatus, DocumentStatus } from '../types';
import { BRAZIL_STATES } from '../constants';
import { formatCPF } from '../utils/validators';
import { UserPlus, Plus, RefreshCw, Smartphone, Printer, Eye, ChevronLeft, Loader2, User as UserIcon, Calendar as CalendarIcon, Award, CheckCircle, CreditCard, Camera, Save, FileText, Building, Clock, AlertCircle, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useMyDependents } from '../hooks/useMyDependents';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { useToast } from '../context/ToastContext';
import { GraduationHistory } from '../components/GraduationHistory';
import { PaymentModal } from '../components/PaymentModal';
import { PaymentInviteModal, PaymentPlanOption } from '../components/PaymentInviteModal';
import { BillingDataModal } from '../components/BillingDataModal';
import { supabase } from '../lib/supabase';

export const MyDependents: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const { addToast } = useToast();
    
    const {
        myChildren, isLoading, isError, view, setView, selectedChild, setSelectedChild,
        step, setStep, isSubmitting, loadingZip, isEditing, setIsEditing,
        formData, setFormData, academiesList, loadingAcademies, searchTerm, setSearchTerm,
        ageWarning, handleDobChange, handleZipLookup, handleCreateDependent, handleSaveEdit, refetch,
        isTermAccepted, setIsTermAccepted
    } = useMyDependents();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    
    const [availablePlans, setAvailablePlans] = useState<PaymentPlanOption[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<PaymentPlanOption | null>(null);
    const [paymentData, setPaymentData] = useState({ pixId: '', pixCode: '', qrCodeBase64: '', amount: '0,00' });
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase.from('system_settings').select('*').like('key', 'plan_%');
            const getVal = (k: string, def: string) => data?.find(s => s.key === k)?.value || def;

            const plans: PaymentPlanOption[] = [];
            if (getVal('plan_digital_active', 'true') === 'true') {
                plans.push({ id: 'DIGITAL', title: 'Versão Digital', price: parseFloat(getVal('plan_digital_price', '30.00')), description: 'Carteirinha digital oficial disponível no menu.', icon: Smartphone, color: 'blue' });
            }
            if (getVal('plan_printed_active', 'true') === 'true') {
                plans.push({ id: 'PRINTED', title: 'Versão Impressa', price: parseFloat(getVal('plan_printed_price', '35.00')), description: 'Carteirinha digital + versão IMPRESSA enviada para você.', icon: Printer, color: 'green', featured: true });
            }
            setAvailablePlans(plans);
        };
        fetchPlans();
    }, []);

    const onInvitePay = (plan: PaymentPlanOption) => {
        setSelectedPlan(plan);
        setIsInviteModalOpen(false);
        setIsBillingModalOpen(true);
    };

    const handleGeneratePix = async (billingData: { name: string, email: string, taxId: string, phone: string }) => {
        if (!selectedChild || !selectedPlan) return;
        setIsGeneratingPayment(true);
        try {
            if (!selectedChild.phone || selectedChild.phone !== billingData.phone) {
                await supabase.from('dependents').update({ phone: billingData.phone }).eq('id', selectedChild.id);
            }

            const { data, error } = await supabase.functions.invoke('create-abacate-billing', {
                body: { 
                    amount: selectedPlan.price, 
                    plan: selectedPlan.id, 
                    dependentId: selectedChild.id,
                    customerData: billingData
                }
            });
            if (error) throw error;
            const pixInfo = data.data;
            setPaymentData({ 
                pixId: pixInfo.id || '', pixCode: pixInfo.brCode || '', 
                qrCodeBase64: pixInfo.brCodeBase64 || '', amount: selectedPlan.price.toFixed(2).replace('.', ',') 
            });
            setIsBillingModalOpen(false);
            setIsPaymentModalOpen(true);
        } catch (error: any) { addToast('error', error.message); } finally { setIsGeneratingPayment(false); }
    };

    const getDocStatusColor = (status: DocumentStatus, url?: string) => {
        if (status === DocumentStatus.APPROVED) return 'text-green-600';
        if (status === DocumentStatus.REJECTED) return 'text-red-600';
        if (url) return 'text-blue-600';
        return 'text-yellow-600';
    };

    const labelClass = "block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest";
    const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm";

    const currentDate = new Date().toLocaleDateString('pt-BR');

    return (
        <div className="animate-fadeIn">
            {view === 'LIST' ? (
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-2xl mb-10 p-10">
                        <div className="relative z-10"><h1 className="text-4xl font-black mb-4 tracking-tighter">Tem filho atleta menor de idade?</h1><p className="text-indigo-100 max-w-xl font-medium leading-relaxed font-bold">Cadastre seus filhos na confederação clicando no botão abaixo.</p></div>
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-6">
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Meus Filhos Atletas</h2>
                        <div className="flex gap-4">
                            <button onClick={() => refetch()} className="p-3 text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><RefreshCw size={22} className={isLoading ? 'animate-spin' : ''} /></button>
                            <button onClick={() => { setView('CREATE'); setStep(1); setFormData({fullName:'', dob:'', cpf: '', nationality: 'Brasil', belt: Belt.WHITE, academyId:'', academyName:'', zip: '', street: '', city: '', state: '', number: '', complement: ''}); setIsTermAccepted(false); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-500/20 uppercase text-xs tracking-widest active:scale-95 transition-all"><Plus size={18} /> Cadastrar Filho</button>
                        </div>
                    </div>

                    {isLoading ? <AdminListSkeleton /> : isError ? <AdminErrorState onRetry={() => refetch()} /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            {myChildren.length === 0 ? (
                                <div className="col-span-2 text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200"><UserPlus size={64} className="text-gray-100 mx-auto mb-6" /><p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Nenhum filho cadastrado ainda.</p></div>
                            ) : myChildren.map(child => (
                                <div key={child.id} onClick={() => { setSelectedChild(child); setView('DETAILS'); }} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-all group hover:border-indigo-600 hover:shadow-xl cursor-pointer">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden shadow-inner">{child.profileImageUrl ? <img src={child.profileImageUrl} className="w-full h-full object-cover"/> : <UserIcon size={32}/>}</div>
                                            <div><h3 className="text-2xl font-black dark:text-white group-hover:text-indigo-600 transition-colors leading-none mb-2">{child.fullName}</h3><p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Faixa {child.belt}</p></div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${child.paymentStatus === PaymentStatus.PAID ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{child.paymentStatus === PaymentStatus.PAID ? 'Ativo' : 'Pendente'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400"><span>Matrícula: {child.federationId ? String(child.federationId).padStart(6, '0') : '---'}</span><div className="flex items-center gap-1"><Eye size={14}/> Ver Detalhes</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : view === 'CREATE' ? (
                <div className="max-w-3xl mx-auto py-6">
                    <button onClick={() => setView('LIST')} className="mb-8 flex items-center gap-2 text-gray-400 font-black hover:text-gray-900 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Voltar para lista</button>
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-10 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col gap-6">
                             <div className="flex items-center gap-5"><div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"><UserPlus size={24} /></div><h2 className="text-3xl font-black dark:text-white tracking-tighter">Ficha do Dependente</h2></div>
                             <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full transition-all duration-700" style={{width: `${(step/5)*100}%`}}></div></div>
                        </div>
                        <div className="p-10 md:p-14">
                            {step === 1 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter flex items-center gap-2"><CalendarIcon size={20} className="text-indigo-600"/> 1. Identificação</h3>
                                    <div className="space-y-6">
                                        <div><label className={labelClass}>Nome Completo do Filho *</label><input className={inputClass} value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} placeholder="Ex: João Silva Jr" /></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={labelClass}>Data de Nascimento *</label><input type="date" className={inputClass} value={formData.dob} onChange={e=>handleDobChange(e.target.value)} /></div>
                                            <div><label className={labelClass}>Nacionalidade *</label><input className={inputClass} value={formData.nationality} onChange={e=>setFormData({...formData, nationality: e.target.value})} /></div>
                                        </div>
                                        <div><label className={labelClass}>CPF / Identificação</label><input className={inputClass} value={formData.cpf} onChange={e=>setFormData({...formData, cpf: formatCPF(e.target.value)})} maxLength={14} placeholder="000.000.000-00" /></div>
                                        {ageWarning && <div className="p-6 bg-red-50 border-l-4 border-red-600 rounded-xl flex items-start gap-4 animate-fadeIn"><AlertCircle className="text-red-600 shrink-0" size={24}/><p className="text-sm font-bold text-red-900 leading-relaxed">Para registrar seu filho, ele precisa ser menor de 18 anos. Caso ele já tenha 18 anos, peça para que ele crie uma conta nova aqui na confederação com um email e senha.</p></div>}
                                    </div>
                                    <button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.dob || ageWarning} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center gap-2">Próximo Passo <ChevronLeft className="rotate-180" size={18}/></button>
                                </div>
                            )}
                            {step === 2 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter flex items-center gap-2"><MapPin size={20} className="text-indigo-600"/> 2. Endereço</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1 md:col-span-2"><label className={labelClass}>CEP *</label><div className="relative"><input className={inputClass} value={formData.zip} onChange={e => { const z = e.target.value.replace(/\D/g, '').slice(0, 8); setFormData({...formData, zip: z.replace(/^(\d{5})(\d)/, '$1-$2')}); if (z.length === 8) handleZipLookup(z); }} placeholder="00000-000" />{loadingZip && <Loader2 className="absolute right-3 top-3.5 animate-spin text-cbjjs-blue" size={18}/>}</div></div>
                                        <div className="col-span-1 md:col-span-2"><label className={labelClass}>Rua *</label><input className={inputClass} value={formData.street} onChange={e=>setFormData({...formData, street: e.target.value})} /></div>
                                        <div><label className={labelClass}>Cidade *</label><input className={inputClass} value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} /></div>
                                        <div><label className={labelClass}>Estado *</label><select className={inputClass} value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})}><option value="">UF</option>{BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.sigla}</option>)}</select></div>
                                        <div><label className={labelClass}>Número *</label><input className={inputClass} value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})} /></div>
                                        <div><label className={labelClass}>Complemento</label><input className={inputClass} value={formData.complement} onChange={e=>setFormData({...formData, complement: e.target.value})} /></div>
                                    </div>
                                    <div className="flex gap-4"><button onClick={() => setStep(1)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">Voltar</button><button onClick={() => setStep(3)} disabled={!formData.zip || !formData.street} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Próximo Passo</button></div>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter flex items-center gap-2"><Award size={20} className="text-indigo-600"/> 3. Graduação Atual</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[Belt.WHITE, Belt.GREY, Belt.YELLOW, Belt.ORANGE, Belt.GREEN, Belt.BLUE, Belt.PURPLE, Belt.BROWN, Belt.BLACK].map(b => (<button key={b} onClick={() => setFormData({...formData, belt: b})} className={`py-4 px-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${formData.belt === b ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 hover:border-indigo-300'}`}>{b}</button>))}</div>
                                    <div className="flex gap-4"><button onClick={() => setStep(2)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">Voltar</button><button onClick={() => setStep(4)} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Próximo Passo</button></div>
                                </div>
                            )}
                            {step === 4 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter flex items-center gap-2"><Building size={20} className="text-indigo-600"/> 4. Vínculo com Academia</h3>
                                    <div className="relative"><Search className="absolute left-4 top-3.5 text-gray-400" size={20}/><input placeholder="Buscar academia aprovada..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600"/></div>
                                    <div className="max-h-60 overflow-y-auto border rounded-3xl divide-y bg-gray-50/50">{loadingAcademies ? <div className="p-4 text-center"><Loader2 className="animate-spin inline mr-2"/> Carregando...</div> : academiesList.map(ac => (<button key={ac.id} onClick={() => setFormData({...formData, academyId: ac.id, academyName: ac.name})} className={`w-full p-5 text-left transition-all flex items-center justify-between ${formData.academyId === ac.id ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50'}`}><span className="font-bold text-sm">{ac.name}</span>{formData.academyId === ac.id && <CheckCircle size={18}/>}</button>))}</div>
                                    <div className="flex gap-4"><button onClick={() => setStep(3)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">Voltar</button><button onClick={() => setStep(5)} disabled={!formData.academyId} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Próximo Passo</button></div>
                                </div>
                            )}
                            {step === 5 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter flex items-center gap-2"><FileText size={20} className="text-indigo-600"/> 5. Termos de Responsabilidade</h3>
                                    
                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border dark:border-slate-700 max-h-[400px] overflow-y-auto scrollbar-hide text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-6">
                                        <p className="font-black text-xs uppercase tracking-widest text-center border-b pb-4 dark:border-slate-700">
                                            TERMO DE RESPONSABILIDADE, DECLARAÇÃO DE APTIDÃO FÍSICA, AUTORIZAÇÃO DE PARTICIPAÇÃO ESPORTIVA, USO DE IMAGEM E CONSENTIMENTO PARA TRATAMENTO DE DADOS (LGPD)
                                        </p>
                                        
                                        <p>Ao realizar o cadastro e filiação do atleta menor de idade no sistema da entidade esportiva, o responsável legal declara que leu atentamente e concorda com os termos abaixo:</p>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">1. Identificação e responsabilidade do responsável legal</h4>
                                            <p>Declaro que sou o responsável legal pelo(a) atleta menor de idade cadastrado(a) no sistema e que possuo autoridade para autorizar sua participação em atividades esportivas.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">2. Declaração de aptidão física</h4>
                                            <p>Declaro, sob minha responsabilidade, que o(a) atleta encontra-se apto(a) para a prática de atividades físicas e esportivas, incluindo treinamentos, eventos, campeonatos e competições vinculadas à entidade organizadora.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">3. Condições de saúde e veracidade das informações</h4>
                                            <p>Declaro que não tenho conhecimento de qualquer doença, condição médica, limitação física ou problema de saúde que impeça ou coloque em risco a participação do(a) atleta nas atividades esportivas.</p>
                                            <p className="mt-2">Declaro ainda que não estou omitindo, escondendo ou deixando de informar qualquer informação médica relevante, assumindo total responsabilidade pela veracidade das informações prestadas.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">4. Compromisso de atualização de informações médicas</h4>
                                            <p>Comprometo-me a informar imediatamente à entidade organizadora, professores, treinadores ou responsáveis técnicos caso o(a) atleta venha a presentar qualquer alteração em seu estado de saúde, lesão ou recomendação médica que limite ou impeça a prática esportiva.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">5. Autorização para participação em atividades esportivas</h4>
                                            <p>Autorizo o(a) atleta menor de idade sob minha responsabilidade a participar de treinamentos, eventos, campeonatos, competições e demais atividades esportivas organizadas, reconhecidas ou autorizadas pela entidade esportiva responsável pela filiação.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">6. Ciência dos riscos da prática esportiva</h4>
                                            <p>Declaro estar ciente de que atividades esportivas envolvem riscos inerentes, como quedas, contusões, lesões musculares ou outros acidentes decorrentes da prática esportiva, estando ciente desses riscos ao autorizar a participação do(a) atleta.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">7. Autorização para uso de imagem e voz</h4>
                                            <p>Autorizo, de forma gratuita e por prazo indeterminado, o uso da imagem, voz, nome e participação esportiva do(a) atleta em fotografias, vídeos, transmissões ao vivo, materiais institucionais, publicações em redes sociais, campanhas promocionais ou conteúdos educacionais vinculados à entidade organizadora, sem que isso gere qualquer direito a compensação financeira.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">8. Consentimento para tratamento de dados pessoais (LGPD)</h4>
                                            <p>Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), autorizo a entidade esportiva responsável a coletar, armazenar e utilizar os dados pessoais do responsável legal e do(a) atleta, exclusivamente para fins administrativos, esportivos, organizacionais, estatísticos e de comunicação relacionados às atividades da entidade.</p>
                                            <p className="mt-2">Declaro estar ciente de que os dados serão tratados de forma segura e utilizados apenas para finalidades relacionadas à filiação, participação em eventos, competições, controle esportivo e comunicação institucional.</p>
                                        </div>

                                        <div>
                                            <h4 className="font-black text-indigo-600 uppercase text-[11px] mb-1">9. Validade do aceite eletrônico</h4>
                                            <p>Declaro que, ao marcar a opção “Li e concordo com os termos” no sistema de cadastro ou filiação online, confirmo que li, compreendi e concordo integralmente com todas as condições descritas neste termo, sendo este aceite eletrônico considerado válido como manifestação formal de vontade do responsável legal.</p>
                                            <p className="mt-2">Este termo passa a ter validade a partir da confirmação eletrônica realizada no sistema de cadastro da entidade esportiva.</p>
                                        </div>

                                        <div className="pt-4 border-t dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            Data da confirmação eletrônica: {currentDate}
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                                        <input 
                                            type="checkbox" 
                                            id="accept-term"
                                            checked={isTermAccepted}
                                            onChange={(e) => setIsTermAccepted(e.target.checked)}
                                            className="mt-1 w-5 h-5 text-indigo-600 rounded-lg border-indigo-200 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="accept-term" className="text-sm font-bold text-indigo-900 dark:text-indigo-300 leading-snug cursor-pointer">
                                            Li e concordo com todos os termos de responsabilidade e uso de dados acima descritos.
                                        </label>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setStep(4)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">Voltar</button>
                                        <button 
                                            onClick={handleCreateDependent} 
                                            disabled={isSubmitting || !isTermAccepted} 
                                            className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle size={24}/>} 
                                            Finalizar Registro Base
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                selectedChild && (
                    <div className="space-y-10 animate-fadeIn pb-20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <button onClick={() => { setView('LIST'); setIsEditing(false); }} className="p-3 bg-white border rounded-2xl text-gray-400 hover:text-indigo-600 transition-colors shadow-sm"><ChevronLeft size={24}/></button>
                                <div><h1 className="text-3xl font-black dark:text-white tracking-tight">{selectedChild.fullName}</h1><p className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">Dependente sob responsabilidade de {user?.fullName}</p></div>
                            </div>
                            <div className="flex gap-3">
                                {!isEditing ? (
                                    <button onClick={() => { 
                                        setFormData({ 
                                            fullName: selectedChild.fullName, dob: selectedChild.dob, cpf: selectedChild.cpf || '', nationality: selectedChild.nationality || 'Brasil', 
                                            belt: selectedChild.belt, academyId: (selectedChild as any).academyId || '', academyName: (selectedChild as any).academyName || '',
                                            zip: selectedChild.address?.zip || '', street: selectedChild.address?.street || '', city: selectedChild.address?.city || '', state: selectedChild.address?.state || '', number: selectedChild.address?.number || '', complement: selectedChild.address?.complement || ''
                                        });
                                        setIsEditing(true); 
                                    }} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm"><RefreshCw size={16} /> Atualizar Perfil</button>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-500 text-sm">Cancelar</button>
                                        <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-cbjjs-green text-white rounded-xl font-bold shadow hover:bg-green-700 text-sm"><Save size={16} /> {isSubmitting ? 'Salvando...' : 'Salvar'}</button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="space-y-8">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Award className="text-cbjjs-gold" size={18} /> Situação Federação</h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pagamento 2026</span><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedChild.paymentStatus === PaymentStatus.PAID ? 'text-green-600' : 'text-red-500'}`}>{selectedChild.paymentStatus === PaymentStatus.PAID ? 'Confirmado' : 'Pendente'}</span></div>
                                        {selectedChild.paymentStatus !== PaymentStatus.PAID && (<button onClick={() => setIsInviteModalOpen(true)} className="w-full py-4 bg-cbjjs-green text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse-green"><CreditCard size={16} /> Pagar Anuidade</button>)}
                                        
                                        <div className="pt-6 border-t dark:border-slate-700">
                                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                                <Building className="text-cbjjs-blue" size={18} /> Unidade / Academia
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className={labelClass}>Academia</span>
                                                    <p className="font-bold text-sm dark:text-white">{(selectedChild as any).academyName || 'Não informada'}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className={labelClass}>Status Vínculo</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${selectedChild.academyStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {selectedChild.academyStatus === 'APPROVED' ? <><CheckCircle size={10}/> Aprovado</> : <><Clock size={10}/> Aguardando</>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t dark:border-slate-700">
                                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><FileText className="text-cbjjs-blue" size={18} /> Documentação</h3>
                                            <div className="space-y-4">
                                                {['profile', 'identity', 'medical', 'belt'].map(key => {
                                                    const doc = selectedChild.documents[key as keyof typeof selectedChild.documents];
                                                    const label = key === 'profile' ? 'Foto Carteirinha' : key === 'identity' ? 'Identidade (RG/CNH)' : key === 'medical' ? 'Atestado Médico' : 'Certificado de Faixa';
                                                    const statusLabel = doc?.status === 'APPROVED' ? 'Aprovado' : doc?.status === 'REJECTED' ? 'Recusado' : doc?.url ? 'Em Análise' : 'Pendente';
                                                    return (
                                                        <div key={key} className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">{label}</span>
                                                            <span className={`font-black uppercase text-[10px] ${getDocStatusColor(doc?.status || 'MISSING', doc?.url)}`}>{statusLabel}</span>
                                                        </div>
                                                    );
                                                })}
                                                <button onClick={() => window.location.href=`/upload-dependent-docs.html?id=${selectedChild.id}`} className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Camera size={14} /> Enviar / Alterar documentos</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-xl font-black mb-8 border-b pb-4 dark:text-white">Informações Cadastrais</h3>
                                    {isEditing ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="col-span-2"><label className={labelClass}>Nome Completo</label><input className={inputClass} value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})}/></div>
                                            <div><label className={labelClass}>Nascimento</label><input type="date" className={inputClass} value={formData.dob} onChange={e=>handleDobChange(e.target.value)}/></div>
                                            <div><label className={labelClass}>CPF</label><input className={inputClass} value={formData.cpf} onChange={e=>setFormData({...formData, cpf: formatCPF(e.target.value)})}/></div>
                                            <div className="col-span-2 mt-4 pt-4 border-t"><label className={labelClass}>CEP</label><div className="relative"><input className={inputClass} value={formData.zip} onChange={e => { const z = e.target.value.replace(/\D/g, '').slice(0, 8); setFormData({...formData, zip: z.replace(/^(\d{5})(\d)/, '$1-$2')}); if (z.length === 8) handleZipLookup(z); }} />{loadingZip && <Loader2 className="absolute right-3 top-3.5 animate-spin text-cbjjs-blue" size={18}/>}</div></div>
                                            <div className="col-span-2"><label className={labelClass}>Rua</label><input className={inputClass} value={formData.street} onChange={e=>setFormData({...formData, street: e.target.value})}/></div>
                                            <div><label className={labelClass}>Cidade</label><input className={inputClass} value={formData.city} readOnly/></div>
                                            <div><label className={labelClass}>Estado</label><select className={inputClass} value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})}>{BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.sigla}</option>)}</select></div>
                                            <div><label className={labelClass}>Número</label><input className={inputClass} value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})}/></div>
                                            <div><label className={labelClass}>Complemento</label><input className={inputClass} value={formData.complement} onChange={e=>setFormData({...formData, complement: e.target.value})}/></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div><label className={labelClass}>Nome Completo</label><p className="font-bold text-gray-800 dark:text-white">{selectedChild.fullName}</p></div>
                                            <div><label className={labelClass}>Nascimento</label><p className="font-bold text-gray-800 dark:text-white">{new Date(selectedChild.dob).toLocaleDateString('pt-BR')}</p></div>
                                            <div><label className={labelClass}>CPF / Identificação</label><p className="font-bold text-gray-800 dark:text-white">{selectedChild.cpf || 'Não informado'}</p></div>
                                            <div><label className={labelClass}>Nacionalidade</label><p className="font-bold text-gray-800 dark:text-white">{selectedChild.nationality}</p></div>
                                            <div className="col-span-2 mt-4 pt-4 border-t dark:border-slate-700">
                                                <label className={labelClass}>Endereço Residencia</label>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">{selectedChild.address?.street}, {selectedChild.address?.number} {selectedChild.address?.complement && `- ${selectedChild.address.complement}`}</p>
                                                <p className="text-xs text-gray-500">{selectedChild.address?.city} - {selectedChild.address?.state} (CEP: {selectedChild.address?.zip})</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <GraduationHistory athleteData={{ belt: selectedChild.belt }} isEditing={isEditing} onUpdate={(updates) => setFormData({...formData, belt: updates.belt as Belt})} />
                            </div>
                        </div>
                    </div>
                )
            )}
            
            <PaymentInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onPay={onInvitePay} isLoading={false} availablePlans={availablePlans} />
            
            <BillingDataModal 
                isOpen={isBillingModalOpen} 
                onClose={() => setIsBillingModalOpen(false)} 
                initialData={{ name: selectedChild?.fullName || '', email: user?.email || '', taxId: selectedChild?.cpf || '', phone: selectedChild?.phone || '' }} 
                onConfirm={handleGeneratePix} 
                isLoading={isGeneratingPayment}
            />

            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
                pixId={paymentData.pixId} 
                pixCode={paymentData.pixCode} 
                qrCodeBase64={paymentData.qrCodeBase64} 
                amount={paymentData.amount} 
                dependentId={selectedChild?.id} 
                onSuccess={() => { setIsPaymentModalOpen(false); refetch(); }} 
            />
        </div>
    );
};