/**
 * Utilitários para manipulação de CPF.
 */

/**
 * Formata CPF com mascara 000.000.000-00.
 * Aceita entrada com ou sem caracteres e aplica mascara.
 */
export function formatarCpf(valor: string): string {
  const apenas_numeros = valor.replace(/\D/g, '');
  const truncado = apenas_numeros.slice(0, 11);

  if (truncado.length <= 3) {
    return truncado;
  }
  if (truncado.length <= 6) {
    return `${truncado.slice(0, 3)}.${truncado.slice(3)}`;
  }
  if (truncado.length <= 9) {
    return `${truncado.slice(0, 3)}.${truncado.slice(3, 6)}.${truncado.slice(6)}`;
  }
  return `${truncado.slice(0, 3)}.${truncado.slice(3, 6)}.${truncado.slice(6, 9)}-${truncado.slice(9, 11)}`;
}

/**
 * Valida um CPF incluindo dígitos verificadores.
 * Entrada pode ter ou sem formatacao. Rejeita CPF com dígitos repetidos.
 */
export function validarCpf(cpf_input: string): boolean {
  const cpf = cpf_input.replace(/\D/g, '');

  // Rejeita CPF muito curto
  if (cpf.length !== 11) {
    return false;
  }

  // Rejeita CPF com todos os digitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Validar primeiro digito verificador
  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.substring(9, 10))) {
    return false;
  }

  // Validar segundo digito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.substring(10, 11))) {
    return false;
  }

  return true;
}

/**
 * Remove formatação do CPF (pontos e traço).
 * Pronto para enviar à API.
 */
export function limparCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
