import React, { useState, useEffect } from 'react';
import { Mail, Save, Send, Loader2, RefreshCw, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';

interface Setting {
  key: string;
  value: string;
  label?: string;
}

export const AdminResend: React.FC = () => {
  const { addToast } = useToast();

  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Test email fields
  const [fromEmail, setFromEmail] = useState('onboarding@resend.dev');
  const [toEmail, setToEmail] = useState('cbjjs@saltonaweb.sh27.com.br');
  const [subject, setSubject] = useState('Hello World');
  const [htmlContent, setHtmlContent] = useState('<p>Congrats on sending your <strong>first email</strong>!</p>');

  // Test result state
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const fetchApiKey = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'resend_api_key')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setApiKey(data.value || '');
      }
    } catch (err: any) {
      addToast('error', 'Erro ao carregar a chave de API do Resend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      addToast('error', 'Por favor, insira uma chave de API válida.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'resend_api_key',
          value: apiKey.trim(),
          label: 'Chave de API do Resend'
        });

      if (error) throw error;

      addToast('success', 'Chave de API do Resend salva com sucesso!');
    } catch (err: any) {
      addToast('error', 'Erro ao salvar a chave de API.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!apiKey.trim()) {
      addToast('error', 'Salve ou insira a chave de API do Resend antes de testar.');
      return;
    }
    if (!toEmail.trim()) {
      addToast('error', 'Por favor, insira o e-mail do destinatário.');
      return;
    }

    setIsSending(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          apiKey: apiKey.trim(),
          from: fromEmail.trim(),
          to: toEmail.trim(),
          subject: subject.trim(),
          html: htmlContent
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.error) {
        setTestResult({
          success: false,
          message: data.error,
          details: data.details || data
        });
        addToast('error', 'Falha no envio do e-mail de teste.');
      } else {
        setTestResult({
          success: true,
          message: `E-mail enviado com sucesso! ID do envio: ${data?.id || 'N/A'}`,
          details: data
        });
        addToast('success', 'E-mail de teste enviado com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao disparar e-mail:', err);
      setTestResult({
        success: false,
        message: err.message || 'Erro desconhecido ao chamar a Edge Function.'
      });
      addToast('error', 'Erro ao disparar e-mail de teste.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Integração Resend</h2>
          <p className="text-sm text-gray-500 font-medium">Configure e teste o disparo automático de e-mails da plataforma.</p>
        </div>
        <button onClick={fetchApiKey} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl hover:bg-gray-50 transition-all text-cbjjs-blue">
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <AdminListSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna de Configuração da API */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-cbjjs-blue">
                  <Mail size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-cbjjs-blue uppercase tracking-[0.2em] block">Configuração</span>
                  <h3 className="text-lg font-black dark:text-white uppercase">API Key</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                    Chave de API do Resend (re_xxxxxxxxx)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Insira sua chave re_..."
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl outline-none text-sm font-bold transition-all dark:text-white"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3">
                  <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    Esta chave é armazenada de forma segura no banco de dados e protegida por políticas de segurança (RLS), sendo acessível apenas por administradores.
                  </p>
                </div>

                <button
                  onClick={handleSaveApiKey}
                  disabled={isSaving}
                  className="w-full py-4 bg-cbjjs-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Salvar Chave de API
                </button>
              </div>
            </div>
          </div>

          {/* Coluna de Disparo de Teste */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600">
                  <Send size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] block">Homologação</span>
                  <h3 className="text-lg font-black dark:text-white uppercase">Disparo de Teste</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                    Remetente (From)
                  </label>
                  <input
                    type="text"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="onboarding@resend.dev"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl outline-none text-sm font-bold transition-all dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Use <strong>onboarding@resend.dev</strong> se estiver usando o domínio de teste do Resend.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                    Destinatário (To)
                  </label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="cbjjs@saltonaweb.sh27.com.br"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl outline-none text-sm font-bold transition-all dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    E-mail que receberá o teste.
                  </span>
                </div>
              </div>

              <div className="space-y-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                    Assunto (Subject)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Hello World"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl outline-none text-sm font-bold transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">
                    Conteúdo HTML (HTML)
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={4}
                    placeholder="<p>Congrats on sending your <strong>first email</strong>!</p>"
                    className="w-full p-5 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-3xl outline-none text-sm font-bold transition-all dark:text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSendTestEmail}
                disabled={isSending}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Enviar E-mail de Teste
              </button>

              {testResult && (
                <div className={`mt-6 p-6 rounded-3xl border ${testResult.success ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-300'}`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
                    ) : (
                      <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="space-y-2 flex-1">
                      <h4 className="font-bold text-sm">
                        {testResult.success ? 'Sucesso no Envio!' : 'Erro no Envio'}
                      </h4>
                      <p className="text-xs font-medium leading-relaxed">
                        {testResult.message}
                      </p>
                      {testResult.details && (
                        <pre className="text-[10px] font-mono bg-white/50 dark:bg-black/20 p-3 rounded-xl overflow-x-auto max-h-40">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
