# Servidor do Ano 2026

Sistema de votação interna da premiação "Servidor do Ano" da prefeitura.
O PRD completo está em `docs/PRD.md` — leia antes de qualquer decisão de escopo.

## Stack
- `apps/web` — Next.js (App Router), TypeScript
- `apps/api` — NestJS, TypeScript, Prisma
- PostgreSQL + Redis (containers internos ao stack)
- Deploy: Docker Swarm + Traefik (rede `network_public`), via API do Portainer

## Regras invioláveis do domínio
1. **Nunca exibir parcial de votos durante a votação** — nem para o admin. Só o total de participação.
2. **`Participacao` e `Voto` são tabelas separadas e nunca se relacionam.** Não existe consulta que ligue eleitor a candidato. Se uma feature parecer exigir isso, ela está errada.
3. **Timestamps de voto e participação são arredondados** para janelas de 5 minutos.
4. **O comprovante em PDF jamais contém o nome do votado.**
5. **O eleitor só vê e só pode votar em candidatos do próprio setor.** O escopo por setor é validado no backend, nunca só no front.
6. **A janela de votação é validada no submit**, não no carregamento da tela.
7. **Voto é irreversível e idempotente** — um por eleitor por edição.
8. **Empate nunca é resolvido pelo sistema.** A apuração sinaliza e para.

## Convenções
- Commits: Conventional Commits em português (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Branches: `feat/<n>-slug`, `fix/<n>-slug`, onde `<n>` é o número da issue
- Todo PR referencia a issue com `Closes #<n>`
- Migrações sempre versionadas, nunca alteração manual de schema
- Sem dados reais de servidores em fixtures, seeds ou testes — sempre gerados

## Comandos
- `npm run dev` — sobe web + api
- `npm run lint` / `npm run test`
- `npm run db:migrate` / `npm run db:seed`