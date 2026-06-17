import { useState, useMemo } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { idCardService, AcademyStats } from '../services/idCardService';
import { useToast } from '../context/ToastContext';
import { User } from '../types';

export function useAdminIDCardsDetail(academy: AcademyStats) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState<'ALL' | 'PRINTED'>('ALL'); // Novo estado de filtro
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [previewUser, setPreviewUser] = useState<User | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data: athletesData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<User[]>(
        ['admin-printing-athletes', academy.id],
        async () => {
            try {
                const data = await idCardService.getAcademyAthletesForPrinting(academy.id);
                return { data, error: null };
            } catch (err: any) {
                return { data: null, error: err };
            }
        }
    );

    const athletes = athletesData?.data || [];

    const filteredAthletes = useMemo(() => {
        let result = athletes;
        
        // Aplica filtro de termo de busca
        if (searchTerm) {
            result = result.filter(a => a.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Aplica filtro de Plano Impresso
        if (planFilter === 'PRINTED') {
            result = result.filter(a => a.paymentPlan === 'PRINTED');
        }

        return result;
    }, [athletes, searchTerm, planFilter]);

    const athletesToPrint = useMemo(() => {
        return athletes.filter(a => selectedIds.includes(a.id));
    }, [athletes, selectedIds]);

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAllPending = () => {
        const pendingIds = filteredAthletes.filter(a => !a.isIdCardPrinted).map(a => a.id);
        setSelectedIds(pendingIds);
    };

    const handleTogglePrinted = async (athlete: User) => {
        setProcessingId(athlete.id);
        try {
            const newStatus = !athlete.isIdCardPrinted;
            await idCardService.markAsPrinted(athlete.id, !!athlete.isDependent, newStatus);
            addToast('success', newStatus ? "Marcado como impresso!" : "Retornado para a fila.");
            refetch();
        } catch (err: any) {
            addToast('error', "Falha ao atualizar status.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleMarkBatchAsPrinted = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Deseja marcar os ${selectedIds.length} atletas selecionados como impressos?`)) return;

        setProcessingId('batch');
        try {
            const batch = athletes.filter(a => selectedIds.includes(a.id)).map(a => ({ id: a.id, isDependent: !!a.isDependent }));
            await idCardService.markBatchAsPrinted(batch);
            addToast('success', "Lote atualizado com sucesso!");
            setSelectedIds([]);
            refetch();
        } catch (err: any) {
            addToast('error', "Falha no processamento em lote.");
        } finally {
            setProcessingId(null);
        }
    };

    const handlePrintSingle = () => {
        window.print();
    };

    const handlePrintBatch = () => {
        window.print();
    };

    return {
        athletes,
        filteredAthletes,
        athletesToPrint,
        selectedIds,
        searchTerm,
        setSearchTerm,
        planFilter,
        setPlanFilter,
        processingId,
        previewUser,
        setPreviewUser,
        isLoading,
        isError,
        isFetching,
        refetch,
        handleToggleSelection,
        handleSelectAllPending,
        handleTogglePrinted,
        handleMarkBatchAsPrinted,
        handlePrintSingle,
        handlePrintBatch
    };
}