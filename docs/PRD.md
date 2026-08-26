# PRD — Sistema de Votação "Servidor do Ano 2026"

> Documento consolidado a partir da descoberta inicial. Itens marcados como **[A CONFIRMAR]** dependem de definição da comissão/RH e não bloqueiam o início do desenvolvimento, exceto onde indicado.

---

## 1. Contexto e objetivo

Premiação interna promovida pela prefeitura para eleger o "Servidor do Ano 2026". Diferente da enquete de opinião anterior (projeto `enquete-ws`), aqui:

- o votado é uma **pessoa**, não uma opção abstrata;
- há **vários vencedores**, um por setor;
- o resultado é **divulgado publicamente** (apenas o vencedor de cada setor).

O risco central não é fraude eleitoral clássica, é **legitimidade interna e clima organizacional**: ninguém pode alegar depois que votou quem não devia, que o voto foi alterado, ou que o resultado expôs um colega.

## 2. Escopo do MVP

**Dentro:**

- Autenticação do eleitor (CPF + data de admissão)
- Importação da base de servidores via XLS/XLSX do RH, com normalização de setores
- Cadastro dos candidatos pela comissão/RH, vinculados a setores
- Cédula de escolha única, escopada ao setor do eleitor
- Confirmação de voto, comprovante em PDF e reentrada
- Dashboard administrativo com 2FA TOTP
- Apuração e publicação manual pelo admin
- Logs de auditoria consultáveis e exportáveis em CSV
- Rate limiting e bloqueio temporário de CPF

**Fora (v2):**

- Fase de indicação por servidores (a comissão define a lista)
- Página pública de resultado (divulgação pelos canais institucionais)
- Hash encadeado dos logs
- Backup em nuvem externa
- Foto do candidato na cédula **[A CONFIRMAR — ver §8.3]**

## 3. Papéis

| Papel | Acesso |
|---|---|
| Eleitor | Login por CPF + data de admissão. Vota uma vez, no próprio setor. |
| Admin (TI) | Importa base, cadastra candidatos, abre/fecha votação, apura, exporta logs. Login individual + TOTP. |
| Comissão | Não tem acesso ao sistema no MVP. Recebe do admin o ranking completo por setor. |

## 4. Modelo de dados (esboço)

```
Edicao (2026)
  └── Setor            (nome oficial, nome exibido, flag "agrupado")
        ├── Candidato  (servidor, setor, ordem de exibição)
        └── Eleitor    (CPF, nome, data_admissao, setor)
Voto (candidato_id, setor_id, timestamp_arredondado)
Participacao (eleitor_id, edicao_id, timestamp_arredondado)   ← separada de Voto
LogAuditoria (ator, acao, payload, timestamp)
```

A separação entre `Participacao` e `Voto` é o que garante o anonimato lógico: sabe-se **quem votou**, nunca **em quem**. Timestamps arredondados (janela de 5 min) para impedir correlação por horário.

## 5. Regras de negócio

### 5.1 Setor

- Cada eleitor pertence a exatamente um setor, definido na importação.
- O setor determina a cédula: o eleitor só vê e só pode votar em candidatos do próprio setor.
- Setores com número de servidores abaixo do limite mínimo são **agrupados** em um setor guarda-chuva único, que concorre como um setor normal. O limite é parametrizável. **[A CONFIRMAR — valor do limite; sugestão: 10 servidores]**
- O agrupamento é decidido pelo admin na etapa de normalização da importação, registrado em log, e congelado quando a votação abre.

### 5.2 Candidato

- Cadastrado pela comissão/RH; o sistema valida integridade (o candidato existe na base, pertence ao setor), não mérito.
- Um candidato concorre em um único setor — o dele.
- **Setor com apenas um candidato não vai à votação.** Os eleitores desse setor não recebem cédula e veem tela explicativa. O destino do candidato único (premiado por aclamação ou fora da premiação) é decisão da comissão, fora do sistema.
- Setor sem candidato: mesmo tratamento.

### 5.3 Eleitor e voto

- O eleitor deve existir previamente na base importada.
- Candidato também é eleitor e **pode votar em si mesmo**.
- Um voto por eleitor por edição. Sistema idempotente.
- Voto irreversível após a confirmação.
- Voto só é aceito se, **no momento do submit**, a votação está dentro da janela ativa — não basta validar no carregamento da tela.
- Bloqueio temporário de 15 minutos do CPF após 3 tentativas de login inválidas consecutivas.

### 5.4 Janela e apuração

- Janela parametrizável (`data_inicio`/`data_fim` com timezone explícito), com abertura e fechamento automáticos e override manual do admin, registrado em log.
- Após o fechamento, a votação não reabre pela interface.
- **Nenhuma parcial é exibida durante a votação — nem ao admin.** Só o total de participação (quantos votaram), nunca a distribuição. Esta regra é o que impede a votação virar campanha interna.
- Apuração e publicação são manuais, após o fechamento, permitindo conferência prévia.
- Divulgação: apenas o vencedor de cada setor. O ranking completo fica restrito à comissão.

### 5.5 Desempate — **[BLOQUEANTE ANTES DA ABERTURA]**

Com setores pequenos, empate é provável e não hipotético. O critério precisa estar no regulamento antes da votação abrir, senão o sistema é responsabilizado pela decisão. Opções usuais: maior tempo de serviço, sorteio público, ou decisão da comissão. **O sistema apenas sinaliza o empate e não escolhe vencedor automaticamente.**

## 6. Fluxo do eleitor

