import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Belt } from '../types';
import { BRAZIL_STATES } from '../constants';
import { useOnboarding } from '../hooks/useOnboarding';
import { ChevronRight, ChevronLeft, MapPin, User as UserIcon, Award, Building, Search, Loader2, Calendar } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const { 
    step, setStep, formData, handleChange, cpfError, loadingZip, academiesList, 
    loadingAcademies, searchTerm, setSearchTerm, isSubmitting, errors, validateStep, handleAvançarPortal 
  } = useOnboarding();

  const BELTS_IN_ORDER = [
    Belt.WHITE, Belt.GREY, Belt.YELLOW, Belt.ORANGE, Belt.GREEN,
    Belt.BLUE, Belt.PURPLE, Belt.BROWN, Belt.BLACK,
    Belt.BLACK_1, Belt.BLACK_2, Belt.BLACK_3, Belt.BLACK_4, Belt.BLACK_5, Belt.BLACK_6,
    Belt.RED_BLACK, Belt.RED_WHITE, Belt.RED
  ];

  const inputClass = (h: boolean) => `w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl text-gray-900 dark:text-white outline-none transition-all ${h ? 'border-red-500' : 'border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-cbjjs-blue'}`;
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase text-[10px] tracking-widest";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 py-10 px-4">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-8 shadow-sm border-b dark:border-slate-700">
                <div className="flex items-center gap-4 mb-8">
                    <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS" className="w-16 h-auto" />
                    <div><h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Ficha Cadastral</h1><p className="text-sm font-medium text-gray-500">Etapa {step} de 3</p></div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 mb-6 overflow-hidden"><div className="bg-cbjjs-blue h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div></div>
                <div className="flex justify-between">{[{i:1,l:'Pessoal',ic:UserIcon},{i:2,l:'Atleta',ic:Award},{i:3,l:'Academia',ic:Building}].map(s=>(<div key={s.i} className={`flex flex-col items-center ${step >= s.i ? 'text-cbjjs-blue' : 'text-gray-300'}`}><s.ic size={20} className="mb-1"/><span className="text-[10px] uppercase font-bold hidden sm:block">{s.l}</span></div>))}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 shadow-lg min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-slate-700 pb-2">Dados Pessoais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2"><label className={labelClass}>Nome Completo</label><input value={user?.fullName} className={inputClass(false) + " bg-gray-100 cursor-not-allowed"} readOnly /></div>
                            
                            <div><label className={labelClass}>Nacionalidade *</label><input value={formData.nationality} onChange={e=>handleChange('nationality', e.target.value)} className={inputClass(!!errors.nationality)} /></div>
                            
                            <div><label className={labelClass}>Data de Nascimento *</label><input type="date" value={formData.dob} onChange={e=>handleChange('dob', e.target.value)} className={inputClass(!!errors.dob)} /></div>

                            <div><label className={labelClass}>CPF *</label><input value={formData.cpf} onChange={e=>handleChange('cpf', e.target.value)} maxLength={14} className={inputClass(!!errors.cpf || !!cpfError)} /></div>
                            
                            <div><label className={labelClass}>CEP *</label><div className="relative"><input value={formData.zip} onChange={e=>handleChange('zip', e.target.value)} className={inputClass(!!errors.zip)} maxLength={9}/>{loadingZip && <Loader2 className="absolute right-3 top-3 animate-spin text-cbjjs-blue" size={20}/>}</div></div>
                            
                            <div className="md:col-span-2"><label className={labelClass}>Rua *</label><input value={formData.street} onChange={e=>handleChange('street', e.target.value)} className={inputClass(!!errors.street)} /></div>
                            
                            <div><label className={labelClass}>Cidade *</label><input value={formData.city} onChange={e=>handleChange('city', e.target.value)} className={inputClass(!!errors.city)} /></div>
                            
                            <div><label className={labelClass}>Estado *</label>
                                <select value={formData.state} onChange={e=>handleChange('state',e.target.value)} className={inputClass(!!errors.state)}>
                                    <option value="">UF</option>
                                    {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.sigla}</option>)}
                                </select>
                            </div>
                            
                            <div><label className={labelClass}>Número *</label><input value={formData.number} onChange={e=>handleChange('number', e.target.value)} className={inputClass(!!errors.number)} /></div>
                            
                            <div><label className={labelClass}>Complemento</label><input value={formData.complement} onChange={e=>handleChange('complement', e.target.value)} className={inputClass(false)} /></div>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-slate-700 pb-2">Selecione sua Faixa Atual</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {BELTS_IN_ORDER.map(b=>(<button key={b} onClick={()=>handleChange('belt',b)} className={`py-4 px-4 rounded-xl border-2 text-xs font-black uppercase tracking-tight transition-all ${formData.belt === b ? 'bg-cbjjs-blue text-white border-cbjjs-blue shadow-lg' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600 text-gray-500 hover:border-cbjjs-blue/30'}`}>{b}</button>))}
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b dark:border-slate-700 pb-2">Vincular Academia</h3>
                        <div className="relative mb-4"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl" /></div>
                        <div className="border dark:border-slate-700 rounded-xl max-h-[250px] overflow-y-auto bg-gray-50 dark:bg-slate-900">{loadingAcademies ? <div className="p-4 text-center dark:text-gray-400"><Loader2 className="animate-spin inline mr-2"/> Carregando...</div> : academiesList.map(ac=>(<button key={ac.id} onClick={()=>{handleChange('selectedAcademyId',ac.id);handleChange('selectedAcademyName',ac.name);}} className={`w-full text-left p-4 border-b dark:border-slate-700 ${formData.selectedAcademyId === ac.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold' : 'hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-300'}`}>{ac.name}</button>))}</div>
                    </div>
                )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-b-2xl shadow-sm border-t dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <button onClick={()=>setStep(p=>p-1)} disabled={step===1||isSubmitting} className="w-full md:w-auto px-6 py-3 font-bold text-gray-600 dark:text-gray-400">Voltar</button>
                {step < 3 ? (
                    <button onClick={() => { if(validateStep(step)) setStep(p=>p+1); }} className="w-full md:w-auto bg-cbjjs-blue text-white px-8 py-3 rounded-xl font-bold shadow-lg">Próximo</button>
                ) : (
                    <button onClick={handleAvançarPortal} disabled={isSubmitting} className="w-full md:w-auto bg-cbjjs-blue text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center">
                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : 'Avançar para foto e documentação'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};