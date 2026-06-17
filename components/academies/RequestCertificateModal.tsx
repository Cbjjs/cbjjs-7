import React, { useState, useEffect } from 'react';
import { X, Check, Copy, CheckCircle, ChevronRight, QrCode, Building, MapPin, DollarSign, Loader2, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react';
import { Academy } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

interface RequestCertificateModalProps {
    academy: Academy;
    price: number;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        academy: Academy, 
        customerData: { name: string, email: string, taxId: string, phone: string }
    ) => Promise<any>;
    isSubmitting: boolean;
    onSuccess: () => void;
}

export const RequestCertificateModal: React.FC<RequestCertificateModalProps> = ({
    academy, price, isOpen, onClose, onConfirm, isSubmitting, onSuccess
}) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    
    // Dados do pagador
    const [payerName, setPayerName] = useState('');
    const [payerEmail, setPayerEmail] = useState('');
    const [payerCpf, setPayerCpf] = useState('');
    const [payerPhone, setPayerPhone] = useState('');

    // Dados de pagamento gerados
    const [paymentInfo, setPaymentInfo] = useState<{
        certificateId: string;
        pixId: string;
        pixCode: string;
        qrCodeBase64: string;
        amount: number;
    } | null>(null);

    const [copied, setCopied] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Preenche com os dados do usuário atual se disponíveis
    useEffect(() => {
        if (isOpen && user) {
            setPayerName(user.fullName || '');
            setPayerEmail(user.email || '');
            setPayerCpf(user.cpf || '');
            setPayerPhone(user.phone || '');
            setStep(1);
            setPaymentInfo(null);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!paymentInfo?.pixCode) return;
        navigator.clipboard.writeText(paymentInfo.pixCode);
        setCopied(true);
        addToast('success', 'Código PIX copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerifyPayment = async () => {
        if (!paymentInfo) return;
        setIsVerifying(true);
        try {
            const { data, error } = await supabase.functions.invoke('check-abacate-payment', {
                body: { 
                    pixId: paymentInfo.pixId, 
                    certificateId: paymentInfo.certificateId 
                }
            });

            if (error) throw error;

            if (data.status === 'PAID') {
                addToast('success', 'Pagamento do certificado confirmado com sucesso!');
                onSuccess();
                onClose();
            } else {
                addToast('info', 'O pagamento ainda consta como pendente. Se você já pagou, aguarde de 30 a 60 segundos para o banco processar.');
            }
        } catch (err: any) {
            addToast('error', 'Falha ao verificar pagamento. Tente novamente em instantes.');
            console.error(err);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            // Validações básicas
            if (!payerName.trim()) {
                addToast('error', 'O nome do pagador é obrigatório.');
                return;
            }
            if (!payerEmail.trim() || !payerEmail.includes('@')) {
                addToast('error', 'Digite um e-mail válido.');
                return;
            }
            if (!payerCpf.trim()) {
                addToast('error', 'O CPF é obrigatório.');
                return;
            }
            if (!payerPhone.trim()) {
                addToast('error', 'O telefone é obrigatório.');
                return;
            }

            const cleanCpf = payerCpf.replace(/\D/g, '');
            if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
                addToast('error', 'Digite um CPF ou CNPJ válido.');
                return;
            }

            const res = await onConfirm(academy, {
                name: payerName,
                email: payerEmail,
                taxId: payerCpf,
                phone: payerPhone
            });

            if (res && res.pixCode) {
                setPaymentInfo(res);
                setStep(2);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-[2.5rem] shadow-2xl flex flex-col border dark:border-slate-700 m-auto relative">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
                >
                    <X size={24}/>
                </button>

                <div className="p-8 md:p-10">
                    {step === 1 ? (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cbjjs-blue/10 rounded-2xl flex items-center justify-center text-cbjjs-blue">
                                    <Building size={24} />
                                </div>
                                <h2 className="text-xl font-black dark:text-white tracking-tight uppercase">Solicitar Certificado</h2>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                Confirme as informações da academia e do pagador para a emissão do certificado oficial.
                            </p>

                            <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-2xl space-y-3 border border-gray-100 dark:border-slate-700">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Academia / Equipe</label>
                                    <p className="text-base font-black dark:text-white">{academy.teamName || academy.name}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-cbjjs-blue mt-0.5 shrink-0" />
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Localização</label>
                                        <p className="text-xs font-bold dark:text-gray-300 leading-tight">
                                            {academy.address?.city} - {academy.address?.state}<br/>
                                            {academy.address?.street}, {academy.address?.number}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seção de Dados do Pagador */}
                            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-700">
                                <h3 className="text-xs font-black uppercase tracking-widest text-cbjjs-blue">Dados do Pagador</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
                                        <input 
                                            type="text" 
                                            value={payerName} 
                                            onChange={(e) => setPayerName(e.target.value)}
                                            placeholder="Nome do responsável"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cbjjs-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
                                        <input 
                                            type="email" 
                                            value={payerEmail} 
                                            onChange={(e) => setPayerEmail(e.target.value)}
                                            placeholder="exemplo@email.com"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cbjjs-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">CPF ou CNPJ</label>
                                        <input 
                                            type="text" 
                                            value={payerCpf} 
                                            onChange={(e) => setPayerCpf(e.target.value)}
                                            placeholder="Apenas números"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cbjjs-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Telefone / WhatsApp</label>
                                        <input 
                                            type="text" 
                                            value={payerPhone} 
                                            onChange={(e) => setPayerPhone(e.target.value)}
                                            placeholder="Apenas números com DDD"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cbjjs-blue"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-cbjjs-blue/5 rounded-2xl border border-cbjjs-blue/10">
                                <div className="flex items-center gap-3 text-cbjjs-blue">
                                    <DollarSign size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Taxa do Certificado</span>
                                </div>
                                <span className="text-lg font-black text-cbjjs-blue">{formatCurrency(price)}</span>
                            </div>

                            <button 
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="w-full bg-cbjjs-blue text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-75"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <ChevronRight size={18}/>}
                                {isSubmitting ? 'Gerando Pedido...' : 'Confirmar e Ir para Pagamento'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-green-600 dark:text-green-400">
                                    <CreditCard size={28} />
                                </div>
                                <h2 className="text-xl font-black dark:text-white uppercase">Pagamento do Certificado</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mt-1 uppercase tracking-wider">
                                    Escaneie o QR Code Pix abaixo para concluir.
                                </p>
                            </div>

                            <div className="bg-blue-900 p-6 rounded-3xl text-white w-full shadow-lg relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Valor a pagar</p>
                                <h4 className="text-3xl font-black">R$ {formatCurrency(price).replace('R$', '').trim()}</h4>
                            </div>

                            {paymentInfo?.qrCodeBase64 && (
                                <div className="flex flex-col items-center">
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-inner">
                                        <img 
                                            src={paymentInfo.qrCodeBase64} 
                                            alt="QR Code Pagamento" 
                                            className="w-44 h-44"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button 
                                    onClick={handleCopy}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                                        copied ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white border-2 border-transparent hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                                </button>

                                <button 
                                    onClick={handleVerifyPayment}
                                    disabled={isVerifying}
                                    className="w-full py-4 bg-cbjjs-blue hover:bg-blue-800 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-70"
                                >
                                    {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                    Já efetuei o pagamento
                                </button>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center gap-1.5 rounded-2xl">
                                <ShieldCheck size={14} className="text-green-500" />
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Pagamento Seguro • Processamento Instantâneo
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
