# Checklist de Abertura da Votação Real

> Documento operacional. Nenhum item técnico abaixo dispensa a **decisão da comissão/RH**
> nos pontos marcados como **[DECISÃO EXTERNA]**. O sistema não inventa regra de negócio.

Referência: PRD §5.5 (desempate), §7 (importação), §12 (pendências).

---

## 1. Bloqueantes de regulamento — [DECISÃO EXTERNA]

Estes itens **precisam estar no regulamento antes da abertura**. O sistema não decide por eles.

- [ ] **Critério de desempate publicado** (PRD §5.5). Opções usuais: maior tempo de serviço, sorteio público, decisão da comissão. O sistema apenas sinaliza o empate — não escolhe vencedor.
- [ ] **Limite mínimo de servidores por setor** definido (PRD §5.1). Sugestão do PRD: 10. Setores abaixo vão para o guarda-chuva.
- [ ] **Destino do candidato único** decidido (PRD §5.2). Premiado por aclamação ou fora da premiação — fora do sistema.
- [ ] **Consentimento de foto** coletado, se a comissão optar por fotos na cédula (PRD §8.3). Sem termo assinado, o item cai.
- [ ] **Domínio do sistema** definido (PRD §12.5).

## 2. Preparação da base

- [ ] XLS do RH confirmado com campo Setor/Lotação (PRD §12.6)
- [ ] Base importada via tela de upload
- [ ] Relatório de erros de importação revisado (CPFs inválidos, datas ausentes, setores ausentes)
- [ ] Normalização de setores conferida (de-para de grafias, agrupamento de setores pequenos)
- [ ] Total de eleitores por setor conferido pela comissão
- [ ] Candidatos cadastrados e **homologados pela comissão**
- [ ] Setores com 0 ou 1 candidato identificados (não vão à votação — PRD §5.2)

## 3. Verificação técnica

- [ ] Migrações aplicadas no banco de produção (`npm run db:migrate`)
- [ ] Backup pré-abertura gerado (`infra/scripts/backup.sh`)
- [ ] Teste de restauração do backup executado com SUCESSO (`infra/scripts/test-restore.sh`)
- [ ] Ensaio ponta a ponta executado com dados fictícios (`infra/scripts/ensaio.ts`)
- [ ] Deploy no Coolify funcionando (web + api acessíveis via HTTPS)
- [ ] Healthchecks verdes (web, api, postgres, redis)
- [ ] Variáveis de ambiente de produção configuradas (JWT_SECRET forte, POSTGRES_PASSWORD forte)
- [ ] Backup scheduled do Postgres ativado no Coolify (retenção 90 dias — LGPD)

## 4. Verificação de anonimato (regras invioláveis)

- [ ] Confirmado: painel admin não exibe parcial de votos durante a votação (regra #1)
- [ ] Confirmado: nenhuma query liga Participacao a Voto (regra #2)
- [ ] Confirmado: timestamps arredondados para 5 min (regra #3)
- [ ] Confirmado: comprovante PDF não contém nome do votado (regra #4)
- [ ] Confirmado: cédula escopada ao setor no backend (regra #5)

## 5. Janela de votação

- [ ] `data_inicio` e `data_fim` configuradas com timezone America/Sao_Paulo
- [ ] Override manual (abrir/fechar) testado e registrando em log

## 6. Pós-votação (lembrete)

- [ ] Apuração manual executada após o fechamento (não antes)
- [ ] Ranking completo entregue à comissão (restrito)
- [ ] Empates sinalizados encaminhados à comissão para decisão externa
- [ ] Divulgação: apenas o vencedor de cada setor
- [ ] Expurgo agendado para 90 dias após a divulgação (`/api/admin/retencao`)

---

**A abertura só ocorre quando todos os itens da seção 1 estiverem resolvidos pela comissão.**
Os itens da seção 1 são bloqueantes e externos ao sistema — o time de TI não os decide.
