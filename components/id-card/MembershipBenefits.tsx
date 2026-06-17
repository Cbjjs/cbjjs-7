import React from 'react';
import { 
  ShieldCheck, CreditCard, HeartPulse, Percent, Scale, 
  Calculator, FileBadge, Trophy, Apple, Sparkles, Stethoscope 
} from 'lucide-react';

export const MembershipBenefits: React.FC = () => {
  const sectionTitleClass = "text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all";
  const benefitTitleClass = "font-black text-sm text-cbjjs-blue dark:text-blue-400 uppercase tracking-tight mb-2";
  const benefitDescClass = "text-sm text-gray-600 dark:text-gray-400 leading-relaxed";

  return (
    <div className="mt-16 space-y-12 animate-fadeIn max-w-4xl mx-auto">
      
      {/* 1. Apresentação */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full text-cbjjs-blue dark:text-blue-300 text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} /> Bem-vindo à CBJJS
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Vantagens em se filiar</h2>
        <p className="text-gray-500 font-medium italic">A primeira Confederação do Social – Esporte que transforma vidas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Carteirinha de Filiação */}
        <div className={cardClass}>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-cbjjs-blue mb-4">
            <CreditCard size={24} />
          </div>
          <h3 className={benefitTitleClass}>Carteirinha de Filiação</h3>
          <p className={benefitDescClass}>
            Identificação oficial com anuidade de apenas <span className="font-bold text-cbjjs-blue">R$ 30,00</span>. 
            Contém seus dados de registro, academia e faixa, validando sua trajetória no esporte.
          </p>
        </div>

        {/* 4. Certificados das Competições */}
        <div className={cardClass}>
          <div className="w-12 h-12 bg-cbjjs-gold/10 rounded-2xl flex items-center justify-center text-cbjjs-gold mb-4">
            <FileBadge size={24} />
          </div>
          <h3 className={benefitTitleClass}>Certificados Oficiais</h3>
          <p className={benefitDescClass}>
            Solicite certificados oficiais de competições para fortalecer seu currículo esportivo e facilitar a obtenção de patrocínios e Bolsa Atleta.
          </p>
        </div>
      </div>

      {/* 3. Benefícios e Serviços (Saúde e Descontos) */}
      <div className="space-y-6">
        <h3 className={sectionTitleClass}>
            <HeartPulse className="text-red-500" /> Saúde e Serviços
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${cardClass} md:col-span-3 border-l-4 border-l-cbjjs-green`}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-cbjjs-green shrink-0">
                        <Stethoscope size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Plano de Consulta Médica Online</h4>
                        <p className={benefitDescClass}>
                            Atletas filiados podem contratar consultas médicas online por apenas <span className="font-bold">R$ 15,00 mensais</span> (ou R$ 120,00 anuais). 
                            Evite filas e inclua sua família pelo mesmo valor por pessoa. Saúde acessível para o campeão e sua família.
                        </p>
                    </div>
                </div>
            </div>

            <div className={cardClass}>
                <Percent className="text-indigo-500 mb-4" size={24} />
                <h4 className={benefitTitleClass}>Óticas Parceiras</h4>
                <p className={benefitDescClass}>Até 50% de desconto na compra de óculos em nossa rede conveniada.</p>
            </div>

            <div className={cardClass}>
                <Scale className="text-indigo-500 mb-4" size={24} />
                <h4 className={benefitTitleClass}>Assistência Jurídica</h4>
                <p className={benefitDescClass}>15% de desconto em honorários para assistência em todas as áreas.</p>
            </div>

            <div className={cardClass}>
                <Calculator className="text-indigo-500 mb-4" size={24} />
                <h4 className={benefitTitleClass}>Contabilidade</h4>
                <p className={benefitDescClass}>Suporte contábil com 15% de desconto nos honorários para atletas e equipes.</p>
            </div>
        </div>
      </div>

      {/* 5 e 6. Equipes e Eventos */}
      <div className="space-y-6">
        <h3 className={sectionTitleClass}>
            <Trophy className="text-cbjjs-gold" /> Equipes e Competições
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cardClass}>
                <div className="flex gap-4">
                    <Apple className="text-orange-500 shrink-0" size={24} />
                    <div>
                        <h4 className={benefitTitleClass}>Apoio Social</h4>
                        <p className={benefitDescClass}>As equipes filiadas participam do ranking anual com premiação até o 7º lugar e podem receber cestas básicas como suporte social.</p>
                    </div>
                </div>
            </div>
            <div className={cardClass}>
                <div className="flex gap-4">
                    <ShieldCheck className="text-cbjjs-blue shrink-0" size={24} />
                    <div>
                        <h4 className={benefitTitleClass}>Eventos Sociais</h4>
                        <p className={benefitDescClass}>Acesso a competições com valores de inscrição reduzidos, mantendo o alto nível técnico e organização oficial da confederação.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Rodapé de Contato */}
      <div className="pt-10 border-t dark:border-slate-800 text-center">
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Confederação Brasileira de Jiu-Jitsu Social</p>
      </div>
    </div>
  );
};