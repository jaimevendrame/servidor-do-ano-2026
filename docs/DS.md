# Design System — Servidor do Ano

> Design system extraído da identidade visual apresentada para a marca **Servidor do Ano**.

## 1. Identidade Visual

### Conceito

A identidade combina três ideias principais:

- **Reconhecimento** — valorização e premiação.
- **Confiança** — aparência institucional e séria.
- **Avaliação** — o check representa aprovação, escolha e votação.

A linguagem visual é minimalista, institucional e direta.

### Personalidade

| Característica | Intensidade |
|---|---:|
| Institucional | ★★★★★ |
| Sério | ★★★★★ |
| Confiável | ★★★★★ |
| Moderno | ★★★☆☆ |
| Elegante | ★★★★☆ |
| Popular / acessível | ★★★★☆ |
| Tecnológico | ★★☆☆☆ |

**Direção visual:** Institucional contemporâneo + premiação + reconhecimento humano.

---

## 2. Paleta de Cores

### Primary — Grafite Profundo

```text
#1B2527
RGB: 27, 37, 39
```

Uso:
- Títulos
- Textos principais
- Ícone de check
- Navegação
- Elementos de destaque

Representa autoridade, estabilidade e seriedade.

### Secondary — Dourado Institucional

```text
#816033
RGB: 129, 96, 51
```

Uso:
- Moldura do símbolo
- Detalhes da marca
- Botões especiais
- Destaques
- Elementos relacionados ao prêmio

Representa conquista, excelência e reconhecimento.

### Background — Cinza Claro

```text
#E4E4E4
RGB: 228, 228, 228
```

Uso:
- Fundo principal
- Áreas neutras
- Seções secundárias

### Surface — Branco

```text
#FFFFFF
```

Uso:
- Cards
- Modais
- Formulários
- Áreas de conteúdo

---

## 3. Paleta Recomendada para Interface Web

Para uma aplicação web moderna, recomenda-se não utilizar o cinza `#E4E4E4` como fundo global.

```text
#1B2527  Grafite
#816033  Dourado institucional
#F7F7F5  Off-white
#FFFFFF  Branco
#D1D1D1  Bordas
#626566  Texto secundário
```

### Tokens CSS

```css
:root {
  --color-primary: #1B2527;
  --color-secondary: #816033;

  --color-background: #F7F7F5;
  --color-surface: #FFFFFF;

  --color-text: #1B2527;
  --color-text-muted: #626566;

  --color-border: #D1D1D1;

  --color-success: #3F7D4A;
  --color-warning: #B78332;
  --color-error: #B84242;
}
```

> Verde, amarelo e vermelho devem ser reservados para estados funcionais e não fazer parte da identidade principal.

---

## 4. Tipografia

A marca utiliza uma tipografia sans-serif condensada, pesada e em caixa alta.

### Fonte de títulos

**Oswald**

```text
Oswald 700
```

Alternativas:

- Bebas Neue
- Roboto Condensed

### Fonte de interface

**Inter**

Pesos recomendados:

```text
400 — Regular
500 — Medium
600 — SemiBold
700 — Bold
```

### Tokens

```css
:root {
  --font-heading: "Oswald", sans-serif;
  --font-body: "Inter", sans-serif;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

---

## 5. Hierarquia Tipográfica

| Elemento | Fonte | Peso | Desktop | Mobile |
|---|---|---:|---:|---:|
| H1 | Oswald | 700 | 48–64px | 36–42px |
| H2 | Oswald | 700 | 36–44px | 30–34px |
| H3 | Oswald | 700 | 26–32px | 24–28px |
| H4 | Oswald | 600 | 22–26px | 20–24px |
| Corpo | Inter | 400 | 16–18px | 16px |
| Botão | Inter | 700 | 15–16px | 15–16px |
| Label | Inter | 600 | 13–14px | 13–14px |

---

## 6. Símbolo da Marca

O símbolo é composto por dois elementos principais.

### Moldura

- Formato quadrado arredondado
- Traço grosso
- Cor `#816033`
- Aparência semelhante a uma caixa de seleção

### Check

- Cor `#1B2527`
- Traço orgânico e irregular
- Aparência semelhante a uma assinatura feita à mão

A combinação transmite:

> **Estrutura institucional + intervenção humana**

A moldura representa precisão e organização, enquanto o check transmite decisão e participação.

---

## 7. Formas e Border Radius

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

Para manter a linguagem institucional, recomenda-se priorizar:

- 6px
- 8px
- 10px
- 12px

Evitar excesso de elementos extremamente arredondados.

---

## 8. Espaçamento

Sistema baseado em múltiplos de 4/8px:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 80px;
  --space-10: 96px;
}
```

---

## 9. Botões

### Primary

```text
Background: #1B2527
Texto: #FFFFFF
```

Exemplo:

**VOTAR AGORA**

Hover:

```text
Background: #816033
```

### Secondary

```text
Background: #816033
Texto: #FFFFFF
```

Exemplo:

**CONHEÇA OS CANDIDATOS**

### Outline

```text
Background: transparent
Border: #1B2527
Texto: #1B2527
```

Exemplo:

**VER CANDIDATOS**

---

## 10. Cards

Recomendação para cards de candidatos:

```text
Background: #FFFFFF
Border: #D1D1D1
Border Radius: 10px
```

Estrutura:

```text
┌─────────────────────────────┐
│                             │
│       FOTO CANDIDATO        │
│                             │
├─────────────────────────────┤
│ NOME DO SERVIDOR            │
│ Cargo / Setor               │
│                             │
│ ┌─────────────────────────┐ │
│ │        VOTAR             │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Sombra