| # | Tela | Conteúdo |
|---|---|---|
| 1 | Login | CPF + data de admissão. |
| 2 | Confirmação de identidade | Nome e setor exibidos. "Não sou eu" volta ao login. |
| 3 | Cédula | Candidatos do setor, escolha única. Contador regressivo nos minutos finais. |
| 4 | Confirmação | "Você está votando em: [nome]." Aviso de irreversibilidade. Confirmar / Voltar. |
| 5 | Registrado | Confirmação + timestamp. Baixar comprovante (PDF). |
| 6 | Reentrada | "Você já votou em [data/hora]." Rebaixar comprovante. **Nunca exibe em quem votou.** |
| 7 | Setor sem votação | Setor com candidato único ou nenhum: mensagem explicativa, sem cédula. |

**Comprovante (PDF, gerado server-side):** brasão, nome da premiação, edição, setor do eleitor, confirmação textual de participação, timestamp, hash de verificação. **Não contém o nome do votado, em nenhuma circunstância.**

## 7. Importação e normalização de setores

Origem: XLS/XLSX gerado pelo RH. Campos esperados: Nome, CPF, Data de Nascimento, Data de Admissão, Cargo, **Setor/Lotação**.

Fluxo: upload → parsing → **tela de normalização de setores** → preview com totais e erros → confirmação explícita → gravação.

A tela de normalização é a novidade em relação ao `enquete-ws` e o ponto mais sensível do sistema: arquivos de RH trazem o mesmo setor grafado de várias formas. O admin vê a lista de setores distintos encontrados, agrupa os equivalentes num de-para, marca os setores abaixo do limite mínimo para o guarda-chuva, e só então confirma.

| Situação | Ação | Registro |
|---|---|---|
| CPF inválido | Rejeita a linha | Relatório de erros |
| Data de admissão ausente/inválida | Rejeita a linha | Relatório de erros |
| Setor ausente | Rejeita a linha | Relatório de erros |
| CPF duplicado no arquivo | Mantém o de admissão mais antiga | Aviso no relatório |
| Reimportação de CPF existente | Merge incremental | Resumo (X atualizados, Y novos) |
| Servidor mudou de setor entre importações | Prevalece o setor da última importação | Registrado em log |

Reimportação bloqueada enquanto a votação está aberta.

## 8. Segurança, anonimato e LGPD

**8.1 Anonimato.** Separação lógica entre participação e voto, timestamps arredondados. Limitação conhecida e que deve constar do regulamento: em setor pequeno, o próprio resultado permite deduções aritméticas. É exatamente o que o agrupamento de setores pequenos mitiga.

**8.2 Autenticação.** CPF + data de admissão é fator fraco isoladamente; sustenta-se pelo conjunto: base fechada, um voto por pessoa, rate limiting, bloqueio de CPF, logs completos e resultado sem valor jurídico vinculante.

**8.3 Dados dos candidatos.** Nome, cargo e setor na cédula têm base legal razoável (a premiação é institucional e o candidato foi indicado pela comissão). **Foto exige consentimento por escrito de cada candidato** — se a comissão quiser fotos, o termo precisa ser coletado antes, ou o item cai.

**8.4 Retenção.** Base de eleitores e logs eliminados 90 dias após a divulgação do resultado, salvo determinação em contrário.

## 9. Arquitetura

Mesma stack do `enquete-ws`, já validada: Next.js (web) + NestJS (api), PostgreSQL e Redis internos ao stack, Docker Swarm com Traefik na rede `network_public`, deploy via API do Portainer com token, Cloudflare à frente. Domínio **[A DEFINIR]**.

## 10. Reaproveitamento do `enquete-ws`

Novo repositório, com módulos **copiados e adaptados** (sem package compartilhado — acoplamento entre dois projetos que vão divergir não se paga):

| Módulo | Reaproveitamento |
|---|---|
| Auth do eleitor (CPF + admissão, bloqueio) | Integral |
| Admin + TOTP | Integral |
| Logs de auditoria + export CSV | Integral |
| Geração de PDF | Adaptar conteúdo |
| Stack Swarm/Traefik/Portainer | Integral |
| Importador XLS | Adaptar: novo campo Setor + tela de normalização |
| Modelo de dados e cédula | Reescrever (escopo por setor) |

## 11. Riscos

| Risco | Mitigação |
|---|---|
| Setor inconsistente no XLS do RH | Tela de normalização com confirmação explícita do admin |
| Anonimato quebrado em setor pequeno | Agrupamento por limite mínimo, documentado no regulamento |
| Campanha interna e mobilização | Zero parcial visível durante a votação |
| Empate sem critério | Definir desempate no regulamento antes da abertura |
| Exposição do candidato mal votado | Divulgar apenas o vencedor por setor |
| Erro descoberto no dia | Prazo flexível permite ensaio com base real e candidatos fictícios |

## 12. Pendências

1. Critério de desempate (bloqueante antes da abertura)
2. Limite mínimo de servidores por setor para o agrupamento
3. Destino do candidato único (decisão da comissão, fora do sistema)
4. Foto do candidato na cédula e coleta de consentimento
5. Domínio do sistema
6. Confirmação de que o XLS do RH traz o campo de setor/lotação

## 13. Plano de entrega

1. Repositório, CLAUDE.md e esqueleto do stack
2. Modelo de dados e migrações
3. Importador XLS com normalização de setores
4. Auth do eleitor e admin com TOTP
5. Cadastro de candidatos
6. Cédula, confirmação, comprovante e reentrada
7. Apuração, logs e exportação
8. Deploy e smoke test
9. **Ensaio com base real e candidatos fictícios** (~30 servidores)
10. Abertura da votação real
