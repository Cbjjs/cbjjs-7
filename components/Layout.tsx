import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types';
import { SidebarProfile } from './SidebarProfile';
import {
  Menu, X, Users, Calendar, LogOut, Sun, Moon, Shield, Award, CreditCard, Building, School, Settings, UserCheck, UserPlus, Printer, Contact, Scan, BookOpen, FileBadge
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setTheme(user.theme);
    }
  }, [user]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
       updateUser({ theme: newTheme });
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navigationGroups = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Campeonatos', icon: Award, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
      ]
    },
    {
      title: 'Sou Atleta',
      items: [
        { id: 'my-id-card', label: 'Minha Carteirinha', icon: CreditCard, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
        { id: 'profile', label: 'Minha Afiliação', icon: Shield, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
        { id: 'my-dependents', label: 'Afiliação do meu filho', icon: UserPlus, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
      ]
    },
    {
      title: 'Sou Professor',
      items: [
        { id: 'academy-register', label: 'Minha Academia', icon: Building, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
        { id: 'students', label: 'Meus Alunos', icon: Users, roles: [Role.STUDENT, Role.PROFESSOR, Role.ADMIN] },
      ]
    },
    {
      title: 'Administração',
      items: [
         { id: 'admin-event-access', label: 'Acesso Evento', icon: Scan, roles: [Role.ADMIN] },
         { id: 'admin-contacts', label: 'Gestão de Contatos', icon: BookOpen, roles: [Role.ADMIN] },
         { id: 'admin-all-users', label: 'Gestão de Contas', icon: Contact, roles: [Role.ADMIN] },
         { id: 'admin-users', label: 'Gestão Atletas', icon: Users, roles: [Role.ADMIN] },
         { id: 'admin-professors', label: 'Gestão Professores', icon: UserCheck, roles: [Role.ADMIN] },
         { id: 'admin-academies', label: 'Gestão Academias', icon: School, roles: [Role.ADMIN] },
         { id: 'admin-certificates', label: 'Certificados Academias', icon: FileBadge, roles: [Role.ADMIN] },
         { id: 'admin-id-cards', label: 'Carteirinhas', icon: Printer, roles: [Role.ADMIN] },

         { id: 'admin-events', label: 'Gestão Eventos', icon: Calendar, roles: [Role.ADMIN] },
         { id: 'admin-settings', label: 'Gestão Informações', icon: Settings, roles: [Role.ADMIN] },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      <div className="md:hidden fixed w-full z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS" className="w-full h-auto" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">CBJJS</span>
        </div>
        <button onClick={toggleSidebar} className="p-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-slate-900 shadow-2xl md:shadow-none md:border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-out
        md:relative md:z-10 md:translate-x-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-full
      `}>
        <div className="hidden md:flex items-center gap-4 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50">
           <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS" className="w-12 h-auto drop-shadow-sm" />
           <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white leading-none">CBJJS</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-cbjjs-gold mt-0.5">Versão Admin</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
          <SidebarProfile user={user} />
          <nav className="px-4 space-y-8 mt-2">
            {navigationGroups.map((group, groupIdx) => {
              const filteredItems = group.items.filter(item => {
                 if (user?.role === Role.ADMIN) return true;
                 return item.roles.includes(user?.role || Role.STUDENT);
              });
              if (filteredItems.length === 0) return null;
              return (
                <div key={groupIdx}>
                  {group.title && (
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">
                      {group.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 relative group
                          ${activePage === item.id 
                            ? 'bg-cbjjs-blue text-white shadow-md shadow-blue-500/25 font-semibold' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'}
                        `}
                      >
                        <item.icon 
                          size={20} 
                          className={`transition-colors duration-200 ${activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-cbjjs-blue dark:group-hover:text-white'}`} 
                        />
                        <span className="text-sm tracking-wide">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
            <button onClick={handleThemeToggle} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>
            <button onClick={() => logout()} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-semibold">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-fadeIn" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-y-auto h-full pt-20 md:pt-0 bg-slate-50 dark:bg-slate-950 relative scroll-smooth print:p-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-full pb-24 print:p-0 print:pb-0">
            {children}
        </div>
      </main>
    </div>
  );
};