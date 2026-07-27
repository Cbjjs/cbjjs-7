import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Role, User } from '../types';
import { userService } from '../services/userService';
import {
  Users, UserPlus, ShieldAlert, Trash2, Search, Mail, ShieldCheck, UserCog, Loader2
} from 'lucide-react';
import { CustomLoader } from '../components/CustomLoader';

export const AdminTeam: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [promotingRole, setPromotingRole] = useState<Role>(Role.GESTOR);
  const [isPromoting, setIsPromoting] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Busca sugestões de e-mail em tempo real
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchEmail.length < 3 || foundUser) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);

      setSuggestions((data as User[]) || []);
      setShowSuggestions(true);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchEmail, foundUser]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', [Role.ADMIN, Role.GESTOR])
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTeam(data as User[]);
    } catch (error) {
      console.error('Error fetching team:', error);
      showToast('Erro ao carregar equipe administrativa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    try {
      setSearchingUser(true);
      setFoundUser(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', searchEmail.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        showToast('Usuário não encontrado com este e-mail.', 'warn');
      } else {
        setFoundUser(data as User);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      showToast('Erro ao buscar usuário.', 'error');
    } finally {
      setSearchingUser(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!foundUser) return;
    try {
      setIsPromoting(true);
      await userService.updateRole(foundUser.id, promotingRole);
      
      showToast(`Usuário promovido a ${promotingRole === Role.ADMIN ? 'Super Admin' : 'Gestor'} com sucesso!`, 'success');
      setIsModalOpen(false);
      setFoundUser(null);
      setSearchEmail('');
      fetchTeam();
    } catch (error) {
      console.error('Error promoting user:', error);
      showToast('Erro ao promover usuário.', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRevokeAccess = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja revogar o acesso administrativo de ${userName}?`)) return;
    
    try {
      await userService.updateRole(userId, Role.STUDENT);
      
      showToast('Acesso administrativo revogado com sucesso.', 'success');
      fetchTeam();
    } catch (error) {
      console.error('Error revoking access:', error);
      showToast('Erro ao revogar acesso.', 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><CustomLoader /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <UserCog className="text-cbjjs-blue" size={28} />
            EQUIPE ADMINISTRATIVA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
            Gerencie os níveis de acesso dos membros da sua equipe.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-cbjjs-blue hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <UserPlus size={18} />
          ADICIONAR NOVO MEMBRO
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Membro</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nível de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} className="text-slate-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                      member.role === Role.ADMIN 
                        ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800' 
                        : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}>
                      {member.role === Role.ADMIN ? 'Super Admin' : 'Gestor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleRevokeAccess(member.id, member.fullName)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Revogar Acesso"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {team.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum membro administrativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleIn">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ADICIONAR MEMBRO</h3>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setFoundUser(null);
                  setSearchEmail('');
                }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Trash2 size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">BUSCAR POR E-MAIL</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => {
                        setSearchEmail(e.target.value);
                        if (foundUser) setFoundUser(null);
                      }}
                      placeholder="email@exemplo.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none pr-12"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                    />
                    <button
                      onClick={handleSearchUser}
                      disabled={searchingUser || !searchEmail}
                      className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-cbjjs-blue text-white rounded-xl disabled:opacity-50 transition-all active:scale-90 shadow-md shadow-blue-500/20"
                    >
                      {searchingUser ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>

                    {/* Lista de Sugestões */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[70] overflow-hidden animate-fadeIn max-h-48 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setFoundUser(s);
                              setSearchEmail(s.email);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex flex-col"
                          >
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{s.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{s.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {foundUser && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-cbjjs-blue/20 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-cbjjs-blue/10 flex items-center justify-center">
                        <Users className="text-cbjjs-blue" size={24} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{foundUser.fullName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{foundUser.email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setPromotingRole(Role.GESTOR)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          promotingRole === Role.GESTOR 
                            ? 'border-cbjjs-blue bg-cbjjs-blue/5 text-cbjjs-blue' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        <ShieldAlert size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Gestor</span>
                      </button>
                      <button 
                        onClick={() => setPromotingRole(Role.ADMIN)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          promotingRole === Role.ADMIN 
                            ? 'border-purple-500 bg-purple-500/5 text-purple-600' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        <ShieldCheck size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Super Admin</span>
                      </button>
                    </div>

                    <button 
                      onClick={handlePromoteUser}
                      disabled={isPromoting}
                      className="w-full bg-slate-900 dark:bg-cbjjs-blue text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isPromoting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                      CONFIRMAR PROMOÇÃO
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};