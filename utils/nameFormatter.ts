/**
 * Formata o nome para exibição em espaços reduzidos.
 * Mantém o primeiro e o último nome completos e abrevia os nomes do meio.
 * Exemplo: "Maicon Alves Silveira Eleuterio" -> "Maicon A. S. Eleuterio"
 */
export const formatNameForMobile = (fullName: string): string => {
    if (!fullName) return '';
    
    // Remove espaços extras e divide o nome
    const parts = fullName.trim().split(/\s+/);
    
    // Se o nome tiver apenas 1 ou 2 partes, retorna como está
    if (parts.length <= 2) return fullName;

    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    // Pega os nomes do meio
    const middleNames = parts.slice(1, -1);
    
    // Mapeia os nomes do meio para iniciais com ponto
    // Ignora preposições curtas (de, da, do, dos, das) se desejar, 
    // mas seguindo seu exemplo, abreviaremos todos os intermediários.
    const initials = middleNames.map(name => {
        if (name.length <= 2 && /^(de|da|do|dos|das)$/i.test(name)) {
            return null; // Remove preposições para ganhar ainda mais espaço
        }
        return `${name.charAt(0).toUpperCase()}.`;
    }).filter(Boolean); // Remove os nulos (preposições)

    return `${firstName} ${initials.join(' ')} ${lastName}`;
};