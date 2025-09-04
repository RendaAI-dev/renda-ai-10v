// CPF validation and formatting utilities

/**
 * Validates a Brazilian CPF number
 * @param cpf - CPF string (can be formatted or unformatted)
 * @returns boolean - true if CPF is valid
 */
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  
  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Check basic format
  if (cleanCPF.length !== 11) return false;
  
  // Check for repeated digits (invalid CPFs)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder < 2 ? 0 : remainder;
  
  // Check first digit
  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder < 2 ? 0 : remainder;
  
  // Check second digit
  return digit2 === parseInt(cleanCPF.charAt(10));
};

/**
 * Formats a CPF string with dots and dash
 * @param cpf - Unformatted CPF string
 * @returns string - Formatted CPF (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  
  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
};

/**
 * Removes formatting from CPF
 * @param cpf - Formatted CPF string
 * @returns string - Clean CPF with only digits
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/[^\d]/g, '');
};

/**
 * Validates minimum age (18 years)
 * @param birthDate - Date object or string
 * @returns boolean - true if age is 18 or older
 */
export const validateAge = (birthDate: Date | string): boolean => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // If the birthday hasn't occurred this year yet, subtract one from age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};