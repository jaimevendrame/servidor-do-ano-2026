import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { parsearCandidatosXls } from './parsear-candidatos-xls';

describe('parsearCandidatosXls', () => {
  it('deve parsear buffer com colunas válidas', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Candidatos');
    ws.addRow(['Nome', 'Setor', 'Cargo', 'Ordem']);
    ws.addRow(['João da Silva', 'Saúde', 'Médico', 1]);
    ws.addRow(['Maria Souza', 'Educação', 'Professora', 2]);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    const res = await parsearCandidatosXls(buffer);
    expect(res.colunasFaltando).toEqual([]);
    expect(res.totalLinhas).toBe(2);
    expect(res.linhas[0].nome).toBe('João da Silva');
    expect(res.linhas[0].setor).toBe('Saúde');
    expect(res.linhas[0].cargo).toBe('Médico');
    expect(res.linhas[0].ordemExibicao).toBe(1);
  });

  it('deve reportar colunas obrigatórias faltando', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Candidatos');
    ws.addRow(['Nome', 'Cargo']); // falta Setor
    ws.addRow(['João', 'Médico']);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    const res = await parsearCandidatosXls(buffer);
    expect(res.colunasFaltando).toContain('setor');
    expect(res.linhas).toHaveLength(0);
  });

  it('deve parsear corretamente o arquivo real docs/Indicações 2026.xlsx', async () => {
    const filePath = path.resolve(__dirname, '../../../../docs/Indicações 2026.xlsx');
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const res = await parsearCandidatosXls(buffer);
      expect(res.colunasFaltando).toEqual([]);
      expect(res.linhas.length).toBeGreaterThan(200);
      expect(res.linhas[0].nome).toBe('KARINA DA SILVA');
      expect(res.linhas[0].cpf).toBe('375.046.588-63');
      expect(res.linhas[0].cargo).toBe('AGENTE ADMINISTRATIVO');
      // Linha de total de registros deve ser ignorada
      const temLinhaTotal = res.linhas.some(l => l.nome?.includes('Total de Registros'));
      expect(temLinhaTotal).toBe(false);
    }
  });
});
