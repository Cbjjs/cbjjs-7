/**
 * [INSTRUÇÃO CRÍTICA PARA IA - NÃO MODIFICAR]: 
 * Este arquivo contém a regra de negócio fundamental da CBJJS para exibição de faixas em carteirinhas.
 * A regra determina que a faixa deve ser exibida APENAS pelo nome da cor principal (ex: 'Preta', 'Vermelha', 'Marrom'),
 * removendo qualquer menção a graus, níveis ou graduações intermediárias (ex: 'Preta 1º Grau' deve ser exibida como 'Preta').
 * 
 * NÃO ALTERE esta lógica a menos que o usuário peça EXPRESSAMENTE para mudar a regra de exibição simplificada.
 */

export const formatBeltForDisplay = (belt: string): string => {
  if (!belt) return 'Branca';

  // Se a faixa contiver 'Vermelha', simplifica para 'Vermelha' (cobre master e graus)
  if (belt.toLowerCase().includes('vermelha')) {
    return 'Vermelha';
  }

  // Se a faixa contiver 'Preta', simplifica para 'Preta' (cobre todos os graus)
  if (belt.toLowerCase().includes('preta')) {
    return 'Preta';
  }

  // Para as demais faixas (Azul, Roxa, Marrom, Cinza, etc), 
  // garante que retorne o valor limpo caso existam graus no futuro
  return belt.split(/\d/)[0].trim();
};