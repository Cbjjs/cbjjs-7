import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User, Mail, Smartphone, Fingerprint, Loader2, ArrowRight } from 'lucide-react';
import { formatCPF, formatPhone, validateCPF, validatePhone } from '../utils/validators';

interface BillingDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    email: string;
    taxId: string;
    phone: string;
  };
  onConfirm: (data: { name: string; email: string; taxId: string; phone: string }) => void;
  isLoading: boolean;
}

export const BillingDataModal: React.FC<BillingDataModalProps> = ({
  isOpen, onClose, initialData, onConfirm, isLoading
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincroniza apenas quando o modal abre ou os dados iniciais mudam, 
  // mas evita resetar se estiver em estado de carregamento
  useEffect(() => {
    if (isOpen && !isLoading) {
      setFormData(prev => ({
        ...initialData,
        // Mantém o que o usuário já digitou no telefone se o valor inicial for vazio
        phone: prev.phone || initialData.phone || ''
      }));
    }
  }, [isOpen, initialData.taxId, initialData.phone]);

  if (!isOpen) return null;

  const handleValidate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name.trim().length < 5) newErrors.name = "Nome completo obrigatório";
    if (!formData.email.includes('@')) newErrors.email = "Email inválido";
    if (!validateCPF(formData.taxId)) newErrors.taxId = "CPF inválido";
    if (!validatePhone(formData.phone)) newErrors.phone = "Telefone inválido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidate()) {
      onConfirm(formData);
    }
  };

  const inputClass = (hasError: boolean) => `
    w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none transition-all text-sm
    ${hasError ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-cbjjs-blue'}
    dark:text-white disabled:opacity-50
  `;

  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border dark:border-slate-700">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white" disabled={isLoading}>
          <X size={24} />
        </button>

        <div className="mb-8">
            <h3 className="text-2xl font-black dark:text-white tracking-tight">Dados de Faturamento</h3>
            <p className="text-sm text-gray-500 font-medium">Confirme os dados para geração do seu PIX oficial.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className={labelClass}>Nome Completo</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      className={inputClass(!!errors.name)} 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Seu nome"
                      disabled={isLoading}
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Email de Contato</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      className={inputClass(!!errors.email)} 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="seu@email.com"
                      disabled={isLoading}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>CPF</label>
                    <div className="relative">
                        <Fingerprint className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                          className={inputClass(!!errors.taxId)} 
                          value={formData.taxId} 
                          onChange={e => setFormData({...formData, taxId: formatCPF(e.target.value)})} 
                          placeholder="000.000.000-00" 
                          maxLength={14}
                          disabled={isLoading}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>WhatsApp / Celular</label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                          className={inputClass(!!errors.phone)} 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                          placeholder="(00) 00000-0000" 
                          maxLength={15}
                          disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-6 bg-cbjjs-blue text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                Confirmar e Gerar PIX
            </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-8 text-gray-400">
            <ShieldCheck size={14} className="text-green-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Garantia de segurança CBJJS</p>
        </div>
      </div>
    </div>
  );
};