import React, { useState, useRef } from 'react';
import {
    RefreshCw,
    Search,
    CheckCircle,
    Clock,
    Package,
    Truck,
    Building,
    User,
    Calendar,
    DollarSign,
    Loader2,
    X,
    ChevronDown
} from 'lucide-react';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { certificateService } from '../services/certificateService';
import { AcademyCertificate, CertificatePaymentStatus, CertificateDeliveryStatus } from '../types';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { formatCurrency, formatDateBR as formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const AdminAcademyCertificates: React.FC = () => {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'NEW' | 'DELIVERED' | 'CANCELLED'>('NEW');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const { data: certsData, isLoading, refetch } = useSupabaseQuery<AcademyCertificate[]>(
        ['admin-certificates'],
        async () => {
            try {
                const data = await certificateService.getAllCertificates();
                return { data, error: null };
            } catch (error) {
                return { data: [], error };
            }
        }
    );

    const certificates = certsData?.data || [];

    const paidCertificates = certificates.filter(c => {
        const isPaid = c.statusPayment === CertificatePaymentStatus.PAID;
        if (!selectedDate) return isPaid;
        const d = new Date(c.createdAt);
        return isPaid && d.toISOString().split('T')[0] === selectedDate;
    });
    const totalPaidCount = paidCertificates.length;
    const totalSalesAmount = paidCertificates.reduce((sum, c) => sum + (c.amount || 0), 0);

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch =
            cert.academy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.owner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const d = new Date(cert.createdAt);
        const matchesDate = !selectedDate || d.toISOString().split('T')[0] === selectedDate;

        if (activeTab === 'NEW') {
            return matchesSearch && matchesDate &&
                   cert.statusDelivery !== CertificateDeliveryStatus.DELIVERED &&
                   cert.statusDelivery !== CertificateDeliveryStatus.CANCELLED;
        } else if (activeTab === 'DELIVERED') {
            return matchesSearch && matchesDate && cert.statusDelivery === CertificateDeliveryStatus.DELIVERED;
        } else {
            return matchesSearch && matchesDate && cert.statusDelivery === CertificateDeliveryStatus.CANCELLED;
        }
    });

    const handleUpdateStatus = async (id: string, status: CertificateDeliveryStatus) => {
        setUpdatingId(id);
        try {
            await certificateService.updateDeliveryStatus(id, status);
            addToast('success', 'Status atualizado com sucesso!');
            refetch();
        } catch (err) {
            addToast('error', 'Falha ao atualizar status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStyles = (paymentStatus: CertificatePaymentStatus, deliveryStatus: CertificateDeliveryStatus) => {
        let paymentBadge = '';
        let deliveryBadge = '';

        if (paymentStatus === CertificatePaymentStatus.PAID) {
            paymentBadge = 'bg-green-100 text-green-700 border-green-200';
        } else if (paymentStatus === CertificatePaymentStatus.PENDING) {
            paymentBadge = 'bg-amber-100 text-amber-700 border-amber-200';
        } else if (paymentStatus === CertificatePaymentStatus.CANCELLED) {
            paymentBadge = 'bg-red-50 text-red-600 border-red-100';
        } else {
            paymentBadge = 'bg-red-100 text-red-700 border-red-200';
        }

        if (deliveryStatus === CertificateDeliveryStatus.DELIVERED) {
            deliveryBadge = 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (deliveryStatus === CertificateDeliveryStatus.PRODUCING) {
            deliveryBadge = 'bg-indigo-100 text-indigo-700 border-indigo-200';
        } else if (deliveryStatus === CertificateDeliveryStatus.CANCELLED) {
            deliveryBadge = 'bg-red-100 text-red-700 border-red-200';
        } else {
            deliveryBadge = 'bg-gray-100 text-gray-700 border-gray-200';
        }

        return { paymentBadge, deliveryBadge };
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'PENDING': return 'Pendente';
            case 'PAID': return 'Pago';
            case 'OVERDUE': return 'Atrasado';
            case 'WAITING_PAYMENT': return 'Aguardando Pagamento';
            case 'PRODUCING': return 'Produzindo';
            case 'DELIVERED': return 'Entregue';
            case 'CANCELLED': return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black dark:text-white tracking-tight">Certificados Academias</h2>
                    <p className="text-sm text-gray-500 font-medium">Gestão de pedidos e entregas de certificados.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-cbjjs-blue transition-all dark:text-white"
                        />
                    </div>
                    <div className="relative shrink-0">
                        {/* Estilo para garantir que o clique no input acione o calendário nativo em iframes */}
                        <style>{`
                            .date-input-overlay::-webkit-calendar-picker-indicator {
                                position: absolute;
                                left: 0; top: 0; width: 100%; height: 100%;
                                margin: 0; padding: 0;
                                cursor: pointer;
                                opacity: 0;
                            }
                        `}</style>
                        
                        {/* Input que recebe o clique real (sobrepondo tudo) */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="date-input-overlay absolute inset-0 opacity-0 w-full h-full z-20 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                        />

                        {/* Visual Pill Button (z-10) */}
                        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-sm transition-all group-hover:border-cbjjs-blue">
                            <div className="relative">
                                <Calendar className={`${selectedDate ? 'text-cbjjs-blue' : 'text-gray-400'}`} size={20} />
                                {selectedDate && <div className="absolute -top-1 -right-1 w-2 h-2 bg-cbjjs-blue rounded-full border-2 border-white dark:border-slate-800"></div>}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedDate && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedDate(''); }}
                                        className="relative z-30 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-all active:scale-90"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <ChevronDown className="text-gray-400" size={16} />
                            </div>
                        </div>
                    </div>
                    <button onClick={() => refetch()} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl hover:bg-gray-50 transition-all text-cbjjs-blue shadow-sm shrink-0 flex items-center justify-center">
                        <RefreshCw size={22} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pedidos Pagos</span>
                        <p className="text-2xl font-black dark:text-white">{totalPaidCount}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-cbjjs-blue/5 rounded-2xl flex items-center justify-center text-cbjjs-blue">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total em Vendas</span>
                        <p className="text-2xl font-black dark:text-white">{formatCurrency(totalSalesAmount)}</p>
                    </div>
                </div>
            </div>

            <div className="flex w-full md:w-fit p-1.5 bg-gray-100 dark:bg-slate-900 rounded-2xl">
                <button
                    onClick={() => setActiveTab('NEW')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-white dark:bg-slate-800 text-cbjjs-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Novos
                </button>
                <button
                    onClick={() => setActiveTab('DELIVERED')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'DELIVERED' ? 'bg-white dark:bg-slate-800 text-cbjjs-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Entregues
                </button>
                <button
                    onClick={() => setActiveTab('CANCELLED')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'CANCELLED' ? 'bg-white dark:bg-slate-800 text-cbjjs-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Cancelados
                </button>
            </div>

            {isLoading ? <AdminListSkeleton /> : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredCertificates.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700">
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum pedido encontrado</p>
                        </div>
                    ) : (
                        filteredCertificates.map(cert => {
                            const { paymentBadge, deliveryBadge } = getStatusStyles(cert.statusPayment, cert.statusDelivery);
                            return (
                                <div key={cert.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-cbjjs-blue/5 rounded-2xl flex items-center justify-center text-cbjjs-blue group-hover:scale-110 transition-transform">
                                                    <Building size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black dark:text-white uppercase leading-none mb-1">{cert.academy?.name}</h3>
                                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                                        <User size={14} className="text-cbjjs-blue" />
                                                        {cert.owner?.fullName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Data do Pedido</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold dark:text-gray-300">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {formatDate(cert.createdAt)}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Valor Pago</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold dark:text-gray-300">
                                                        <DollarSign size={14} className="text-cbjjs-green" />
                                                        {formatCurrency(cert.amount)}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status Pag.</span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${paymentBadge}`}>
                                                        {getStatusLabel(cert.statusPayment)}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Entrega</span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${deliveryBadge}`}>
                                                        {cert.statusDelivery === CertificateDeliveryStatus.PRODUCING ? <Package size={12} className="mr-1.5 animate-pulse" /> : 
                                                         cert.statusDelivery === CertificateDeliveryStatus.DELIVERED ? <CheckCircle size={12} className="mr-1.5" /> : 
                                                         <Clock size={12} className="mr-1.5" />}
                                                        {getStatusLabel(cert.statusDelivery)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center shrink-0 gap-3">
                                            {cert.statusDelivery !== CertificateDeliveryStatus.DELIVERED &&
                                             cert.statusDelivery !== CertificateDeliveryStatus.CANCELLED && (
                                                <>
                                                    {cert.statusDelivery === CertificateDeliveryStatus.WAITING_PAYMENT && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(cert.id, CertificateDeliveryStatus.CANCELLED)}
                                                            disabled={updatingId === cert.id}
                                                            className="w-full md:w-auto px-6 py-3.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-red-100"
                                                        >
                                                            {updatingId === cert.id ? <Loader2 className="animate-spin" size={14}/> : <X size={16}/>}
                                                            Cancelar Pedido
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleUpdateStatus(cert.id, CertificateDeliveryStatus.DELIVERED)}
                                                        disabled={updatingId === cert.id}
                                                        className="w-full md:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-cbjjs-blue"
                                                    >
                                                        {updatingId === cert.id ? <Loader2 className="animate-spin" size={14}/> : <Truck size={16}/>}
                                                        Marcar como Entregue
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};