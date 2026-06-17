import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dependent, Belt, PaymentStatus, Academy } from '../types';
import { fetchAddressByZip } from '../utils/address';
import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function useMyDependents() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAILS'>('LIST');
    const [selectedChild, setSelectedChild] = useState<Dependent | null>(null);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingZip, setLoadingZip] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isTermAccepted, setIsTermAccepted] = useState(false);
    
    const [formData, setFormData] = useState({
        fullName: '', dob: '', cpf: '', nationality: 'Brasil', 
        belt: Belt.WHITE, academyId: '', academyName: '',
        zip: '', street: '', city: '', state: '', number: '', complement: ''
    });
    
    const [academiesList, setAcademiesList] = useState<Academy[]>([]);
    const [loadingAcademies, setLoadingAcademies] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [ageWarning, setAgeWarning] = useState(false);

    const { data: queryData, isLoading, isError, refetch } = useSupabaseQuery<Dependent[]>(
        ['my-dependents', user?.id],
        async (signal) => {
            const { data, error } = await supabase
                .from('dependents')
                .select('*, academies(name, phone)')
                .eq('parent_id', user!.id)
                .order('created_at', { ascending: false })
                .abortSignal(signal!);

            if (error) return { data: null, error };
            
            const mapped = (data || []).map((d: any) => ({
                ...d,
                fullName: d.full_name,
                dob: d.dob,
                federationId: d.federation_id,
                profileImageUrl: d.profile_image_url,
                academyStatus: d.academy_status,
                paymentStatus: d.payment_status,
                belt: d.belt as Belt,
                academyName: d.academies?.name,
                academyPhone: d.academies?.phone,
                documents: {
                    identity: { status: d.doc_identity_status, url: d.doc_identity_url, rejectionReason: d.doc_identity_reason },
                    medical: { status: d.doc_medical_status, url: d.doc_medical_url, rejectionReason: d.doc_medical_reason },
                    belt: { status: d.doc_belt_status, url: d.doc_belt_url, rejectionReason: d.doc_belt_reason },
                    profile: { status: d.doc_profile_status, url: d.profile_image_url, rejectionReason: d.doc_profile_reason }
                }
            }));

            return { data: mapped as any, error: null };
        },
        { enabled: !!user?.id }
    );

    const fetchAcademies = useCallback(async () => {
        setLoadingAcademies(true);
        try {
            let query = supabase.from('academies').select('*').eq('status', 'APPROVED').order('name', { ascending: true });
            if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
            const { data, error } = await query;
            if (error) throw error;
            setAcademiesList(data as any || []);
        } catch (error) { console.error(error); } finally { setLoadingAcademies(false); }
    }, [searchTerm]);

    useEffect(() => {
        if (view === 'CREATE' && step === 4) fetchAcademies();
    }, [view, step, fetchAcademies]);

    const handleDobChange = (dob: string) => {
        setFormData(p => ({ ...p, dob }));
        if (dob.length === 10) {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setAgeWarning(age >= 18);
        } else setAgeWarning(false);
    };

    const handleZipLookup = async (zip: string) => {
        const cleanZip = zip.replace(/\D/g, '');
        if (cleanZip.length === 8) {
            setLoadingZip(true);
            const addressData = await fetchAddressByZip(cleanZip);
            setLoadingZip(false);
            if (addressData) {
                setFormData(prev => ({
                    ...prev,
                    zip: cleanZip.replace(/^(\d{5})(\d)/, '$1-$2'),
                    street: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    complement: addressData.complement || prev.complement || ''
                }));
            }
        }
    };

    const handleCreateDependent = async () => {
        if (!user || ageWarning || !isTermAccepted) return;
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('dependents').insert([{
                parent_id: user.id,
                full_name: formData.fullName,
                dob: formData.dob,
                cpf: formData.cpf,
                nationality: formData.nationality,
                address: { zip: formData.zip, street: formData.street, city: formData.city, state: formData.state, number: formData.number, complement: formData.complement },
                belt: formData.belt,
                academy_id: formData.academyId,
                academy_status: 'PENDING',
                payment_status: 'PENDING'
            }]).select().single();
            if (error) throw error;
            addToast('success', "Filho cadastrado com sucesso!");
            refetch();
            window.location.href = `/upload-dependent-docs.html?id=${data.id}`;
        } catch (err: any) { addToast('error', err.message); } finally { setIsSubmitting(false); }
    };

    const handleSaveEdit = async () => {
        if (!selectedChild) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('dependents').update({
                full_name: formData.fullName,
                dob: formData.dob,
                cpf: formData.cpf,
                nationality: formData.nationality,
                address: { zip: formData.zip, street: formData.street, city: formData.city, state: formData.state, number: formData.number, complement: formData.complement },
                belt: formData.belt
            }).eq('id', selectedChild.id);
            if (error) throw error;
            addToast('success', "Cadastro atualizado!");
            setIsEditing(false);
            refetch();
        } catch (err: any) { addToast('error', err.message); } finally { setIsSubmitting(false); }
    };

    return {
        myChildren: queryData?.data || [],
        isLoading,
        isError,
        view,
        setView,
        selectedChild,
        setSelectedChild,
        step,
        setStep,
        isSubmitting,
        loadingZip,
        isEditing,
        setIsEditing,
        formData,
        setFormData,
        academiesList,
        loadingAcademies,
        searchTerm,
        setSearchTerm,
        ageWarning,
        handleDobChange,
        handleZipLookup,
        handleCreateDependent,
        handleSaveEdit,
        refetch,
        isTermAccepted,
        setIsTermAccepted
    };
}