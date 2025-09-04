import { supabase } from '@/integrations/supabase/client';

// Tipos para endereço
export interface Address {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

// Dados retornados pela API ViaCEP
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Estados brasileiros
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

/**
 * Formatar CEP para exibição (00000-000)
 */
export const formatZipCode = (zipCode: string): string => {
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length !== 8) return zipCode;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
};

/**
 * Limpar CEP (remover formatação)
 */
export const cleanZipCode = (zipCode: string): string => {
  return zipCode.replace(/\D/g, '');
};

/**
 * Validar formato do CEP
 */
export const validateZipCode = (zipCode: string): boolean => {
  const cleaned = cleanZipCode(zipCode);
  return /^\d{8}$/.test(cleaned);
};

/**
 * Buscar endereço pela API ViaCEP
 */
export const fetchAddressByZipCode = async (zipCode: string): Promise<Partial<Address> | null> => {
  const cleaned = cleanZipCode(zipCode);
  
  if (!validateZipCode(cleaned)) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return {
      zipCode: formatZipCode(data.cep),
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    throw error;
  }
};

/**
 * Validar se todos os campos obrigatórios do endereço estão preenchidos
 */
export const validateAddress = (address: Partial<Address>): string[] => {
  const errors: string[] = [];

  if (!address.zipCode || !validateZipCode(address.zipCode)) {
    errors.push('CEP é obrigatório e deve ter formato válido');
  }

  if (!address.street?.trim()) {
    errors.push('Logradouro é obrigatório');
  }

  if (!address.number?.trim()) {
    errors.push('Número é obrigatório');
  }

  if (!address.neighborhood?.trim()) {
    errors.push('Bairro é obrigatório');
  }

  if (!address.city?.trim()) {
    errors.push('Cidade é obrigatória');
  }

  if (!address.state?.trim()) {
    errors.push('Estado é obrigatório');
  }

  return errors;
};

/**
 * Verificar se endereço já está cadastrado no sistema
 */
export const validateUniqueAddress = async (address: Address, excludeUserId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('poupeja_users')
      .select('id')
      .eq('zip_code', cleanZipCode(address.zipCode))
      .eq('street', address.street.trim())
      .eq('number', address.number.trim())
      .eq('neighborhood', address.neighborhood.trim())
      .eq('city', address.city.trim())
      .eq('state', address.state.trim());

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao validar endereço único:', error);
      return true; // Em caso de erro, permite continuar
    }

    return data.length === 0;
  } catch (error) {
    console.error('Erro ao validar endereço único:', error);
    return true; // Em caso de erro, permite continuar
  }
};

/**
 * Formatar endereço para exibição
 */
export const formatAddressDisplay = (address: Partial<Address>): string => {
  const parts = [
    address.street,
    address.number,
    address.complement,
    address.neighborhood,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);

  return parts.join(', ');
};