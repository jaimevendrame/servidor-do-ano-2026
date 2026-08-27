/* eslint-disable prettier/prettier */
import { LinhaValidada } from './validar-linhas';

export interface SetorDistinto {
  nomeOriginal: string;
  totalServidores: number;
}

export interface RegraNormalizacao {
  // de-para: mapeia nomes originais → nome oficial normalizado
  dePara: Record<string, string>;
  // setores marcados manualmente para o guarda-chuva
  guardaChuva: string[];
  // limite mínimo de servidores; abaixo disso vai para guarda-chuva
  limiteMinimo: number;
  // nome do setor guarda-chuva
  nomeGuardaChuva: string;
}

export interface SetorNormalizado {
  nomeOficial: string;
  nomeExibido: string;
  agrupado: boolean;
  totalServidores: number;
  origens: string[]; // nomes originais que caíram neste setor
}

export interface PreviewNormalizacao {
  setores: SetorNormalizado[];
  totalEleitores: number;
}

/**
 * Extrai a lista de setores distintos encontrados nas linhas validadas,
 * com a contagem de servidores em cada grafia.
 */
export function extrairSetoresDistintos(linhas: LinhaValidada[]): SetorDistinto[] {
  const contagem = new Map<string, number>();
  for (const linha of linhas) {
    contagem.set(linha.setor, (contagem.get(linha.setor) || 0) + 1);
  }
  return Array.from(contagem.entries())
    .map(([nomeOriginal, totalServidores]) => ({ nomeOriginal, totalServidores }))
    .sort((a, b) => b.totalServidores - a.totalServidores);
}

/**
 * Aplica as regras de normalização e retorna um preview do resultado.
 * NÃO grava nada — apenas calcula o resultado para conferência do admin (PRD §7).
 *
 * Regras:
 * - de-para agrupa grafias equivalentes num nome oficial
 * - setores marcados manualmente OU abaixo do limite mínimo vão para o guarda-chuva
 */
export function aplicarNormalizacao(
  linhas: LinhaValidada[],
  regra: RegraNormalizacao
): PreviewNormalizacao {
  // Passo 1: aplica de-para em cada linha para obter o nome oficial
  const nomeOficialPorOriginal = (original: string): string => {
    return regra.dePara[original] || original;
  };

  // Passo 2: agrupa por nome oficial, acumulando contagem e origens
  const grupos = new Map<string, { total: number; origens: Set<string> }>();
  for (const linha of linhas) {
    const oficial = nomeOficialPorOriginal(linha.setor);
    const grupo = grupos.get(oficial) || { total: 0, origens: new Set<string>() };
    grupo.total += 1;
    grupo.origens.add(linha.setor);
    grupos.set(oficial, grupo);
  }

  // Passo 3: decide guarda-chuva (marcado manual OU abaixo do limite)
  const setoresNormais: SetorNormalizado[] = [];
  let totalGuardaChuva = 0;
  const origensGuardaChuva = new Set<string>();

  for (const [oficial, grupo] of grupos.entries()) {
    const marcadoManual = regra.guardaChuva.includes(oficial);
    const abaixoLimite = grupo.total < regra.limiteMinimo;

    if (marcadoManual || abaixoLimite) {
      totalGuardaChuva += grupo.total;
      grupo.origens.forEach(o => origensGuardaChuva.add(o));
    } else {
      setoresNormais.push({
        nomeOficial: oficial,
        nomeExibido: oficial,
        agrupado: false,
        totalServidores: grupo.total,
        origens: Array.from(grupo.origens).sort(),
      });
    }
  }

  setoresNormais.sort((a, b) => b.totalServidores - a.totalServidores);

  const resultado: SetorNormalizado[] = [...setoresNormais];
  if (totalGuardaChuva > 0) {
    resultado.push({
      nomeOficial: regra.nomeGuardaChuva,
      nomeExibido: regra.nomeGuardaChuva,
      agrupado: true,
      totalServidores: totalGuardaChuva,
      origens: Array.from(origensGuardaChuva).sort(),
    });
  }

  return {
    setores: resultado,
    totalEleitores: linhas.length,
  };
}
