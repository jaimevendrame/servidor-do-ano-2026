/**
 * Valida um CPF (formato e dÃ­gitos verificadores).
 * Aceita com ou sem pontuaÃ§Ã£o (XXX.XXX.XXX-XX ou XXXXXXXXXXX).
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;

  // Rejeita sequÃªncias repetidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // CÃ¡lculo do primeiro dÃ­gito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(limpo.charAt(9))) return false;

  // CÃ¡lculo do segundo dÃ­gito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(limpo.charAt(10))) return false;

  return true;
}

/**
 * Limpa CPF para formato numÃ©rico (11 dÃ­gitos).
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
