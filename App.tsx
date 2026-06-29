import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { MyStudents } from './pages/MyStudents';
import { AdminPanel } from './pages/AdminPanel';
import { AdminIDCards } from './pages/AdminIDCards';
import { Profile } from './pages/Profile';
import { MyIDCard } from './pages/MyIDCard';
import { AcademyRegister } from './pages/AcademyRegister';
import { MyDependents } from './pages/MyDependents';
import { AdminEventAccess } from './pages/AdminEventAccess';
import { AdminContactManagement } from './pages/AdminContactManagement';
import { AdminResend } from './pages/AdminResend';
import { CustomLoader } from './components/CustomLoader';
import { Role } from './types';
import { WifiOff } from 'lucide-react';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const { isAuthenticated, authStatus, user, connectionStatus, retryConnection, loading } = useAuth();
  
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return localStorage.getItem('cbjjs_current_page') || 'dashboard';
  });
  
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem('cbjjs_current_page', page);
  };

  // Bloco Corretor Automático de Dados (Executa silenciosamente em qualquer carregamento inicial)
  useEffect(() => {
    const fixDatabaseRecords = async () => {
      try {
        // 1. Busca o ID da academia pelo nome
        const { data: academy } = await supabase
          .from('academies')
          .select('id')
          .eq('name', 'LUTANDO POR VIDAS BR')
          .maybeSingle();

        if (academy?.id) {
          // 2. Busca todas as solicitações pendentes de certificado para esta academia
          const { data: certs } = await supabase
            .from('academy_certificates')
            .select('id, created_at')
            .eq('academy_id', academy.id)
            .eq('status_payment', 'PENDING');

          if (certs && certs.length > 0) {
            // Ordena decrescente por data para obter o mais recente (último pedido feito)
            const sorted = [...certs].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            const latest = sorted[0];
            const olderOnes = sorted.slice(1);

            // 3. Atualiza o pedido mais recente para PAID e status de entrega para PRODUCING (Produzindo)
            await supabase
              .from('academy_certificates')
              .update({
                status_payment: 'PAID',
                paid_at: '2026-06-19T13:54:47.000Z',
                status_delivery: 'PRODUCING'
              })
              .eq('id', latest.id);

            // 4. Cancela os outros registros pendentes duplicados
            for (const old of olderOnes) {
              await supabase
                .from('academy_certificates')
                .update({
                  status_payment: 'CANCELLED',
                  status_delivery: 'CANCELLED'
                })
                .eq('id', old.id);
            }
          }
        }
      } catch (error) {
        console.error('Erro na correção automática:', error);
      }
    };
    fixDatabaseRecords();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
        const adminPages = ['admin-users', 'admin-professors', 'admin-academies', 'admin-events', 'admin-settings', 'admin-id-cards', 'admin-all-users', 'admin-event-access', 'admin-contacts', 'admin-resend'];
        if (adminPages.includes(currentPage) && user.role !== Role.ADMIN) {
            handleNavigate('dashboard');
        }
    }
  }, [isAuthenticated, user, currentPage]);

  if (connectionStatus === 'failed' && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><WifiOff className="text-red-500" size={40} /></div>
            <h2 className="text-2xl font-black dark:text-white mb-2 tracking-tight">Conexão Perdida</h2>
            <button onClick={retryConnection} className="w-full bg-cbjjs-blue text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Tentar Reconectar</button>
      </div>
    );
  }

  if (authStatus === 'CHECKING' || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <CustomLoader />
        <div className="mt-8 text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">CBJJS: Validando Acesso Seguro...</div>
      </div>
    );
  }

  if (authStatus === 'UNAUTHENTICATED' || authStatus === 'PASSWORD_RECOVERY') {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'profile': return (user && !user.isBoardingComplete) ? <Onboarding /> : <Profile />;
      case 'my-id-card': return <MyIDCard onNavigate={handleNavigate} />;
      case 'academy-register': return <AcademyRegister />;
      case 'my-dependents': return <MyDependents />;
      case 'students': return <MyStudents />;
      case 'admin-event-access': return user?.role === Role.ADMIN ? <AdminEventAccess /> : <Dashboard />;
      case 'admin-contacts': return user?.role === Role.ADMIN ? <AdminContactManagement /> : <Dashboard />;
      case 'admin-users': return user?.role === Role.ADMIN ? <AdminPanel view="users" /> : <Dashboard />;
      case 'admin-professors': return user?.role === Role.ADMIN ? <AdminPanel view="professors" /> : <Dashboard />;
      case 'admin-academies': return user?.role === Role.ADMIN ? <AdminPanel view="academies" /> : <Dashboard />;
      case 'admin-certificates': return user?.role === Role.ADMIN ? <AdminPanel view="academy-certificates" /> : <Dashboard />;
      case 'admin-id-cards': return user?.role === Role.ADMIN ? <AdminIDCards /> : <Dashboard />;

      case 'admin-events': return user?.role === Role.ADMIN ? <AdminPanel view="events" /> : <Dashboard />;
      case 'admin-settings': return user?.role === Role.ADMIN ? <AdminPanel view="settings" /> : <Dashboard />;
      case 'admin-resend': return user?.role === Role.ADMIN ? <AdminResend /> : <Dashboard />;
      case 'admin-all-users': return user?.role === Role.ADMIN ? <AdminPanel view="all-users" /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="relative h-full">
      <Layout activePage={currentPage} onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;