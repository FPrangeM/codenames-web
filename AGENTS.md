# AGENTS.md - Informações para Agentes

## Projeto Atual

**Codenames Web** - Jogo multiplayer local de associação de palavras para 4-8 jogadores.

## Stack Técnica

- **Backend:** Node.js + Express + Socket.IO
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Comunicação:** WebSocket via Socket.IO
- **Porta padrão:** 3000

## Comandos Úteis

```bash
pnpm install   # Instalar dependências
pnpm start     # Iniciar servidor
```

## Estrutura de Arquivos

```
├── server.js          # Servidor - contém lógica do jogo e estado global
├── public/
│   ├── index.html     # Interface HTML
│   ├── client.js      # Lógica客户端 ( Socket.IO client)
│   └── style.css      # Estilos
├── package.json
├── README.md
└── ref/               # Especificações originais do jogo
```

## Estado do Jogo (gameState)

O servidor mantém um objeto `gameState` com:

```js
{
  phase: 'lobby' | 'playing' | 'gameover',
  players: { [socket.id]: { id, nickname, team, role, ready } },
  teams: { red: { spymaster, operatives[] }, blue: { spymaster, operatives[] } },
  turn: 'red' | 'blue',
  gameData: {
    cards: [{ word, type, revealed }],
    scores: { red, blue },
    targetScore,
    clue: { word, number, spymaster },
    markedCards: [{ cardIndex, team, player }]
  }
}
```

## Eventos Socket.IO

### Cliente → Servidor
- `joinGame` - Entra no lobby com nickname
- `setTeam` - Define team (red/blue/neutral) e role (spymaster/operative/observer)
- `setReady` - Marca pronto para iniciar
- `startGame` - Inicia o jogo (apenas hosts quando todos prontos)
- `giveClue` - Spymaster dá dica
- `markCard` - Marca carta para discussão
- `verifyCard` - Operativo verifica carta marcada
- `passTurn` - Operativo passa a vez
- `newGame` - Reinicia para lobby

### Servidor → Cliente
- `updateGameState` - Estado completo do jogo
- `error` - Mensagem de erro

## Funcionalidades Implementadas

- Login com apelido único
- Lobby com seleção de time/função
- Sistema de Ready para iniciar
- Distribuição automática de 25 palavras (9/8/7/1)
- Visualização diferenciada: Spymaster vê cores secretas, Operativo só vê reveladas
- Marcação de cartas visível para todo o time
- Turno livre (sem limite de verificações)
- Condições de vitória/derrota
- Fundo diferenciado por time
- "(você)" marcado para o jogador local
- Info do jogador no topo durante o jogo

## Palavras Disponíveis

~250 palavras em português brasileiro organizadas por categoria (profissões, alimentos, animais, países, etc.)

## Bugs/Fixes Conhecidos

1. **Login não aparecia** - Corrigido adicionando verificação se o socket.id está em `state.players`
2. **Marcações não visíveis** - Corrigido para mostrar marcações de todos do time
3. **Turno com limite** - Removido limite, turno vai até errar ou passar
4. **Plano de fundo** - Adicionado fundo diferenciado por time
5. **Identificação do usuário** - Adicionado "(você)" e info no topo

## Para Desenvolver

- Timer opcional (4 minutos por turno) - mentioned em ref/game.md mas não implementado
- Testes automatizados
- Melhorias de UI
- Sistema de salas (futuro)
