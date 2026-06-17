import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, User, Calendar, AlertCircle, CheckCircle, ArrowLeft, Send, KeyRound, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { PasswordInput } from '../components/PasswordInput';
import { formatPhone } from '../utils/validators';

type LoginView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

export const Login: React.FC = () => {
  const { 
      login, register, forgotPassword, updatePassword, 
      loading, error, clearError, authStatus,
      needsEmailConfirmation, lastRegisteredEmail, setNeedsEmailConfirmation 
  } = useAuth();
  const { addToast } = useToast();
  
  const [view, setView] = useState<LoginView>(
      authStatus === 'PASSWORD_RECOVERY' ? 'RESET_PASSWORD' : 'LOGIN'
  );
  
  const [bannerText, setBannerText] = useState('Confederação Brasileira de Jiu-Jitsu Social. Esporte, disciplina e transformação.');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (authStatus === 'PASSWORD_RECOVERY') {
        setView('RESET_PASSWORD');
    }
  }, [authStatus]);

  useEffect(() => {
    const fetchBanner = async () => {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'login_banner_text').single();
        if (data) setBannerText(data.value);
    };
    fetchBanner();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'LOGIN') {
      await login(email, password);
    } else if (view === 'REGISTER') {
      await register({ fullName, email, dob, phone }, password);
    } else if (view === 'FORGOT_PASSWORD') {
      await forgotPassword(email);
      setIsSuccess(true);
      addToast('success', 'E-mail de recuperação enviado!');
    } else if (view === 'RESET_PASSWORD') {
      await updatePassword(password);
      addToast('success', 'Senha alterada com sucesso! Faça login com a nova senha.');
      setView('LOGIN');
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-cbjjs-blue focus:border-transparent outline-none transition-all placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start md:items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row my-auto">
        
        {/* Left Side - Branding */}
        <div className="w-full md:w-1/2 relative bg-gray-900 text-white flex flex-col justify-between overflow-hidden rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl min-h-[200px] md:min-h-full">
          <div className="absolute inset-0 z-0 opacity-40" style={{backgroundImage: 'url("https://atc.esp.br/wp-content/uploads/2020/10/pagina-jiu-jitsu.jpg")', backgroundSize: 'cover', backgroundPosition: 'center'}} />
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-cbjjs-blue/90 to-green-800/90 mix-blend-multiply" />
          <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <img src="https://saltonaweb.sh27.com.br/cbjjs/cbjjs.png" alt="CBJJS Logo" className="w-12 h-auto drop-shadow-md" />
                    <h1 className="text-2xl font-extrabold tracking-widest text-white">CBJJS</h1>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight shadow-black drop-shadow-lg text-white">
                {view === 'REGISTER' ? 'Junte-se à maior família.' : 'Bem-vindo de volta.'}
                </h2>
                <p className="text-blue-50 text-sm md:text-lg font-medium drop-shadow-md leading-relaxed opacity-90">{bannerText}</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 bg-white flex flex-col justify-center rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl h-full">
            {needsEmailConfirmation ? (
                <div className="text-center animate-fadeIn py-8">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Mail className="text-cbjjs-green animate-bounce" size={40} /></div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 tracking-tight">E-mail enviado!</h3>
                    <p className="text-sm text-gray-600 mb-8">Confirme sua conta clicando no link enviado para <span className="font-bold text-cbjjs-blue">{lastRegisteredEmail}</span>.</p>
                    <button onClick={() => { setNeedsEmailConfirmation(false); setView('LOGIN'); }} className="w-full py-4 bg-gray-50 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ArrowLeft size={16}/> Voltar para Login</button>
                </div>
            ) : isSuccess && view === 'FORGOT_PASSWORD' ? (
                <div className="text-center animate-fadeIn py-8">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Send className="text-cbjjs-blue animate-pulse" size={40} /></div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 tracking-tight">Verifique seu E-mail</h3>
                    <p className="text-sm text-gray-600 mb-8">Enviamos instruções de recuperação para o seu endereço de e-mail cadastrado.</p>
                    <button onClick={() => { setIsSuccess(false); setView('LOGIN'); }} className="w-full py-4 bg-gray-50 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ArrowLeft size={16}/> Voltar para Login</button>
                </div>
            ) : (
                <>
                    <div className="mb-8 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">
                            {view === 'LOGIN' ? 'Acesse sua conta' : view === 'REGISTER' ? 'Crie sua conta' : view === 'FORGOT_PASSWORD' ? 'Recuperar Senha' : 'Nova Senha'}
                        </h3>
                        <p className="text-gray-500 font-medium text-sm">
                            {view === 'LOGIN' ? 'Entre com seus dados para continuar.' : view === 'FORGOT_PASSWORD' ? 'Informe seu e-mail para receber o link.' : 'Preencha os dados abaixo.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-3 rounded-xl animate-fadeIn">
                            <AlertCircle size={20} className="flex-shrink-0" /><p className="font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {view === 'REGISTER' && (
                            <>
                                <div className="relative"><User className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="text" placeholder="Nome completo" className={inputClass} required value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative"><Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="date" className={inputClass} required value={dob} onChange={e=>setDob(e.target.value)} /></div>
                                    <div className="relative"><Smartphone className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="text" placeholder="Telefone / WhatsApp" className={inputClass} required value={phone} onChange={e=>setPhone(formatPhone(e.target.value))} maxLength={15} /></div>
                                </div>
                            </>
                        )}
                        
                        {(view !== 'RESET_PASSWORD' && view !== 'FORGOT_PASSWORD') && (
                            <div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="email" placeholder="Seu e-mail" className={inputClass} required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                        )}
                        
                        {(view === 'FORGOT_PASSWORD') && (
                            <div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="email" placeholder="E-mail cadastrado" className={inputClass} required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                        )}

                        {view !== 'FORGOT_PASSWORD' && (
                            <PasswordInput 
                                value={password} 
                                onChange={setPassword} 
                                placeholder={view === 'RESET_PASSWORD' ? "Defina sua Nova Senha" : view === 'REGISTER' ? "Crie uma Senha" : "Sua Senha de Acesso"}
                            />
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-cbjjs-green hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl shadow-lg transition-all flex justify-center items-center">
                            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 
                             view === 'LOGIN' ? 'Entrar na Plataforma' : 
                             view === 'REGISTER' ? 'Cadastrar' : 
                             view === 'FORGOT_PASSWORD' ? 'Enviar Recuperação' : 'Salvar Nova Senha'}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        {view === 'LOGIN' && (
                            <button onClick={() => { setView('FORGOT_PASSWORD'); clearError(); }} className="text-xs font-bold text-gray-400 hover:text-cbjjs-blue uppercase tracking-widest transition-colors">Esqueci minha senha</button>
                        )}
                        
                        <p className="text-gray-500 font-medium text-sm">
                            {view === 'LOGIN' ? 'Ainda não tem conta?' : 'Já possui cadastro?'}
                            <button onClick={() => { setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN'); clearError(); }} className="ml-2 font-black text-cbjjs-blue hover:text-blue-700 underline underline-offset-4 transition-all">
                                {view === 'LOGIN' ? 'Cadastre-se' : 'Faça Login'}
                            </button>
                        </p>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};