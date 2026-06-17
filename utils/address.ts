
export const fetchAddressByZip = async (zip: string) => {
  const cleanZip = zip.replace(/\D/g, '');
  if (cleanZip.length !== 8) return null;

  // Controller para evitar que a requisição ao ViaCEP fique pendente infinitamente
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, {
        signal: controller.signal
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    clearTimeout(timeoutId);
    
    if (data.erro) return null;

    return {
      street: data.logradouro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento || ''
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Se for erro de rede ou timeout, apenas logamos e retornamos null
    // para que o usuário possa preencher manualmente.
    console.warn("CEP Lookup Failed (Network/Timeout):", error.message);
    return null;
  }
};
