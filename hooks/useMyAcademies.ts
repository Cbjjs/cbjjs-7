import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Academy } from '../types';
import { academyService } from '../services/academyService';
import { useToast } from '../context/ToastContext';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { validateCPF, validatePhone } from '../utils/validators';
import { fetchAddressByZip } from '../utils/address';

export function useMyAcademies() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Estados de UI
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [loadingZip, setLoadingZip] = useState(false);
  
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
      teamName: '', responsibleCpf: '', cnpj: '', phone: '',
      zip: '', street: '', city: '', state: '', number: '', complement: ''
  });

  // Busca de Dados
  const { data: queryData, isLoading, isError, refetch } = useSupabaseQuery<Academy[]>(
    ['my-academies', user?.id],
    async (signal) => {
        if (!user?.id) return { data: [], error: null };
        try {
            const data = await academyService.getMyAcademies(user.id, signal);
            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err };
        }
    },
    { enabled: !!user?.id }
  );

  const handleZipLookup = async (zip: string) => {
    const cleanZip = zip.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      setLoadingZip(true);
      const addressData = await fetchAddressByZip(cleanZip);
      setLoadingZip(false);
      if (addressData) {
        setFormData(prev => ({
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

  const validateStep = (currentStep: number) => {
    const errors: Record<string, boolean> = {};
    let isValid = true;
    if (currentStep === 1) {
        if (!formData.teamName.trim()) { errors.teamName = true; isValid = false; }
        if (!validateCPF(formData.responsibleCpf)) { errors.responsibleCpf = true; isValid = false; }
        if (!validatePhone(formData.phone)) { errors.phone = true; isValid = false; }
    } else if (currentStep === 2) {
        if (formData.zip.replace(/\D/g, '').length !== 8) { errors.zip = true; isValid = false; }
        if (!formData.state) { errors.state = true; isValid = false; }
        if (!formData.street.trim()) { errors.street = true; isValid = false; }
        if (!formData.city.trim()) { errors.city = true; isValid = false; }
        if (!formData.number.trim()) { errors.number = true; isValid = false; }
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmitNew = async () => {
    if (!user || !validateStep(2)) return;
    setIsSubmitting(true);
    try {
        await academyService.createAcademy(user.id, formData);
        addToast('success', "Academia registrada! Agora envie os documentos.");
        queryClient.invalidateQueries({ queryKey: ['my-academies'] });
        setView('LIST'); setStep(1);
    } catch (error: any) {
        addToast('error', error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedAcademy) return;
    setIsSubmitting(true);
    try {
        await academyService.updateAcademyData(selectedAcademy.id, formData);
        addToast('success', "Dados atualizados!");
        queryClient.invalidateQueries({ queryKey: ['my-academies'] });
        setIsEditing(false); setSelectedAcademy(null);
    } catch (err: any) {
        addToast('error', err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
      setStep(1);
      setView('CREATE');
      setFormErrors({});
      setFormData({ 
          teamName: '', responsibleCpf: '', cnpj: '', phone: '', 
          zip: '', street: '', city: '', state: '', number: '', complement: '' 
      });
  };

  const startEditing = (academy: Academy) => {
      setFormData({ 
          teamName: academy.name, 
          responsibleCpf: academy.responsibleCpf || '', 
          cnpj: academy.cnpj || '', 
          phone: academy.phone || '', 
          zip: academy.address?.zip || '', 
          street: academy.address?.street || '', 
          city: academy.address?.city || '', 
          state: academy.address?.state || '', 
          number: academy.address?.number || '', 
          complement: academy.address?.complement || '' 
      });
      setIsEditing(true);
      setFormErrors({});
  };

  return {
    academies: queryData?.data || [],
    isLoading,
    isError,
    view,
    setView,
    isSubmitting,
    selectedAcademy,
    setSelectedAcademy,
    isEditing,
    setIsEditing,
    step,
    setStep,
    loadingZip,
    formErrors,
    formData,
    setFormData,
    handleZipLookup,
    validateStep,
    handleSubmitNew,
    handleSaveUpdate,
    resetForm,
    startEditing,
    refetch
  };
}