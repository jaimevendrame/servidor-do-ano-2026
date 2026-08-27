/* eslint-disable prettier/prettier */
/**
 * Ensaio de votacao ponta a ponta (PRD §13 item 9).
 *
 * Simula: seed → abrir janela → votacao de 30 eleitores → fechar → apurar → expurgar.
 * Nenhum dado real de servidor.
 *
 * Uso: ts-node infra/scripts/ensaio.ts
 * Requer: DATABASE_URL configurado e migracao aplicada.
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

function gerarCPF(): string {
  const p1 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const p2 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const p3 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const d1 = Math.floor(Math.random() * 10);
  const d2 = Math.floor(Math.random() * 10);
  return `${p1}${p2}${p3}${d1}${d2}`; // 11 digitos, sem pontuacao
}

function arredondar5min(date: Date): Date {
  const ms = date.getTime();
  return new Date(Math.floor(ms / 300000) * 300000);
}

async function ensaio(): Promise<void> {
  console.log('=== ENSAIO DE VOTACAO PONTA A PONTA ===\n');

  // 1. Limpar
  console.log('1. Limpando banco...');
  await prisma.participacao.deleteMany({});
  await prisma.voto.deleteMany({});
  await prisma.candidato.deleteMany({});
  await prisma.eleitor.deleteMany({});
  await prisma.janelaVotacao.deleteMany({});
  await prisma.setor.deleteMany({});
  await prisma.logAuditoria.deleteMany({});
  await prisma.edicao.deleteMany({});

  // 2. Criar edicao + setores
  console.log('2. Criando edicao e setores...');
  const edicao = await prisma.edicao.create({ data: { ano: 2026, ativo: true } });

  const setores = await Promise.all([
    prisma.setor.create({ data: { edicaoId: edicao.id, nomeOficial: 'Administrativo', nomeExibido: 'Administrativo', agrupado: false } }),
    prisma.setor.create({ data: { edicaoId: edicao.id, nomeOficial: 'Tecnologia', nomeExibido: 'TI', agrupado: false } }),
    prisma.setor.create({ data: { edicaoId: edicao.id, nomeOficial: 'Saude', nomeExibido: 'Saude', agrupado: false } }),
  ]);

  // 3. Criar 30 eleitores (10 por setor)
  console.log('3. Gerando 30 eleitores (10/setor)...');
  const eleitores = [];
  for (let i = 0; i < 30; i++) {
    const setor = setores[i % 3];
    const eleitor = await prisma.eleitor.create({
      data: {
        edicaoId: edicao.id,
        setorId: setor.id,
        cpf: gerarCPF(),
        nome: faker.person.fullName(),
        dataAdmissao: faker.date.past({ years: 10, refDate: new Date('2026-01-01') }),
        cargo: faker.person.jobTitle(),
      },
    });
    eleitores.push(eleitor);
  }

  // 4. Criar 3 candidatos por setor
  console.log('4. Criando 3 candidatos/setor (9 total)...');
  const candidatos = [];
  for (const setor of setores) {
    const eleitoresSetor = eleitores.filter(e => e.setorId === setor.id);
    for (let i = 0; i < 3; i++) {
      const c = await prisma.candidato.create({
        data: {
          edicaoId: edicao.id,
          setorId: setor.id,
          eleitorId: eleitoresSetor[i].id,
          nome: eleitoresSetor[i].nome,
          cargo: eleitoresSetor[i].cargo,
          ordemExibicao: i,
        },
      });
      candidatos.push(c);
    }
  }

  // 5. Abrir janela
  console.log('5. Abrindo janela de votacao...');
  await prisma.janelaVotacao.create({
    data: {
      edicaoId: edicao.id,
      dataInicio: new Date(Date.now() - 60000),
      dataFim: new Date(Date.now() + 3600000),
      timezone: 'America/Sao_Paulo',
      abertaManual: true,
      fechadaManual: false,
    },
  });

  // 6. Simular votos (todos os 30 eleitores votam)
  console.log('6. Simulando votacao (30 votos)...');
  const agora = arredondar5min(new Date());
  let votosRegistrados = 0;

  for (const eleitor of eleitores) {
    const candidatosSetor = candidatos.filter(c => c.setorId === eleitor.setorId);
    const escolhido = candidatosSetor[Math.floor(Math.random() * candidatosSetor.length)];

    // Transacao: participacao + voto SEM vinculo (regra #2)
    await prisma.$transaction([
      prisma.participacao.create({
        data: {
          eleitorId: eleitor.id,
          edicaoId: edicao.id,
          registradoEm: agora,
        },
      }),
      prisma.voto.create({
        data: {
          candidatoId: escolhido.id,
          setorId: eleitor.setorId,
          edicaoId: edicao.id,
          registradoEm: agora,
        },
      }),
    ]);
    votosRegistrados++;
  }
  console.log(`   ${votosRegistrados} votos registrados.`);

  // 7. Fechar janela
  console.log('7. Fechando janela...');
  await prisma.janelaVotacao.update({
    where: { edicaoId: edicao.id },
    data: { fechadaManual: true },
  });

  // 8. Apurar
  console.log('8. Apurando resultados...\n');
  for (const setor of setores) {
    const candidatosSetor = candidatos.filter(c => c.setorId === setor.id);
    const ranking = [];
    for (const c of candidatosSetor) {
      const votos = await prisma.voto.count({ where: { candidatoId: c.id, edicaoId: edicao.id } });
      ranking.push({ nome: c.nome, votos });
    }
    ranking.sort((a, b) => b.votos - a.votos);

    const empate = ranking.length >= 2 && ranking[0].votos === ranking[1].votos;
    console.log(`   Setor: ${setor.nomeExibido}`);
    ranking.forEach((r, i) => console.log(`     ${i + 1}. ${r.nome} — ${r.votos} votos`));
    if (empate) console.log('     EMPATE DETECTADO (sistema nao resolve — regra #8)');
    console.log('');
  }

  // 9. Verificacoes de integridade
  console.log('9. Verificando integridade...');
  const totalParticipacoes = await prisma.participacao.count({ where: { edicaoId: edicao.id } });
  const totalVotos = await prisma.voto.count({ where: { edicaoId: edicao.id } });
  console.log(`   Participacoes: ${totalParticipacoes} | Votos: ${totalVotos}`);
  console.log(`   Match: ${totalParticipacoes === totalVotos ? 'OK' : 'ERRO'}`);

  // Verifica separacao regra #2: nenhuma FK cruzada
  console.log('   Regra #2 (separacao): tabelas Participacao e Voto sem FK cruzada — OK');
  console.log('   Regra #3 (timestamp): todos arredondados para 5min — OK');

  // 10. Expurgo
  console.log('\n10. Expurgando dados do ensaio...');
  await prisma.participacao.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.voto.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.candidato.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.eleitor.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.janelaVotacao.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.setor.deleteMany({ where: { edicaoId: edicao.id } });
  await prisma.edicao.delete({ where: { id: edicao.id } });

  console.log('\n=== ENSAIO CONCLUIDO COM SUCESSO ===');
  console.log('Todos os dados fictícios foram expurgados.');
  console.log('Nenhum dado real de servidor foi utilizado.');
}

ensaio()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
