/* eslint-disable prettier/prettier */
import { LinhaXlsRaw } from './dto/linha-xls.dto';
import { validarCPF, limparCPF } from './validar-cpf';

export interface ErroLinha {
  linha: number;
  campo: string;
  motivo: string;
}

export interface LinhaValidada {
  nome: string;
  cpf: string; // limpo, 11 dÃ­gitos
  dataNascimento: string | undefined;
  dataAdmissao: string;
  cargo: string | undefined;
  setor: string;
  linhaOriginal: number;
}

export interface ResultadoValidacao {
  validas: LinhaValidada[];
  erros: ErroLinha[];
  duplicados: { cpf: string; linhaRemovida: number; linhaPreservada: number }[];
}

/**
 * Valida se uma string Ã© uma data parseable.
 */
function dataValida(valor: string | undefined): boolean {
  if (!valor) return false;
  const d = new Date(valor);
  return !isNaN(d.getTime());
}

/**
 * Valida linhas raw e aplica regras PRD Â§7:
 * - CPF invÃ¡lido â†’ rejeita
 * - Data admissÃ£o ausente/invÃ¡lida â†’ rejeita
 * - Setor ausente â†’ rejeita
 * - CPF duplicado â†’ mantÃ©m admissÃ£o mais antiga
 */
export function validarLinhas(linhas: LinhaXlsRaw[]): ResultadoValidacao {
  const erros: ErroLinha[] = [];
  const validas: LinhaValidada[] = [];

  // Passo 1: validaÃ§Ã£o individual
  for (const linha of linhas) {
    const errosLinha: ErroLinha[] = [];

    if (!linha.nome || linha.nome.trim().length === 0) {
      errosLinha.push({ linha: linha.linhaOriginal, campo: 'nome', motivo: 'Nome ausente' });
    }

    if (!linha.cpf || !validarCPF(linha.cpf)) {
      errosLinha.push({
        linha: linha.linhaOriginal,
        campo: 'cpf',
        motivo: !linha.cpf ? 'CPF ausente' : 'CPF invalido',
      });
    }

    if (!dataValida(linha.dataAdmissao)) {
      errosLinha.push({
        linha: linha.linhaOriginal,
        campo: 'dataAdmissao',
        motivo: !linha.dataAdmissao ? 'Data de admissao ausente' : 'Data de admissao invalida',
      });
    }

    if (!linha.setor || linha.setor.trim().length === 0) {
      errosLinha.push({
        linha: linha.linhaOriginal,
        campo: 'setor',
        motivo: 'Setor ausente',
      });
    }

    if (errosLinha.length > 0) {
      erros.push(...errosLinha);
    } else {
      validas.push({
        nome: linha.nome!.trim(),
        cpf: limparCPF(linha.cpf!),
        dataNascimento: linha.dataNascimento || undefined,
        dataAdmissao: linha.dataAdmissao!,
        cargo: linha.cargo || undefined,
        setor: linha.setor!.trim(),
        linhaOriginal: linha.linhaOriginal,
      });
    }
  }

  // Passo 2: deduplicaÃ§Ã£o por CPF â€” mantÃ©m admissÃ£o mais antiga
  const duplicados: ResultadoValidacao['duplicados'] = [];
  const porCPF = new Map<string, LinhaValidada[]>();

  for (const v of validas) {
    const existentes = porCPF.get(v.cpf) || [];
    existentes.push(v);
    porCPF.set(v.cpf, existentes);
  }

  const deduplicadas: LinhaValidada[] = [];
  for (const [cpf, grupo] of porCPF.entries()) {
    if (grupo.length === 1) {
      deduplicadas.push(grupo[0]);
    } else {
      // Ordena por data admissÃ£o (mais antiga primeiro)
      grupo.sort(
        (a, b) => new Date(a.dataAdmissao).getTime() - new Date(b.dataAdmissao).getTime()
      );
      deduplicadas.push(grupo[0]);
      for (let i = 1; i < grupo.length; i++) {
        duplicados.push({
          cpf,
          linhaRemovida: grupo[i].linhaOriginal,
          linhaPreservada: grupo[0].linhaOriginal,
        });
      }
    }
  }

  return { validas: deduplicadas, erros, duplicados };
}
