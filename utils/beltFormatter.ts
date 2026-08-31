export const DEFAULT_BELT_MAPPINGS: Record<string, string> = {
  "BRANCA": "Branca",
  "CINZA": "Cinza",
  "AMARELA": "Amarela",
  "LARANJA": "Laranja",
  "VERDE": "Verde",
  "AZUL": "Azul",
  "ROXA": "Roxa",
  "MARROM": "Marrom",
  "PRETA": "Preta",
  "PRETA 1º GRAU": "Preta",
  "PRETA 2º GRAU": "Preta",
  "PRETA 3º GRAU": "Preta",
  "PRETA 4º GRAU": "Preta",
  "PRETA 5º GRAU": "Preta",
  "PRETA 6º GRAU": "Preta",
  "VERMELHA E PRETA": "Vermelha e Preta",
  "VERMELHA E BRANCA": "Vermelha e Branca",
  "VERMELHA": "Vermelha"
};

/**
 * Formata a faixa para exibição na carteirinha de acordo com o mapeamento dinâmico configurado no banco de dados.
 * Caso não haja mapeamento específico, usa a regra de fallback padrão.
 */
export const formatBeltForDisplay = (belt: string, customMappings?: Record<string, string>): string => {
  if (!belt) return 'Branca';

  const normalized = belt.trim().toUpperCase();
  const mappings = customMappings || DEFAULT_BELT_MAPPINGS;

  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Busca case-insensitive no mapa caso não tenha match exato
  const matchingKey = Object.keys(mappings).find(
    k => k.trim().toUpperCase() === normalized
  );
  if (matchingKey && mappings[matchingKey]) {
    return mappings[matchingKey];
  }

  // Fallback de segurança caso seja uma chave não mapeada
  if (normalized.includes('VERMELHA')) return 'Vermelha';
  if (normalized.includes('PRETA')) return 'Preta';

  return belt.split(/\d/)[0].trim();
};
