import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Belt, Role, Academy } from '../types';
import { validateCPF, formatCPF } from '../utils/validators';
import { fetchAddressByZip } from '../utils/address';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function useOnboarding() {
  const { saveOnboardingProgress, user } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [cpfError, setCpfError] = useState('');
  const [loadingZip, setLoadingZip] = useState(false);
  
  const [academiesList, setAcademiesList] = useState<Academy[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState({
    nationality: 'Brasil',
    cpf: '',
    dob: user?.dob || '', // CORREÇÃO: Inicializa com a data do usuário se existir
    gender: 'Masculino',
    zip: '',
    street: '',
    city: '',
    state: '',
    number: '',
    complement: '',
    belt: Belt.WHITE,
    selectedAcademyId: '',
    selectedAcademyName: '',
  });

  const fetchAcademies = useCallback(async (reset = false) => {
    setLoadingAcademies(true);
    try {
        const from = reset ? 0 : page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        // Filtro .eq('deleted', 'no') adicionado
        let query = supabase.from('academies')
            .select('*')
            .eq('status', 'APPROVED')
            .eq('deleted', 'no')
            .range(from, to)
            .order('name', { ascending: true });
            
        if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
        const { data, error } = await query;
        if (error) throw error;
        if (data) {
            setAcademiesList(prev => reset ? (data as any) : [...prev, ...data as any]);
            if (reset) setPage(1);
            else setPage(prev => prev + 1);
        }
    } catch (error) { console.error(error); } finally { setLoadingAcademies(false); }
  }, [page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAcademies(true), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChange = (field: string, value: any) => {
    if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
    if (field === 'cpf') {
        const f = formatCPF(value);
        setFormData(p => ({ ...p, cpf: f }));
        if (value.replace(/\D/g, '').length === 11) {
            if (!validateCPF(value)) setCpfError('CPF inválido'); else setCpfError('');
        } else setCpfError('');
    } else if (field === 'zip') {
        const z = value.replace(/\D/g, '').slice(0, 8);
        setFormData(p => ({ ...p, zip: z.replace(/^(\d{5})(\d)/, '$1-$2') }));
        if (z.length === 8) handleZipBlur(z);
    } else setFormData(p => ({ ...p, [field]: value }));
  };

  const handleZipBlur = async (zip: string) => {
    setLoadingZip(true);
    const addr = await fetchAddressByZip(zip);
    setLoadingZip(false);
    if (addr) setFormData(p => ({ ...p, street: addr.street, city: addr.city, state: addr.state, complement: addr.complement || '' }));
  };

  const validateStep = (s: number) => {
      const e: {[key: string]: string} = {};
      let v = true;
      if (s === 1) {
          if (!formData.nationality) { e.nationality = 'Obrigatório'; v = false; }
          if (!formData.dob) { e.dob = 'Obrigatório'; v = false; }
          if (formData.cpf.replace(/\D/g, '').length !== 11 || !validateCPF(formData.cpf)) { e.cpf = 'CPF inválido'; v = false; }
          if (formData.zip.replace(/\D/g, '').length !== 8) { e.zip = 'CEP inválido'; v = false; }
          if (!formData.street) { e.street = 'Obrigatório'; v = false; }
          if (!formData.city) { e.city = 'Obrigatório'; v = false; }
          if (!formData.number) { e.number = 'Obrigatório'; v = false; }
      } else if (s === 3) {
          if (!formData.selectedAcademyId) { e.selectedAcademyId = 'Obrigatório'; v = false; }
      }
      if (!v) { setErrors(e); addToast('error', "Preencha os campos obrigatórios."); }
      return v;
  };

  const handleAvançarPortal = async () => { 
      if (validateStep(3)) {
          setIsSubmitting(true);
          try {
              let role = [Belt.PURPLE, Belt.BROWN, Belt.BLACK, Belt.BLACK_1, Belt.BLACK_2, Belt.BLACK_3, Belt.BLACK_4, Belt.BLACK_5, Belt.BLACK_6, Belt.RED_BLACK, Belt.RED_WHITE, Belt.RED].includes(formData.belt) ? Role.PROFESSOR : Role.STUDENT;
              await saveOnboardingProgress({
                  role, nationality: formData.nationality, cpf: formData.cpf, gender: formData.gender, dob: formData.dob,
                  address: { zip: formData.zip, street: formData.street, city: formData.city, state: formData.state, number: formData.number, complement: formData.complement },
                  athleteData: { belt: formData.belt },
                  selectedAcademyId: formData.selectedAcademyId
              });
              
              window.location.href = `/upload-student-docs.html?id=${user?.id}`;
          } catch (err: any) { addToast('error', err.message); setIsSubmitting(false); }
      }
  };

  return {
    step, setStep, formData, handleChange, cpfError, loadingZip, academiesList, loadingAcademies, searchTerm, setSearchTerm, isSubmitting, errors, validateStep, handleAvançarPortal
  };
}