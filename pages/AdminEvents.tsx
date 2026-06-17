import React, { useState } from 'react';
import { Plus, MapPin, Edit, Trash2, X, RefreshCw, Calendar, Link, Image as ImageIcon, Save, Loader2, Upload, Award } from 'lucide-react';
import { Event } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { AdminListSkeleton, modalInputClass, modalLabelClass, AdminErrorState } from '../components/AdminShared';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';

interface ExtendedEvent extends Event {
    startDate?: string;
}

export const AdminEvents: React.FC = () => {
  const { addToast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Partial<ExtendedEvent> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: eventsData, isLoading: loadingEvents, isError: errorState, refetch } = useSupabaseQuery<ExtendedEvent[]>(
    ['admin-events'],
    async (signal) => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true }) // Ordenação cronológica
          .abortSignal(signal);
        
        if (error) return { data: null, error };
        
        const mappedEvents = data?.map((e: any) => ({
            id: e.id, 
            name: e.name, 
            date: e.date_display, 
            month: e.month_display,
            location: e.location, 
            imageUrl: e.image_url, 
            registrationLink: e.registration_link,
            startDate: e.start_date,
            category: e.category
        })) || [];

        return { data: mappedEvents, error: null };
    }
  );

  const eventsList = eventsData?.data || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `banner_${Date.now()}.${fileExt}`;
          const filePath = `banners/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('event-banners')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('event-banners')
              .getPublicUrl(filePath);

          setEditingEvent(prev => ({ ...prev!, imageUrl: publicUrl }));
          addToast('success', "Imagem enviada com sucesso!");
      } catch (err: any) {
          addToast('error', "Erro no upload: Certifique-se que o bucket 'event-banners' existe e é público.");
      } finally {
          setIsUploading(false);
      }
  };

  const handleSaveEvent = async () => {
      if (!editingEvent?.name || !editingEvent?.date || !editingEvent?.month || !editingEvent?.startDate) {
          addToast('error', "Nome, Dia, Mês e Data de Início são obrigatórios.");
          return;
      }

      setIsSubmitting(true);
      try {
          const eventData = {
              name: editingEvent.name,
              date_display: editingEvent.date,
              month_display: editingEvent.month,
              location: editingEvent.location,
              registration_link: editingEvent.registrationLink,
              image_url: editingEvent.imageUrl,
              start_date: editingEvent.startDate,
              category: editingEvent.category
          };

          if (editingEvent.id) {
              const { error } = await supabase.from('events').update(eventData).eq('id', editingEvent.id);
              if (error) throw error;
              addToast('success', "Evento atualizado!");
          } else {
              const { error } = await supabase.from('events').insert([eventData]);
              if (error) throw error;
              addToast('success', "Novo evento criado!");
          }
          setEditingEvent(null);
          refetch();
      } catch (err: any) {
          addToast('error', err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteEvent = async (id: string) => {
      if (!confirm("Tem certeza que deseja remover este evento?")) return;
      try {
          const { error } = await supabase.from('events').delete().eq('id', id);
          if (error) throw error;
          addToast('success', "Evento removido.");
          refetch();
      } catch (err: any) {
          addToast('error', err.message);
      }
  };

  return (
      <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-black dark:text-white tracking-tight">Gestão de Eventos</h2>
                  <p className="text-sm text-gray-500 font-medium">Calendário oficial ordenado por data.</p>
              </div>
              <button 
                onClick={() => setEditingEvent({ name: '', date: '', month: 'JANEIRO', category: 'Gi & NoGi', location: '', registrationLink: '', startDate: new Date().toISOString().split('T')[0] })} 
                className="bg-cbjjs-blue text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:bg-blue-800 transition-all active:scale-95"
              >
                  <Plus size={18}/> Criar Evento
              </button>
          </div>
          
          {loadingEvents ? <AdminListSkeleton /> : errorState ? <AdminErrorState onRetry={() => refetch()} /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {eventsList.length === 0 ? (
                      <div className="col-span-2 text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                          <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum evento no calendário.</p>
                      </div>
                  ) : (
                      eventsList.map(ev => (
                        <div key={ev.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-cbjjs-blue transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-50 dark:bg-slate-700 rounded-2xl flex flex-col items-center justify-center text-cbjjs-blue font-black shadow-inner">
                                    <span className="text-[10px] uppercase font-bold">{ev.month?.substring(0,3)}</span>
                                    <span className="text-lg leading-none font-black">{ev.date?.split(' ')[0]}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold dark:text-white group-hover:text-cbjjs-blue transition-colors">{ev.name}</h4>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} className="text-cbjjs-blue"/> {ev.location}</p>
                                        <span className="text-[9px] font-black uppercase bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-400">{ev.category || 'Gi & NoGi'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingEvent(ev)} className="p-2.5 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-100 hover:text-cbjjs-blue transition-all"><Edit size={18}/></button>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2.5 bg-gray-50 dark:bg-slate-700 text-red-400 rounded-xl hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          )}

          {editingEvent && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
                  <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700 overflow-hidden">
                      <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                          <h3 className="text-xl font-black dark:text-white tracking-tight">{editingEvent.id ? 'Editar Evento' : 'Novo Evento'}</h3>
                          <button onClick={() => setEditingEvent(null)} className="p-2 text-gray-400 hover:text-gray-900"><X size={24}/></button>
                      </div>
                      
                      <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
                          <div>
                              <label className={modalLabelClass}>Nome do Evento</label>
                              <input 
                                className={modalInputClass} 
                                value={editingEvent.name || ''} 
                                onChange={e => setEditingEvent({...editingEvent, name: e.target.value})}
                                placeholder="Ex: MUNDIAL SOCIAL 2026"
                              />
                          </div>

                          <div>
                              <label className={modalLabelClass}>Categoria de Luta</label>
                              <div className="relative">
                                  <Award className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                  <select 
                                    className={`${modalInputClass} pl-10`} 
                                    value={editingEvent.category || 'Gi & NoGi'} 
                                    onChange={e => setEditingEvent({...editingEvent, category: e.target.value})}
                                  >
                                      <option value="Gi & NoGi">Gi & NoGi (Kimono e Sem Kimono)</option>
                                      <option value="Gi">Gi (Kimono)</option>
                                      <option value="NoGi">NoGi (Sem Kimono)</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className={modalLabelClass}>Dia de Exibição (Ex: 24 e 25)</label>
                                  <input 
                                    className={modalInputClass} 
                                    value={editingEvent.date || ''} 
                                    onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                                    placeholder="Dia(s)"
                                  />
                              </div>
                              <div>
                                  <label className={modalLabelClass}>Mês de Exibição</label>
                                  <select 
                                    className={modalInputClass} 
                                    value={editingEvent.month || 'JANEIRO'} 
                                    onChange={e => setEditingEvent({...editingEvent, month: e.target.value})}
                                  >
                                      {['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'].map(m => (
                                          <option key={m} value={m}>{m}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className={modalLabelClass}>Data para Ordenação (Primeiro dia do evento) *</label>
                              <input 
                                type="date"
                                className={modalInputClass} 
                                value={editingEvent.startDate || ''} 
                                onChange={e => setEditingEvent({...editingEvent, startDate: e.target.value})}
                              />
                          </div>

                          <div>
                              <label className={modalLabelClass}>Localização</label>
                              <div className="relative">
                                  <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                  <input 
                                    className={`${modalInputClass} pl-10`} 
                                    value={editingEvent.location || ''} 
                                    onChange={e => setEditingEvent({...editingEvent, location: e.target.value})}
                                    placeholder="Ex: Arena Carioca 1, RJ"
                                  />
                              </div>
                          </div>

                          <div>
                              <label className={modalLabelClass}>Link de Inscrição</label>
                              <div className="relative">
                                  <Link className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                  <input 
                                    className={`${modalInputClass} pl-10`} 
                                    value={editingEvent.registrationLink || ''} 
                                    onChange={e => setEditingEvent({...editingEvent, registrationLink: e.target.value})}
                                    placeholder="https://..."
                                  />
                              </div>
                          </div>

                          <div>
                              <label className={modalLabelClass}>Banner do Evento</label>
                              <div className="flex flex-col gap-4">
                                  {editingEvent.imageUrl && (
                                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border dark:border-slate-700">
                                          <img src={editingEvent.imageUrl} className="w-full h-full object-cover" />
                                          <button onClick={() => setEditingEvent({...editingEvent, imageUrl: ''})} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={14}/></button>
                                      </div>
                                  )}
                                  <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                                      {isUploading ? <Loader2 className="animate-spin text-cbjjs-blue" size={20}/> : <Upload className="text-gray-400" size={20}/>}
                                      <span className="text-xs font-black uppercase text-gray-500">{isUploading ? 'Enviando...' : 'Selecionar Imagem'}</span>
                                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading}/>
                                  </label>
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-gray-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex gap-3">
                          <button onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-black text-xs uppercase text-gray-500">Cancelar</button>
                          <button 
                            onClick={handleSaveEvent} 
                            disabled={isSubmitting || isUploading}
                            className="flex-1 py-4 bg-cbjjs-blue text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                              Salvar Evento
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};