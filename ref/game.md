# 🎯 CODENAMES — DOCUMENTO ORGANIZADO DE REGRAS E ESPECIFICAÇÃO WEB

---

# 1️⃣ VISÃO GERAL

**Codenames** é um jogo de associação de palavras para **4 a 8 jogadores** (idealmente 8).

## Estrutura dos Times

- Dois times: **Vermelho** e **Azul**
- Cada time possui:
  - 1 Spymaster (dá as dicas)
  - 2+ Operativos (adivinham as palavras)

## Objetivo

Identificar todas as palavras secretas do seu time antes do adversário.

- Time inicial → 9 palavras
- Outro time → 8 palavras
- Existem 7 palavras Civis (neutras)
- Existe 1 palavra Assassina (derrota imediata)

---

# 2️⃣ COMPONENTES DO JOGO

## 🟦 Grade Principal

- Total de 25 cartas
- Dispostas em grade (5x5 ou 5x6 dependendo da versão)

Distribuição:

- 9 palavras do time que começa
- 8 palavras do outro time
- 7 palavras civis
- 1 palavra assassina

---

## 🔐 Chave Secreta

- Visível apenas pelos Spymasters
- Mostra a cor de cada carta na grade

---

## ⏱ Cronômetro (Opcional)

- 4 minutos por rodada

---

# 3️⃣ CONFIGURAÇÃO INICIAL

1. Dividir jogadores em dois times iguais
2. Escolher um Spymaster por time
3. Sortear qual time começa
4. Time inicial recebe 9 palavras
5. Embaralhar e posicionar as 25 palavras
6. Gerar chave secreta correspondente

---

# 4️⃣ FLUXO DE JOGO (RODADAS)

## Turno de um Time

### 1️⃣ Spymaster dá dica

Formato obrigatório:

```js
Palavra + Número
Exemplo: "Fruta: 3"
```

Regras da dica:

- Deve ser uma única palavra
- Não pode estar na grade
- Deve se relacionar com o número indicado
- Não pode se relacionar com palavras rivais ou assassina

---

### 2️⃣ Operativos discutem

- Spymaster não pode falar
- Time decide quais palavras clicar

---

### 3️⃣ Operativos fazem escolhas

Podem clicar:

- Marcar (selecionar) carta por vez (o proprio time vizualiza cartas marcadas).
- Escolher "Verfificar" a carta marcada.
- Ou pular a vez.

---

## Resultado de carta Verificada

- Todos os jogadores observam as cartas "Verificadas"

- Palavra do time → conta um ponto para o time e continua jogando
- Palavra rival → conta um ponto para o rival e o turno encerra
- Palavra civil → turno encerra
- Palavra assassina → derrota instantânea

---

# 5️⃣ CONDIÇÕES DE VITÓRIA

- Time acerta todas as suas palavras → vitória
- Time toca na assassina → derrota imediata

---

# 6️⃣ EXEMPLO DE RODADA (SIMULAÇÃO)

## Grade Visível (exemplo)

Cão | Rio | Sol | Mesa | Livro  
Casa | Flor | Céu | Bola | Rei  
Água | Pão | Lua | Gato | Rainha  
Vento | Arco | Fogo | Neve | Ouro  

---

## Distribuição Secreta (exemplo fictício)

Vermelho (9):  
Cão, Sol, Casa, Céu, Rei, Água, Lua, Neve, Ouro  

Azul (8):  
Rio, Mesa, Livro, Flor, Bola, Pão, Gato, Fogo  

Civis (7):  
Arco, Vento, Rainha, etc  

Assassina:  
(Exemplo fictício)

---

## Rodada Vermelho

Spymaster:  
"Animal: 2"

Operativos clicam:

- Clicam (Marcam) a carta Cão → Verificam → acerto
- Clicam (Marcam) a carta Casa → Verificam → acerto
- Param (pulam a vez)

Passa vez.

---

## Rodada Azul

Spymaster:  
"Móvel: 3"

Operativos:

- Clicam (Marcam) a carta Mesa → Verificam → acerto
- Clicam (Marcam) a carta Lua, desistem e clicam na carta Livro → Verificam → acerto
- Clicam (Marcam) a carta Lua → Verificam → Assassina

Azul perde imediatamente.  
Vermelho vence.

---

# 7️⃣ ESPECIFICAÇÃO PARA IMPLEMENTAÇÃO WEB

---

## 🌐 Requisitos Gerais

- Multiplayer local (mesma Wi-Fi)
- Sem servidor externo
- Sincronização em tempo real
- Testável abrindo múltiplas abas

---

## 🖥️ Fluxo da Interface

### 1️⃣ Tela Inicial

- Input para apelido (obrigatório)
- Checagem simples de nome único
- Botão "Entrar no Lobby"

---

### 2️⃣ Lobby Multiplayer

Deve exibir:

- Board interativo para seleção de time/função
- Vertical -> Times | Horizontal -> função (neutro não tem função, apenas observa o jogo com a mesma visão dos operadores, observando as marcações de carta de cada time)
  - Time (Vermelho / Azul / Neutro)
  - Papel (Spymaster / Operativo)


Regras:

- Jogo pode ser iniciado com pelo menos uma pessoa em cada função/time
- Máx 8 jogadores
- Host inicia o jogo 
- Só inicia quando todos estiverem "Pronto"

---

### 3️⃣ Início do Jogo

- Sorteio do time inicial
- Geração aleatória das 25 palavras
- Distribuição 9/8/7/1

### Visualização

Spymasters:
- Visualizam chave secreta pelas suas bordas coloridas (o conteudo da carta se colore conforme os operadores "Verificam")

Operativo:
- Visualiza grade neutra
- Vizualiza as cores reais apenas das cartas Reveladas/Verificadas

---

### 4️⃣ Durante o Turno

Exibir:

- Indicação clara do turno atual
- Nome do Spymaster da vez

Spymaster:

- Campo de input (palavra + número)
- Botão "Dar Dica"

Operativos:

- Clicam nas cartas
- Confirmam com botão "Verificar"
- Sistema revela cor
- Atualiza contadores

Turno encerra:

- Automaticamente ao errar
- Ou manualmente
- Timer opcional de 4 minutos

---

### 5️⃣ Fim de Jogo

- Tela de vitória ou derrota
- Botão "Nova Partida"

---

# 8️⃣ STACK TÉCNICA

- HTML5
- CSS
- JavaScript puro (Vanilla JS)
- Sem frameworks

---

## 📱 Interface

- Responsivo (mobile e desktop)
- Cores
- Animações suaves ao revelar cartas
- Tratamento de erros
- Tratamento de desconexão

---

# 9️⃣ BANCO DE PALAVRAS

- Lista hardcoded com 400+ palavras PT-BR
- Substantivos comuns

Arquivo de cartas:
```
ref/Cards.txt
```

---

# 🔟 REFERÊNCIAS EXTERNAS


Referências de layout:
```
ref/Images/*
```