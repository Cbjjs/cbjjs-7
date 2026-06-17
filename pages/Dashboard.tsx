import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, ArrowRight, Trophy, Sparkles, RefreshCw } from 'lucide-react';
import { Event } from '../types';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';

const EventSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl h-96 border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
        <div className="p-5 flex-1 space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
        </div>
      </div>
    ))}
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
      const updateGreeting = () => {
          const hours = new Date().getHours();
          if (hours >= 5 && hours < 12) setGreeting('Bom dia');
          else if (hours >= 12 && hours < 18) setGreeting('Boa tarde');
          else setGreeting('Boa noite');
      };
      updateGreeting();
      const interval = setInterval(updateGreeting, 60000);
      return () => clearInterval(interval);
  }, []);

  const { data: eventsData, isLoading: loadingEvents, refetch } = useSupabaseQuery<Event[]>(
    ['public-events'],
    async (signal) => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true })
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
            category: e.category,
            startDate: e.start_date
        })) || [];

        return { data: mappedEvents, error: null };
    }
  );

  const allEvents = (eventsData as any)?.data || [];
  
  // Lógica de separação de datas
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = allEvents.filter((ev: Event) => {
    if (!ev.startDate) return true;
    const evDate = new Date(ev.startDate);
    evDate.setHours(0, 0, 0, 0);
    return evDate >= today;
  });

  const pastEvents = allEvents.filter((ev: Event) => {
    if (!ev.startDate) return false;
    const evDate = new Date(ev.startDate);
    evDate.setHours(0, 0, 0, 0);
    return evDate < today;
  });

  const handleRegistration = (link?: string) => {
      if (link && link.trim() !== '') {
          window.open(link, '_blank');
      }
  };

  const firstName = user?.fullName.split(' ')[0] || 'Atleta';

  const EventCard = ({ event, isPast }: { event: Event, isPast: boolean }) => (
    <div className={`group relative bg-white dark:bg-slate-800 rounded-3xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700/50 flex flex-col h-full overflow-hidden ${isPast ? 'opacity-75 grayscale-[0.5]' : ''}`}>
        <div className="relative h-48 overflow-hidden bg-slate-900">
            {event.imageUrl ? (
                <img src={event.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt={event.name} />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-cbjjs-blue/40 opacity-60"></div>
            )}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-900 rounded-xl px-3 py-2 text-center shadow-lg min-w-[60px] z-10">
                <span className="block text-xs font-bold uppercase text-slate-500">{event.month.substring(0,3)}</span>
                <span className="block text-xl font-black leading-none">{event.date.split(' ')[0]}</span>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <span className="inline-block px-2 py-0.5 rounded bg-cbjjs-gold text-black text-[9px] font-black uppercase tracking-wider mb-1 shadow-sm">{event.category || 'Gi & NoGi'}</span>
                <h3 className="text-lg font-black text-white leading-tight drop-shadow-md">{event.name}</h3>
            </div>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3 mb-6">
                <div className="flex items-start text-slate-600 dark:text-slate-400">
                    <Calendar size={18} className="mr-2.5 mt-0.5 text-cbjjs-blue flex-shrink-0" />
                    <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Confirmada</p><p className="text-xs">{event.date} de {event.month}</p></div>
                </div>
                <div className="flex items-start text-slate-600 dark:text-slate-400">
                    <MapPin size={18} className="mr-2.5 mt-0.5 text-cbjjs-blue flex-shrink-0" />
                    <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Localização</p><p className="text-xs">{event.location}</p></div>
                </div>
            </div>
            
            {!isPast && event.registrationLink && event.registrationLink.trim() !== '' ? (
                <button 
                    onClick={() => handleRegistration(event.registrationLink)}
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-cbjjs-blue shadow-lg active:scale-95"
                >
                    Inscrever-se Agora <ArrowRight size={16} />
                </button>
            ) : (
                <button 
                    disabled
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                    {isPast ? 'Evento Encerrado' : 'Em Breve'}
                </button>
            )}
        </div>
    </div>
  );
  
  return (
    <div className="animate-fadeIn pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cbjjs-blue to-blue-700 text-white shadow-xl shadow-blue-900/20 mb-10 p-8 md:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                  <Sparkles size={12} className="text-cbjjs-gold" /> Painel do Atleta
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{greeting}, {firstName}.</h1>
              <p className="text-blue-100 text-base md:text-lg font-medium leading-relaxed max-w-lg">Confira o calendário oficial e garanta sua vaga nos próximos desafios.</p>
          </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="text-cbjjs-gold" size={24}/> Calendário de Eventos
        </h2>
        <div className="flex items-center gap-3">
             <button onClick={() => refetch()} className="p-2 text-cbjjs-blue hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
                <RefreshCw size={18} className={loadingEvents ? 'animate-spin' : ''} />
             </button>
             <span className="text-sm font-medium text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">Temporada 2026</span>
        </div>
      </div>

      {loadingEvents ? <EventSkeleton /> : allEvents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700"><p className="text-gray-500">Nenhum evento programado.</p></div>
      ) : (
        <div className="space-y-16">
            {/* Eventos Futuros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {upcomingEvents.map((event: Event) => (
                    <EventCard key={event.id} event={event} isPast={false} />
                ))}
            </div>

            {/* Divisória para Eventos Passados */}
            {pastEvents.length > 0 && (
                <div className="space-y-10">
                    <div className="relative flex items-center py-5">
                        <div className="flex-grow border-t border-gray-300 dark:border-slate-700"></div>
                        <span className="flex-shrink mx-4 text-xs font-black uppercase tracking-[0.3em] text-gray-400">Eventos passados</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-slate-700"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pastEvents.map((event: Event) => (
                            <EventCard key={event.id} event={event} isPast={true} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};