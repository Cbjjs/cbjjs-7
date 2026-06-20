import { useState, useEffect } from 'react';
import { certificateService } from '../services/certificateService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Academy, AcademyCertificate } from '../types';
import { supabase } from '../lib/supabase';

export const useAcademyCertificates = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [price, setPrice] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [myCertificates, setMyCertificates] = useState<AcademyCertificate[]>([]);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const p = await certificateService.getCertificatePrice();
                setPrice(p);
            } catch (err) {
                console.error('Erro ao buscar preço do certificado:', err);
            }
        };

        if (user) {
            fetchPrice();
            fetchMyCertificates();
        }
    }, [user]);

    const fetchMyCertificates = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const certs = await certificateService.getMyCertificates(user.id);
            setMyCertificates(certs);
        } catch (err) {
            console.error('Erro ao buscar meus certificados:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (
        academy: Academy, 
        customerData: { name: string, email: string, taxId: string, phone: string }
    ) => {
        if (!user) return null;
        setIsRequesting(true);
        try {
            // 1. Criar a solicitação de certificado no banco local (PENDING) com o WhatsApp informado
            const cert = await certificateService.requestCertificate(academy.id, user.id, price, customerData.phone);
            
            // 2. Chamar a Edge Function do Supabase para criar a cobrança no AbacatePay V2
            const { data, error } = await supabase.functions.invoke('create-abacate-billing', {
                body: { 
                    amount: price, 
                    certificateId: cert.id,
                    customerData: customerData
                }
            });

            if (error) throw error;

            // 3. Atualizar a solicitação do certificado com o ID de cobrança (billing_id) retornado do AbacatePay
            if (data?.data?.id) {
                await supabase
                    .from('academy_certificates')
                    .update({ billing_id: data.data.id })
                    .eq('id', cert.id);
            }

            addToast('success', 'Solicitação de certificado enviada! Gerando PIX...');
            fetchMyCertificates();

            return {
                certificateId: cert.id,
                pixId: data?.data?.id || '',
                pixCode: data?.data?.brCode || '',
                qrCodeBase64: data?.data?.brCodeBase64 || '',
                amount: price
            };
        } catch (err: any) {
            addToast('error', 'Erro ao processar solicitação de certificado. Tente novamente.');
            console.error(err);
            return null;
        } finally {
            setIsRequesting(false);
        }
    };

    return {
        price,
        loading,
        isRequesting,
        myCertificates,
        handleRequest,
        fetchMyCertificates
    };
};
