"use client";

import React from 'react';
import { Search, RefreshCw, MessageCircle, FileSpreadsheet, BookOpen } from 'lucide-react';
import { useAdminContacts } from '../hooks/useAdminContacts';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { Belt } from '../types';

export const AdminContactManagement: React.FC = () => {
  const {
    contacts, isLoading, isError, selectedBelt, setSelectedBelt,
    searchTerm, setSearchTerm, refetch, isFetching
  } = useAdminContacts();

  const handleWhatsAppClick = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}`;
    window.open(url, '_blank');
  };

  const BELTS_LIST = Object.values(Belt);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Gestão de Contatos</h2>
          <p className="text-sm text-gray-500 font-medium">Lista de transmissão e contatos diretos via WhatsApp.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()} 
            className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-cbjjs-blue hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Filtrar por Graduação</label>
            <select 
              value={selectedBelt} 
              onChange={(e) => setSelectedBelt(e.target.value as any)}
              className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cbjjs-blue text-sm font-bold dark:text-white"
            >
              <option value="ALL">TODAS AS FAIXAS</option>
              {BELTS_LIST.map(b => (
                <option key={b} value={b}>{b.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Buscar Nome ou Unidade</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Ex: João Silva ou Gracie Barra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cbjjs-blue text-sm dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        {isLoading ? (
          <AdminListSkeleton />
        ) : isError ? (
          <AdminErrorState onRetry={() => refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r dark:border-slate-700">Atleta</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r dark:border-slate-700">Unidade</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r dark:border-slate-700">Faixa</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-gray-400 font-medium italic">Nenhum contato encontrado.</td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="p-4 border-r dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-cbjjs-blue font-black text-xs shadow-inner shrink-0">
                            {contact.profileImage ? <img src={contact.profileImage} className="w-full h-full object-cover rounded-lg" /> : contact.fullName.substring(0,2).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm dark:text-white truncate max-w-[180px]">{contact.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r dark:border-slate-700">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{(contact as any).academyName}</span>
                      </td>
                      <td className="p-4 border-r dark:border-slate-700">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-black uppercase text-gray-500">
                          {contact.athleteData?.belt}
                        </span>
                      </td>
                      <td 
                        className="p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                        onClick={() => handleWhatsAppClick(contact.phone)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-mono font-bold ${contact.phone ? 'text-cbjjs-green' : 'text-gray-300'}`}>
                            {contact.phone || 'NÃO INFORMADO'}
                          </span>
                          {contact.phone && (
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MessageCircle size={16} fill="currentColor" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-400 py-4">
        <FileSpreadsheet size={16} />
        <p className="text-[10px] font-black uppercase tracking-widest">Total: {contacts.length} registros</p>
      </div>
    </div>
  );
};