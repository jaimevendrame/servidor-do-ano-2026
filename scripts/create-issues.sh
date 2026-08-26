#!/usr/bin/env bash
set -euo pipefail
REPO=jaimevendrame/servidor-do-ano-2026

nova() { # nova "milestone" "titulo" "labels" "corpo"
  gh issue create -R "$REPO" --milestone "$1" --title "$2" --label "$3" --body "$4"
}

# ---------- M0 ----------
nova "M0 — Fundação" "Scaffolding do monorepo (web + api)" "infra" \
"Workspaces npm, Next.js em apps/web, NestJS em apps/api, TypeScript strict, ESLint e Prettier compartilhados."
nova "M0 — Fundação" "docker-compose de desenvolvimento" "infra" \
"Postgres e Redis locais, .env.example funcional, README com o passo a passo de subida."
nova "M0 — Fundação" "CI de lint, build e testes" "infra" \
"GitHub Actions rodando em todo PR para main."

# ---------- M1 ----------
nova "M1 — Modelo de dados" "Schema Prisma das entidades de domínio" "backend,dominio" \
"Edicao, Setor, Candidato, Eleitor, Voto, Participacao, LogAuditoria.

Participacao e Voto SEM relação entre si — ver regra 2 do CLAUDE.md."
nova "M1 — Modelo de dados" "Arredondamento de timestamp em janelas de 5 min" "backend,dominio" \
"Helper único usado por Voto e Participacao. Coberto por teste."
nova "M1 — Modelo de dados" "Seed de desenvolvimento com dados gerados" "backend" \
"Nenhum dado real de servidor. Faker com CPFs válidos sintéticos."

# ---------- M2 ----------
nova "M2 — Importação da base" "Upload e parsing do XLS do RH" "backend" \
"Campos: Nome, CPF, Data de Nascimento, Data de Admissão, Cargo, Setor/Lotação."
nova "M2 — Importação da base" "Validação e relatório de erros por linha" "backend" \
"CPF inválido, data de admissão ausente/inválida e setor ausente rejeitam a linha. Duplicado no arquivo: mantém a admissão mais antiga."
nova "M2 — Importação da base" "Tela de normalização de setores" "frontend,dominio" \
"De-para dos setores distintos encontrados, agrupamento de equivalentes e marcação dos setores abaixo do limite mínimo para o guarda-chuva. Confirmação explícita do admin antes de gravar. Ponto mais sensível do sistema — ver PRD §7."
nova "M2 — Importação da base" "Merge incremental na reimportação" "backend" \
"Atualiza existentes por CPF, insere novos, prevalece o setor da última importação. Bloqueada com a votação aberta."

# ---------- M3 ----------
nova "M3 — Autenticação" "Login do eleitor por CPF + data de admissão" "backend,seguranca" \
"Sessão curta, sem cadastro de senha."
nova "M3 — Autenticação" "Rate limiting e bloqueio de CPF" "backend,seguranca" \
"3 tentativas inválidas consecutivas bloqueiam o CPF por 15 minutos (Redis)."
nova "M3 — Autenticação" "Admin com senha + TOTP" "backend,seguranca" \
"Contas individuais, enrollment de TOTP, recuperação manual."

# ---------- M4 ----------
nova "M4 — Candidatos" "CRUD de candidatos vinculados a setores" "backend,frontend" \
"Validação: candidato existe na base e pertence ao setor. Ordem de exibição na cédula."
nova "M4 — Candidatos" "Regra de setor sem votação" "backend,dominio" \
"Setor com zero ou um candidato não vai à votação; eleitores recebem tela explicativa."

# ---------- M5 ----------
nova "M5 — Votação" "Cédula escopada ao setor do eleitor" "frontend,dominio" \
"Escolha única. Escopo validado no backend, nunca só no front."
nova "M5 — Votação" "Confirmação e gravação transacional do voto" "backend,dominio" \
"Janela validada no submit. Voto irreversível e idempotente. Participacao e Voto gravados na mesma transação, sem vínculo entre si."
nova "M5 — Votação" "Comprovante em PDF" "backend" \
"Gerado server-side. Brasão, edição, setor, confirmação de participação, timestamp e hash. NUNCA o nome do votado."
nova "M5 — Votação" "Tela de reentrada de quem já votou" "frontend" \
"Informa data/hora e permite rebaixar o comprovante. Não revela a escolha."
nova "M5 — Votação" "Abertura e fechamento automáticos da janela" "backend" \
"data_inicio/data_fim com timezone. Override manual do admin registrado em log."

# ---------- M6 ----------
nova "M6 — Apuração e auditoria" "Painel admin sem parciais" "frontend,dominio" \
"Durante a votação exibe apenas total de participação. Nenhuma distribuição de votos — nem para o admin."
nova "M6 — Apuração e auditoria" "Apuração por setor com sinalização de empate" "backend,dominio" \
"Ranking completo por setor, restrito à comissão. Empate é sinalizado e NÃO resolvido pelo sistema."
nova "M6 — Apuração e auditoria" "Logs de auditoria e exportação CSV" "backend,seguranca" \
"Toda ação administrativa logada com ator, ação e timestamp."
nova "M6 — Apuração e auditoria" "Rotina de retenção de 90 dias" "backend,seguranca" \
"Expurgo da base de eleitores e logs 90 dias após a divulgação."

# ---------- M7 ----------
nova "M7 — Deploy" "Stack Swarm com Traefik" "infra" \
"Rede network_public, TLS, healthchecks."
nova "M7 — Deploy" "Deploy via API do Portainer" "infra" \
"Token em secret do Actions. Deploy a partir da main."
nova "M7 — Deploy" "Backup do Postgres antes da abertura" "infra,seguranca" \
"Dump automatizado e teste de restauração."

# ---------- M8 ----------
nova "M8 — Ensaio e go-live" "Ensaio com base real e candidatos fictícios" "dominio" \
"~30 servidores, votação completa de ponta a ponta, apuração e expurgo dos dados do ensaio."
nova "M8 — Ensaio e go-live" "Checklist de abertura da votação real" "dominio,bloqueante" \
"Critério de desempate publicado no regulamento, limite mínimo de setor definido, base importada e conferida, candidatos homologados pela comissão."
