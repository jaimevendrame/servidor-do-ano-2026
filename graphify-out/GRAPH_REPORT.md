# Graph Report - .  (2026-08-27)

## Corpus Check
- Corpus is ~30,606 words - fits in a single context window. You may not need a graph.

## Summary
- 830 nodes · 1440 edges · 54 communities (39 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Importacao XLS e DTOs
- Modulos NestJS e Auth
- CRUD de Candidatos
- DevDeps e Seed (faker)
- ESLint/Prettier config
- Deps do Frontend
- Layout e Header/Footer
- Infra e Docs de dominio
- Login Admin (TOTP)
- Config de testes (Jest)
- tsconfig shared
- Fluxo confirmacao voto
- Controle da Janela
- Tela de Importacao (UI)
- tsconfig web
- Apuracao e Auditoria (UI)
- Auditoria e Retencao (svc)
- tsconfig api
- Modulo Apuracao
- Timestamp e Voto
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 53

## God Nodes (most connected - your core abstractions)
1. `PrismaService` - 50 edges
2. `PRD — Sistema de Votação Servidor do Ano 2026` - 22 edges
3. `compilerOptions` - 17 edges
4. `Button` - 15 edges
5. `api` - 14 edges
6. `scripts` - 13 edges
7. `RateLimitService` - 13 edges
8. `LinhaValidada` - 13 edges
9. `ApiError` - 13 edges
10. `getEleitor()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `PRD — Sistema de Votação Servidor do Ano 2026` --references--> `Brasão (SVG institucional)`  [EXTRACTED]
  docs/PRD.md → apps/web/public/brasao.svg
- `Brasão (SVG institucional)` --implements--> `Princípio: Comprovante PDF sem nome do votado`  [INFERRED]
  apps/web/public/brasao.svg → docs/PRD.md
- `Workflow /loop (ciclo de issue)` --references--> `PRD — Sistema de Votação Servidor do Ano 2026`  [EXTRACTED]
  .claude/commands/loop.md → docs/PRD.md
- `README do projeto` --references--> `PRD — Sistema de Votação Servidor do Ano 2026`  [EXTRACTED]
  README.md → docs/PRD.md
- `docker-compose Coolify (produção)` --shares_data_with--> `docker-compose.yml (stack dev)`  [INFERRED]
  infra/coolify/docker-compose.yml → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fluxo de verificação pré-abertura** — docs_checklist_abertura_checklist_abertura, infra_scripts_readme_scripts_readme_backup, infra_scripts_readme_scripts_readme_ensaio, infra_coolify_readme_coolify_readme, docs_prd_prd_empate_regra [EXTRACTED 1.00]
- **Invariantes de anonimato do domínio** — docs_prd_prd_voto, docs_prd_prd_participacao, docs_prd_prd_arredondamento_timestamp, docs_prd_prd_setor_guarda_chuva, docs_prd_prd_anonimato_logico [EXTRACTED 1.00]
- **Ciclo /loop: branch → testes → checklist → PR** — dot_claude_commands_loop_loop, dot_claude_commands_loop_loop_checklist_dominio, dot_github_workflows_ci_ci, docs_prd_prd [INFERRED 0.85]

## Communities (54 total, 15 thin omitted)

### Community 0 - "Importacao XLS e DTOs"
Cohesion: 0.08
Nodes (38): xlsx, GravarDto, PreviewNormalizacaoDto, SetoresDto, ValidarLinhasDto, LinhaXlsRaw, ResultadoParsing, GravacaoService (+30 more)

### Community 1 - "Modulos NestJS e Auth"
Cohesion: 0.07
Nodes (27): AppModule, Module, AuthController, TODO: quando tiver multiplas edicoes, pegar da request, Body, Controller, Post, AuthModule (+19 more)

### Community 2 - "CRUD de Candidatos"
Cohesion: 0.08
Nodes (21): CandidatosController, Body, Controller, Get, Param, Post, Put, Query (+13 more)

### Community 3 - "DevDeps e Seed (faker)"
Cohesion: 0.05
Nodes (37): devDependencies, @faker-js/faker, jest, @nestjs/cli, @nestjs/testing, prisma, ts-jest, ts-node (+29 more)

### Community 4 - "ESLint/Prettier config"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-prettier, eslint-plugin-prettier, description, devDependencies, eslint, eslint-config-prettier, eslint-plugin-prettier (+27 more)

### Community 5 - "Deps do Frontend"
Cohesion: 0.06
Nodes (31): dependencies, axios, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-slot (+23 more)

### Community 6 - "Layout e Header/Footer"
Cohesion: 0.07
Nodes (27): inter, metadata, Footer(), Header(), extends, ignorePatterns, build, dist (+19 more)

### Community 7 - "Infra e Docs de dominio"
Cohesion: 0.11
Nodes (30): Brasão (SVG institucional), docker-compose.yml (stack dev), Checklist de Abertura da Votação Real, PRD — Sistema de Votação Servidor do Ano 2026, Princípio: Anonimato lógico (Voto/Participacao separados), Conceito: Apuração manual, Princípio: Timestamps arredondados (janela 5 min), Conceito: Candidato (+22 more)

### Community 8 - "Login Admin (TOTP)"
Cohesion: 0.13
Nodes (16): AdminController, Body, Controller, Post, AdminService, Injectable, AdminTotpVerifyDto, LoginAdminDto (+8 more)

### Community 9 - "Config de testes (Jest)"
Cohesion: 0.07
Nodes (27): devDependencies, autoprefixer, jest, jest-environment-jsdom, postcss, tailwindcss, tailwindcss-animate, ts-jest (+19 more)

### Community 10 - "tsconfig shared"
Cohesion: 0.07
Nodes (26): ./packages/shared/src, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames (+18 more)

### Community 11 - "Fluxo confirmacao voto"
Cohesion: 0.23
Nodes (17): ConfirmarPage(), ConfirmarVotoPage(), JaVotouPage(), RegistradoPage(), SetorSemVotacaoPage(), clearToken(), downloadComprovante(), clearSession() (+9 more)

### Community 12 - "Controle da Janela"
Cohesion: 0.13
Nodes (11): JanelaController, Body, Controller, Get, Param, Post, Put, CriarJanelaDto (+3 more)

### Community 13 - "Tela de Importacao (UI)"
Cohesion: 0.11
Nodes (21): Etapa, ImportacaoPage(), Label, LabelProps, AtualizarCandidatoDto, Candidato, CandidatoRanking, CriarCandidatoDto (+13 more)

### Community 14 - "tsconfig web"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, baseUrl, incremental, isolatedModules, jsx, lib, noEmit (+14 more)

### Community 15 - "Apuracao e Auditoria (UI)"
Cohesion: 0.14
Nodes (10): ApuracaoPage(), AuditoriaPage(), Filtros, CandidatosPage(), api, ApiError, getAdminToken(), LogEntry (+2 more)

### Community 16 - "Auditoria e Retencao (svc)"
Cohesion: 0.16
Nodes (6): LogEntry, ResultadoExpurgo, SetoresController, Controller, PrismaService, Injectable

### Community 17 - "tsconfig api"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, emitDecoratorMetadata, experimentalDecorators, module, noEmit, outDir, paths (+10 more)

### Community 18 - "Modulo Apuracao"
Cohesion: 0.16
Nodes (9): ApuracaoModule, Module, AuditoriaController, Controller, Get, Query, Res, AuditoriaService (+1 more)

### Community 19 - "Timestamp e Voto"
Cohesion: 0.18
Nodes (9): arredondarTimestamp(), Body, Controller, Post, VotoController, Injectable, VotoDto, VotoResult (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (13): FORM_VAZIO, FormState, DialogContent, DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle() (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (9): ApuracaoController, Controller, Get, Param, ApuracaoService, CandidatoRanking, ResultadoApuracao, ResultadoSetor (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (15): dependencies, @nestjs/common, @nestjs/core, @nestjs/passport, @nestjs/platform-express, pdfkit, reflect-metadata, rxjs (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (8): RetencaoController, Body, Controller, Get, Param, Post, RetencaoService, Injectable

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (8): CedulaController, Controller, Get, Param, Cedula, CedulaService, ItemCedula, Injectable

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (7): ComprovanteController, Controller, Get, Param, Res, ComprovanteService, Injectable

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (8): ReentradaController, Controller, Get, Param, Query, ReentradaService, StatusParticipacao, Injectable

### Community 27 - "Community 27"
Cohesion: 0.21
Nodes (7): PainelAdminController, Controller, Get, Param, PainelAdmin, PainelAdminService, Injectable

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (13): scripts, build, db:migrate, db:migrate:dev, db:seed, db:studio, dev, lint (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (10): AdminLoginPage(), Etapa, AdminPage(), clearAdminSession(), clearAdminToken(), setAdminToken(), JanelaStatusApi, LoginAdminDto (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (8): CedulaPage(), Button, ButtonProps, buttonVariants, setVotoEscolhido(), Cedula, JanelaStatus, StatusParticipacao

### Community 31 - "Community 31"
Cohesion: 0.42
Nodes (7): LoginPage(), setToken(), formatarCpf(), limparCpf(), validarCpf(), LoginEleitorDto, LoginResponseDto

### Community 32 - "Community 32"
Cohesion: 0.38
Nodes (6): @prisma/client, arredondar5min(), ensaio(), gerarCPF(), prisma, @prisma/client

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): name, prisma, seed, private, version

### Community 35 - "Community 35"
Cohesion: 0.60
Nodes (4): gerarCPF(), gerarCPFsUnicos(), prisma, seed()

## Knowledge Gaps
- **225 isolated node(s):** `root`, `dist`, `build`, `node_modules`, `**/*.d.ts` (+220 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 22` to `Community 32`, `Importacao XLS e DTOs`, `Community 34`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Importacao XLS e DTOs` to `Community 22`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `root`, `dist`, `build` to the rest of the system?**
  _225 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Importacao XLS e DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Modulos NestJS e Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.06745098039215686 - nodes in this community are weakly interconnected._
- **Should `CRUD de Candidatos` be split into smaller, more focused modules?**
  _Cohesion score 0.07610993657505286 - nodes in this community are weakly interconnected._
- **Should `DevDeps e Seed (faker)` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._