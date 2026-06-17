import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, DocumentStatus, PaymentStatus, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Save, RefreshCw, Smartphone, Printer, MessageCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';
import { PaymentInviteModal, PaymentPlanOption } from '../components/PaymentInviteModal';
import { BillingDataModal } from '../components/BillingDataModal';
import { GraduationHistory } from '../components/GraduationHistory';
import { fetchAddressByZip } from '../utils/address';

// Sub-componentes refatorados
import { FederationStatusSection } from '../components/profile/FederationStatusSection';
import { DocumentsSection } from '../components/profile/DocumentsSection';
import { PersonalInfoSection } from '../components/profile/PersonalInfoSection';
import { AcademySection } from '../components/profile/AcademySection';
import { ChangeAcademyModal } from '../components/profile/ChangeAcademyModal';

export const Profile: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const { addToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [loadingZip, setLoadingZip] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isChangeAcademyModalOpen, setIsChangeAcademyModalOpen] = useState(false);
  
  const [availablePlans, setAvailablePlans] = useState<PaymentPlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanOption | null>(null);
  const [paymentData, setPaymentData] = useState({ pixId: '', pixCode: '', qrCodeBase64: '', amount: '0,00' });
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
        const { data } = await supabase.from('system_settings').select('*').like('key', 'plan_%');
        const getVal = (k: string, def: string) => data?.find(s => s.key === k)?.value || def;

        const plans: PaymentPlanOption[] = [];
        
        if (getVal('plan_digital_active', 'true') === 'true') {
            plans.push({
                id: 'DIGITAL',
                title: 'Versão Digital',
                price: parseFloat(getVal('plan_digital_price', '30.00')),
                description: 'Tenha seu cadastro na CBJJS com carterinha digital disponível no menu Minha carteirinha.',
                icon: Smartphone,
                color: 'blue'
            });
        }

        if (getVal('plan_printed_active', 'true') === 'true') {
            plans.push({
                id: 'PRINTED',
                title: 'Versão Impressa',
                price: parseFloat(getVal('plan_printed_price', '35.00')),
                description: 'Tenha seu cadastro na CBJJS com carterinha digital e versão IMPRESSA para você.',
                icon: Printer,
                color: 'green',
                featured: true
            });
        }
        setAvailablePlans(plans);
    };
    fetchPlans();

    const params = new URLSearchParams(window.location.search);
    if (params.get('show_payment') === 'true' && user?.paymentStatus !== PaymentStatus.PAID) {
        setIsInviteModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  if (!user) return null;

  // LÓGICA DE APROVAÇÃO: Agora exige obrigatoriamente que a ACADEMIA esteja aprovada (RegistrationStatus.APPROVED)
  const isAcademyApproved = user.academy?.status === RegistrationStatus.APPROVED;
  
  const isFederationApproved = user.isFederationApproved || (
    isAcademyApproved &&
    user.documents.identity.status === DocumentStatus.APPROVED && 
    user.documents.profile?.status === DocumentStatus.APPROVED &&
    user.documents.medical?.status === DocumentStatus.APPROVED &&
    user.documents.belt?.status === DocumentStatus.APPROVED &&
    user.paymentStatus === PaymentStatus.PAID
  );

  const handleZipLookup = async (zip: string) => {
    const cleanZip = zip.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      setLoadingZip(true);
      const addressData = await fetchAddressByZip(cleanZip);
      setLoadingZip(false);
      if (addressData) {
        setEditForm(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            zip: cleanZip.replace(/^(\d{5})(\d)/, '$1-$2'),
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            complement: addressData.complement || prev.address?.complement || ''
          }
        }));
      }
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
        const wasAcademyChanged = editForm.academyId && editForm.academyId !== user.academyId;
        
        await updateUser(editForm);
        
        if (wasAcademyChanged) {
            addToast('success', "Academia alterada! Seu perfil agora aguarda aprovação do novo professor.");
            setIsEditing(false);
            await refreshProfile();
        } else {
            addToast('success', "Perfil atualizado!");
            setIsEditing(false);
        }
    } catch (error: any) { 
        addToast('error', error.message); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  const handleQuickAcademyChange = async (academyId: string, academyName: string) => {
      setIsSubmitting(true);
      try {
          await updateUser({ academyId });
          addToast('success', `Unidade alterada para "${academyName}" com sucesso!`);
          setIsChangeAcademyModalOpen(false);
          await refreshProfile();
      } catch (error: any) {
          addToast('error', error.message || "Erro ao trocar academia.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleManualPaymentCheck = async () => {
      setIsCheckingPayment(true);
      try {
          await refreshProfile();
          await new Promise(r => setTimeout(r, 1500));
          const { data } = await supabase.from('profiles').select('payment_status').eq('id', user.id).single();
          
          if (data?.payment_status === 'PAID') {
              addToast('success', "Pagamento identificado com sucesso!");
          } else {
              addToast('info', "Pagamento ainda não foi realizado ou está em processamento.");
          }
      } catch (err) {
          addToast('error', "Falha ao sincronizar dados. Tente novamente.");
      } finally {
          setIsCheckingPayment(false);
      }
  };

  const onInvitePay = (plan: PaymentPlanOption) => {
      setSelectedPlan(plan);
      setIsInviteModalOpen(false);
      setIsBillingModalOpen(true);
  };

  const handleGeneratePix = async (billingData: { name: string, email: string, taxId: string, phone: string }) => {
      if (!selectedPlan) return;
      setIsGeneratingPayment(true);
      try {
          if (!user.phone || user.phone !== billingData.phone) {
              await supabase.from('profiles').update({ phone: billingData.phone }).eq('id', user.id);
          }

          const { data, error } = await supabase.functions.invoke('create-abacate-billing', {
              body: { 
                  amount: selectedPlan.price, 
                  plan: selectedPlan.id,
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
      } catch (error: any) {
          addToast('error', error.message || 'Erro ao gerar cobrança.');
      } finally { setIsGeneratingPayment(false); }
  };

  const getWhatsAppLink = () => {
    const text = encodeURIComponent(`Olá, estou tendo dificuldades em confirmar meu pagamento, meu email é ${user.email}`);
    return `https://wa.me/5521988649788?text=${text}`;
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-20 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Meu Cadastro</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Mantenha seus dados sempre atualizados.</p>
         </div>
         <div className="flex flex-wrap gap-3">
             {!isEditing ? (
                 <button onClick={() => {
                    setEditForm({
                        fullName: user.fullName, email: user.email, cpf: user.cpf, phone: user.phone, dob: user.dob,
                        nationality: user.nationality, address: user.address ? { ...user.address } : { zip: '', street: '', city: '', state: '', number: '', complement: '' },
                        athleteData: { ...user.athleteData! },
                        academyId: user.academyId
                    });
                    setIsEditing(true);
                 }} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
                     <RefreshCw size={16} /> Atualizar Perfil
                 </button>
             ) : (
                 <>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-500 text-sm">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-cbjjs-green text-white rounded-xl font-bold shadow hover:bg-green-700 text-sm">
                        <Save size={16} /> {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                 </>
             )}
         </div>
      </div>

      {/* AVISO DE ACADEMIA PENDENTE */}
      {!isAcademyApproved && user.academyId && (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-2xl flex items-start gap-4 animate-fadeIn shadow-sm">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-600">
                  <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                  <h4 className="font-black text-amber-800 dark:text-amber-200 uppercase text-xs tracking-widest mb-1">Aguardando Professor</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                      Você vinculou seu perfil à unidade <span className="font-bold">"{user.academy?.name}"</span>. 
                      O professor responsável precisa aprovar sua entrada para que sua filiação seja validada.
                  </p>
                  <button 
                    onClick={() => setIsChangeAcademyModalOpen(true)}
                    className="mt-3 text-xs font-black text-cbjjs-blue hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 transition-all group"
                  >
                      Deseja alterar academia? 
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
            <FederationStatusSection 
              user={user} 
              isFederationApproved={isFederationApproved} 
              onPayClick={() => setIsInviteModalOpen(true)}
              onCheckPayment={handleManualPaymentCheck}
              isCheckingPayment={isCheckingPayment}
            />

            <AcademySection 
              user={user}
              isEditing={isEditing}
              selectedAcademyId={editForm.academyId}
              onAcademyChange={(id) => setEditForm(prev => ({ ...prev, academyId: id }))}
            />

            <DocumentsSection user={user} />
        </div>

        <div className="lg:col-span-2 space-y-6">
            <PersonalInfoSection 
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              onEditChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
              loadingZip={loadingZip}
              onZipChange={handleZipLookup}
            />
            <GraduationHistory 
                athleteData={isEditing ? editForm.athleteData : user.athleteData} 
                isEditing={isEditing}
                onUpdate={(updates) => setEditForm(prev => ({ ...prev, athleteData: { ...prev.athleteData!, ...updates } }))}
            />
        </div>
      </div>

      {user.paymentStatus !== PaymentStatus.PAID && (
          <a 
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-10 right-8 z-[100] flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Suporte Financeiro</span>
                <span className="text-sm font-bold whitespace-nowrap">Problemas para confirmar pagamento?</span>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle size={24} fill="currentColor" className="text-white" />
            </div>
          </a>
      )}

      <ChangeAcademyModal 
        isOpen={isChangeAcademyModalOpen}
        onClose={() => setIsChangeAcademyModalOpen(false)}
        currentAcademyName={user.academy?.name}
        onConfirm={handleQuickAcademyChange}
        isSubmitting={isSubmitting}
      />

      <PaymentInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onPay={onInvitePay} isLoading={false} availablePlans={availablePlans} />
      
      <BillingDataModal 
        isOpen={isBillingModalOpen} 
        onClose={() => setIsBillingModalOpen(false)} 
        initialData={{ name: user.fullName, email: user.email, taxId: user.cpf || '', phone: user.phone || '' }} 
        onConfirm={handleGeneratePix} 
        isLoading={isGeneratingPayment}
      />

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} pixId={paymentData.pixId} pixCode={paymentData.pixCode} qrCodeBase64={paymentData.qrCodeBase64} amount={paymentData.amount} onSuccess={() => refreshProfile()} />
    </div>
  );
};