Usar sombra discreta:

```css
box-shadow: 0 4px 16px rgba(27, 37, 39, 0.08);
```

Evitar sombras fortes.

---

## 11. Elementos de Premiação

A identidade pode utilizar discretamente:

- Medalhas
- Estrelas
- Troféus
- Check
- Número da posição
- Badge "Finalista"
- Badge "Vencedor"

A cor de destaque deve ser o dourado:

```text
#816033
```

Exemplo:

```text
🥇 1º LUGAR
```

ou:

```text
[ VENCEDOR ]
```

---

## 12. Ícones

Estilo recomendado:

**Outline / Stroke**

Bibliotecas sugeridas:

- Lucide
- Phosphor
- Heroicons

Configuração:

```text
Stroke: 1.8–2px
Cor padrão: #1B2527
Cor de destaque: #816033
```

Evitar ícones excessivamente coloridos.

---

## 13. Layout

Estrutura recomendada:

```text
┌──────────────────────────────────────────┐
│ LOGO       INÍCIO  CANDIDATOS  SOBRE    │
├──────────────────────────────────────────┤
│                                          │
│          SERVIDOR DO ANO                 │
│                                          │
│       Reconhecendo quem faz              │
│       a diferença todos os dias.        │
│                                          │
│           [ VOTAR AGORA ]                │
│                                          │
├──────────────────────────────────────────┤
│             CANDIDATOS                   │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ FOTO │  │ FOTO │  │ FOTO │           │
│  │      │  │      │  │      │           │
│  └──────┘  └──────┘  └──────┘           │
│                                          │
└──────────────────────────────────────────┘
```

### Container

```css
--container-max: 1200px;
```

---

## 14. Sombras

```css
:root {
  --shadow-sm: 0 2px 8px rgba(27, 37, 39, 0.06);
  --shadow-md: 0 6px 20px rgba(27, 37, 39, 0.10);
}
```

Utilizar sombras com moderação.

---

## 15. Design Tokens Completo

```css
:root {

  /* COLORS */
  --color-primary: #1B2527;
  --color-secondary: #816033;

  --color-background: #F7F7F5;
  --color-surface: #FFFFFF;

  --color-text: #1B2527;
  --color-text-muted: #626566;

  --color-border: #D1D1D1;

  --color-success: #3F7D4A;
  --color-warning: #B78332;
  --color-error: #B84242;

  /* TYPOGRAPHY */
  --font-heading: "Oswald", sans-serif;
  --font-body: "Inter", sans-serif;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* SPACING */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 80px;
  --space-10: 96px;

  /* RADIUS */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* SHADOWS */
  --shadow-sm: 0 2px 8px rgba(27, 37, 39, 0.06);
  --shadow-md: 0 6px 20px rgba(27, 37, 39, 0.10);

  /* CONTAINER */
  --container-max: 1200px;
}
```

---

## 16. Princípios de Uso

### Fazer

- Priorizar espaços em branco.
- Utilizar grafite como cor estrutural.
- Utilizar dourado para reconhecimento e destaque.
- Usar tipografia condensada em títulos.
- Manter componentes simples.
- Utilizar imagens de pessoas reais para candidatos.
- Dar destaque claro ao botão de votação.
- Manter boa hierarquia visual.

### Evitar

- Gradientes excessivos.
- Muitas cores.
- Sombras pesadas.
- Cards excessivamente arredondados.
- Tipografia decorativa.
- Ícones multicoloridos.
- Animações exageradas.
- Excesso de elementos dourados.

---

## 17. Acessibilidade

O sistema deve ser validado segundo **WCAG 2.2**.

Prioridades:

- Contraste adequado entre texto e fundo.
- Não utilizar apenas cor para comunicar estados.
- Botões com área de toque adequada.
- Estados de foco visíveis.
- Textos legíveis em dispositivos móveis.
- Navegação possível por teclado.

Referência:

https://www.w3.org/TR/WCAG22/

---

## 18. Referências

- W3C — Web Content Accessibility Guidelines (WCAG) 2.2  
  https://www.w3.org/TR/WCAG22/

- Material Design — Color  
  https://m3.material.io/styles/color/overview

- Google Fonts — Oswald  
  https://fonts.google.com/specimen/Oswald

- Google Fonts — Inter  
  https://fonts.google.com/specimen/Inter

- Lucide Icons  
  https://lucide.dev/

---

## 19. Resumo da Identidade

```text
MARCA
Servidor do Ano

ESTILO
Institucional contemporâneo

COR PRINCIPAL
#1B2527

COR DE DESTAQUE
#816033

FUNDO
#F7F7F5

TÍTULOS
Oswald 700

INTERFACE
Inter

BORDER RADIUS
6–16px

GRID
8px

CONTAINER
1200px

PERSONALIDADE
Sério • Confiável • Institucional • Humano • Reconhecimento
```

---

**Versão:** 1.0  
**Projeto:** Servidor do Ano  
**Tipo:** Design System / Visual Identity
