/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

// Gera CPF vÃ¡lido sintÃ©tico (formato: XXX.XXX.XXX-XX)
function gerarCPF(): string {
  const parte1 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const parte2 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const parte3 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const digito1 = Math.floor(Math.random() * 10);
  const digito2 = Math.floor(Math.random() * 10);
  return `${parte1}.${parte2}.${parte3}-${digito1}${digito2}`;
}

async function seed(): Promise<void> {
  console.log('Limpando banco de dados...');
  await prisma.participacao.deleteMany({});
  await prisma.voto.deleteMany({});
  await prisma.candidato.deleteMany({});
  await prisma.eleitor.deleteMany({});
  await prisma.janelaVotacao.deleteMany({});
  await prisma.setor.deleteMany({});
  await prisma.logAuditoria.deleteMany({});
  await prisma.edicao.deleteMany({});

  console.log('Criando ediÃ§Ã£o 2026...');
  const edicao = await prisma.edicao.create({
    data: {
      ano: 2026,
      ativo: true,
    },
  });

  console.log('Criando setores...');
  const setores = await Promise.all([
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Administrativo',
        nomeExibido: 'Administrativo',
        agrupado: false,
      },
    }),
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Tecnologia da InformaÃ§Ã£o',
        nomeExibido: 'TI',
        agrupado: false,
      },
    }),
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Setores Pequenos Agrupados',
        nomeExibido: 'Guarda-chuva',
        agrupado: true,
      },
    }),
  ]);

  console.log('Gerando 30 eleitores com CPFs sintÃ©ticos...');
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

  console.log('Criando 5 candidatos por setor...');
  for (const setor of setores) {
    for (let i = 0; i < 5; i++) {
      // ~60% dos eleitores do setor viram candidatos
      const candidatoMaybe = eleitores.find(e => e.setorId === setor.id && Math.random() < 0.6);

      await prisma.candidato.create({
        data: {
          edicaoId: edicao.id,
          setorId: setor.id,
          eleitorId: candidatoMaybe?.id,
          nome: candidatoMaybe?.nome || faker.person.fullName(),
          cargo: faker.person.jobTitle(),
          ordemExibicao: i,
        },
      });
    }
  }

  console.log('Criando janela de votaÃ§Ã£o...');
  await prisma.janelaVotacao.create({
    data: {
      edicaoId: edicao.id,
      dataInicio: new Date('2026-09-01T08:00:00Z'),
      dataFim: new Date('2026-09-01T18:00:00Z'),
      timezone: 'America/Sao_Paulo',
      abertaManual: false,
      fechadaManual: false,
    },
  });

  console.log('Seed concluÃ­do âœ“');
  console.log(`- 1 ediÃ§Ã£o (2026)`);
  console.log(`- 3 setores`);
  console.log(`- 30 eleitores`);
  console.log(`- 15 candidatos (5 por setor)`);
  console.log(`- 1 janela de votaÃ§Ã£o`);
  console.log(`\nNenhum dado real de servidor. CPFs e dados de candidatos gerados.`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
