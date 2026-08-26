---
description: Executa o ciclo completo de uma issue, da branch ao PR
---

Execute o ciclo de desenvolvimento de UMA issue, do início ao fim, sem pedir
confirmação entre as etapas internas.

## Seleção
1. `git switch main && git pull`
2. `gh issue list --milestone "$1" --state open --json number,title,labels`
3. Escolha a issue aberta mais antiga da milestone. Se todas estiverem fechadas,
   informe que a milestone terminou e PARE.
4. `gh issue view <n>` e leia o corpo inteiro.

## Implementação
5. Releia as seções de `docs/PRD.md` relacionadas à issue.
6. `git switch -c feat/<n>-<slug>`
7. Implemente o escopo da issue — só o escopo da issue. Nada de "já que estou aqui".
8. Escreva os testes junto, não depois.

## Verificação (obrigatória antes do PR)
9. `npm run lint`, `npm run test`, `npm run build`. Se algo falhar, corrija e repita.
   Três tentativas sem sucesso: PARE e me explique o que travou.
10. Percorra a checklist de domínio abaixo e escreva o resultado no corpo do PR.

## Entrega
11. Commit em Conventional Commits, em português.
12. `git push -u origin feat/<n>-<slug>`
13. `gh pr create --fill --body "Closes #<n>" + resumo do que mudou + checklist de domínio`
14. Informe o número do PR e PARE. Não faça merge. Não comece a próxima issue.

## Checklist de domínio (responder no PR, honestamente)
- [ ] Nenhuma consulta, índice, log ou resposta de API liga eleitor ao candidato votado
- [ ] Nenhuma parcial de votos é exposta, nem em endpoint de admin
- [ ] Escopo por setor validado no backend
- [ ] Timestamps de voto/participação arredondados
- [ ] Nenhum dado real de servidor em fixture, seed ou teste
- [ ] Nenhuma regra de negócio inventada por mim (se inventei, está sinalizado aqui)
