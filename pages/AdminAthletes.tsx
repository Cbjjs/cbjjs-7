import React from 'react';
import { Search, RefreshCw, X, Loader2, ChevronLeft, Award, Users, LayoutGrid } from 'lucide-react';
import { DocumentStatus } from '../types';
import { AdminListSkeleton, PaginationControls, AdminErrorState } from '../components/AdminShared';
import { AdminAthleteDetailsModal } from '../components/AdminAthleteDetailsModal';
import { AthleteListItem } from '../components/admin/AthleteListItem';
import { AthleteAcademyListItem } from '../components/admin/AthleteAcademyListItem';
import { SortButton } from '../components/admin/id-cards/SortButton';
import { useAdminAthletes } from '../hooks/useAdminAthletes';

export const AdminAthletes: React.FC = () => {
  const {
    viewMode, setViewMode, academies, selectedAcademy, setSelectedAcademy, sortOrder, setSortOrder,
    athletes, totalPages, isLoading, isError, subTab, searchTerm, page, isFetching,
    viewingUser, processingId, rejectingDoc, rejectionReason,
    setSubTab, setSearchTerm, setPage, setViewingUser, setRejectionReason, setRejectingDoc,
    refetch, handleApproveDoc, handleRejectDoc, confirmRejectDoc, handleMarkAsPaid,
    handleUpdateFederationId, handleApproveFederation
  } = useAdminAthletes();

  // Helpers Visuais
  const getStatusLabel = (status: DocumentStatus) => {
      switch(status) {
          case DocumentStatus.MISSING: return 'PEND';
          case DocumentStatus.PENDING: return 'ENVIADO';
          case DocumentStatus.APPROVED: return 'OK';
          case DocumentStatus.REJECTED: return 'RECUS';
          default: return 'PEND';
      }
  };

  const getStatusColor = (status: DocumentStatus) => {
      switch(status) {
          case DocumentStatus.MISSING: return 'text-orange-500';
          case DocumentStatus.PENDING: return 'text-blue-500 font-black';
          case DocumentStatus.APPROVED: return 'text-green-500';
          case DocumentStatus.REJECTED: return 'text-red-500';
          default: return 'text-gray-400';
      }
  };

  const isGlobalView = viewMode === 'BY_ATHLETE';

  return (
      <div className="space-y-6 animate-fadeIn">
          {/* SELETOR DE VISÃO NO TOPO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div>
                  <h2 className="text-2xl font-black dark:text-white tracking-tight">Gestão de Atletas</h2>
                  <p className="text-sm text-gray-500 font-medium">Controle de aprovações e cadastros.</p>
              </div>
              
              <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-sm">
                  <button 
                    onClick={() => setViewMode('BY_ACADEMY')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'BY_ACADEMY' ? 'bg-cbjjs-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <Users size={14}/> Por Unidade
                  </button>
                  <button 
                    onClick={() => setViewMode('BY_ATHLETE')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'BY_ATHLETE' ? 'bg-cbjjs-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <LayoutGrid size={14}/> Por Atleta
                  </button>
              </div>
          </div>

          {/* CONTEÚDO DINÂMICO BASEADO NO MODO */}
          {!isGlobalView && !selectedAcademy ? (
              /* VISÃO NÍVEL 1: LISTA DE ACADEMIAS */
              <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="relative w-full">
                          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                          <input 
                            type="text" 
                            placeholder="Buscar academia por nome ou equipe..." 
                            className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                          />
                      </div>
                      <div className="flex gap-3 w-full md:w-auto shrink-0">
                          <SortButton 
                            order={sortOrder} 
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                          />
                          <button onClick={() => refetch()} className="p-3 text-cbjjs-blue bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl transition-all shadow-sm hover:bg-gray-50">
                              <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
                          </button>
                      </div>
                  </div>

                  {isLoading ? (
                      <AdminListSkeleton />
                  ) : isError ? (
                      <AdminErrorState onRetry={() => refetch()} />
                  ) : (
                      <div className="grid grid-cols-1 gap-5">
                          {academies.length === 0 ? (
                              <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200">
                                  <Users size={48} className="text-gray-200 mx-auto mb-4" />
                                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma academia encontrada.</p>
                              </div>
                          ) : (
                              academies.map(academy => (
                                  <AthleteAcademyListItem 
                                    key={academy.id} 
                                    academy={academy} 
                                    onClick={setSelectedAcademy} 
                                  />
                              ))
                          )}
                      </div>
                  )}
              </div>
          ) : (
              /* VISÃO DE ATLETAS (GLOBAL OU POR ACADEMIA) */
              <div className="space-y-6 animate-fadeIn">
                  {!isGlobalView && selectedAcademy && (
                      <button 
                        onClick={() => { setSelectedAcademy(null); setSearchTerm(''); }} 
                        className="flex items-center gap-2 text-gray-400 font-black hover:text-cbjjs-blue transition-colors uppercase text-[10px] tracking-widest"
                      >
                          <ChevronLeft size={16}/> Voltar para Unidades
                      </button>
                  )}

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                          <div>
                              <h2 className="text-3xl font-black dark:text-white tracking-tight">
                                  {isGlobalView ? 'Fila de Atletas Global' : selectedAcademy?.name}
                              </h2>
                              <p className="text-sm text-gray-500 font-medium">
                                  {isGlobalView ? 'Ordenados por data de cadastro (mais recentes primeiro).' : 'Gestão de Atletas e Aprovações'}
                              </p>
                          </div>
                          
                          {/* Tabs internas */}
                          <div className="flex gap-4 border-b dark:border-gray-700 w-full md:w-auto">
                              <button 
                                onClick={() => { setSubTab('approvals'); setPage(1); }} 
                                className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${subTab === 'approvals' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
                              >
                                Pendentes
                              </button>
                              <button 
                                onClick={() => { setSubTab('all'); setPage(1); }} 
                                className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${subTab === 'all' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
                              >
                                Aprovados
                              </button>
                              <button onClick={() => refetch()} className="p-2.5 text-cbjjs-blue hover:bg-gray-50 rounded-xl transition-all">
                                  <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''}/>
                              </button>
                          </div>
                      </div>
                      
                      {/* Busca de Atletas */}
                      <div className="relative mb-8">
                          <Search className="absolute left-4 top-3 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl outline-none text-sm" 
                            placeholder="Buscar atleta pelo nome ou email..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                          />
                      </div>

                      {/* Lista de Atletas */}
                      <div className="grid grid-cols-1 gap-4">
                          {isLoading ? (
                            <AdminListSkeleton />
                          ) : isError ? (
                            <AdminErrorState onRetry={() => refetch()}/>
                          ) : athletes.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                              Nenhum atleta nesta categoria encontrado.
                            </div>
                          ) : (
                            athletes.map(u => (
                              <AthleteListItem 
                                key={u.id} 
                                athlete={u} 
                                onClick={setViewingUser}
                                getStatusLabel={getStatusLabel}
                                getStatusColor={getStatusColor}
                                showAcademyName={isGlobalView} // Mostra nome da academia na visão global
                              />
                            ))
                          )}
                      </div>

                      {/* Paginação */}
                      {!isLoading && !isError && totalPages > 1 && (
                        <PaginationControls 
                          page={page} 
                          totalPages={totalPages} 
                          onPrev={() => setPage(p => Math.max(1, p - 1))} 
                          onNext={() => setPage(p => p + 1)} 
                        />
                      )}
                  </div>
              </div>
          )}

          {/* MODAL DE DETALHES (Comum a todas as visões) */}
          <AdminAthleteDetailsModal 
            isOpen={!!viewingUser} 
            onClose={() => setViewingUser(null)} 
            user={viewingUser}
            onApproveDoc={(userId, type) => handleApproveDoc(userId, !!viewingUser?.isDependent, type)} 
            onRejectDoc={handleRejectDoc} 
            onMarkAsPaid={(userId) => handleMarkAsPaid(userId, !!viewingUser?.isDependent)}
            onUpdateFederationId={(userId, newId) => handleUpdateFederationId(userId, !!viewingUser?.isDependent, newId)} 
            onApproveFederation={(userId) => handleApproveFederation(userId, !!viewingUser?.isDependent)} 
            processingId={processingId}
          />

          {rejectingDoc && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                  <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border dark:border-slate-700">
                      <button onClick={() => setRejectingDoc(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24}/></button>
                      <h3 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">Motivo da Recusa</h3>
                      <textarea 
                        className="w-full p-4 bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-red-500 dark:text-white shadow-inner" 
                        rows={4} 
                        value={rejectionReason} 
                        onChange={e => setRejectionReason(e.target.value)} 
                        placeholder="Ex: Foto ilegível, documento vencido..."
                      />
                      <div className="flex gap-3">
                          <button onClick={() => setRejectingDoc(null)} className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                          <button 
                            onClick={confirmRejectDoc} 
                            disabled={!rejectionReason.trim() || processingId === 'rejecting'} 
                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2"
                          >
                            {processingId === 'rejecting' && <Loader2 className="animate-spin" size={14}/>}
                            Confirmar Recusa
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};