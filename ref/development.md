# 🎯 Objetivo Geral

Criar um jogo multiplayer web para rodar em rede local (mesmo Wi-Fi), com múltiplos jogadores simultâneos (mínimo 4), utilizando arquitetura simples e fácil de manter.

O projeto deve priorizar:

- Baixa complexidade estrutural  
- Poucos arquivos  
- Código legível  
- Fácil evolução incremental  
- Estado centralizado no servidor  
- Sem dependências desnecessárias  


---

# 🏗️ Arquitetura Obrigatória

## Backend
- Node.js
- Express
- Socket.IO
- Estado do jogo mantido apenas em memória (objeto global)
- Nenhum banco de dados inicialmente
- Nenhuma autenticação complexa
- Nenhum microserviço

## Frontend
- HTML simples
- CSS básico
- JavaScript puro (sem framework inicialmente)
- Comunicação apenas via Socket.IO client


---

# 📁 Estrutura de Projeto Esperada

O projeto deve conter apenas:

/project-root  
 ├── server.js  
 ├── package.json  
 └── /public  
      ├── index.html  
      ├── client.js  
      └── style.css  

Não criar camadas extras desnecessárias.


---

# 🌐 Comunicação

- Usar WebSocket via Socket.IO  
- Comunicação baseada em eventos  
- Cliente envia ações  
- Servidor valida e atualiza estado  
- Servidor emite estado atualizado para todos  

Nunca permitir que o cliente modifique estado diretamente.


---

# 🧠 Gerenciamento de Estado

Criar um único objeto global no servidor:

```js
const gameState = {
  phase: "lobby",
  players: {},
  teams: {},
  gameData: {}
}
```

Regras arquiteturais:

- Servidor é a autoridade absoluta  
- Cliente apenas renderiza estado recebido  
- Toda ação deve passar por validação no servidor  
- Após qualquer alteração, emitir estado atualizado  


---

# 🔄 Reconexão

- O estado do jogo deve permanecer no servidor em memória  
- Reconexões não devem reiniciar a partida  
- O sistema deve permitir reatribuição de conexão ao estado já existente  
- Nunca depender exclusivamente de `socket.id` como identidade permanente  


---

# 🖥️ Desenvolvimento e Testes

O sistema deve permitir:

- Abrir múltiplas abas do navegador  
- Simular múltiplos jogadores na mesma máquina  
- Funcionar acessando via IP local + porta (ex: http://192.168.0.10:3000)  
- Testes sem necessidade de múltiplos dispositivos físicos  

Não implementar autenticação real.


---

# 📡 Fluxo de Eventos Esperado

Cliente:

```js
socket.emit("actionName", payload)
```

Servidor:

```js
socket.on("actionName", (data) => {
   validar
   atualizar gameState
   io.emit("updateGameState", gameState)
})
```

Sempre seguir esse padrão.


---

# 🧱 Restrições Importantes

Não usar:

- TypeScript (inicialmente)  
- Framework frontend (React, Vue, etc)  
- Banco de dados  
- ORM  
- JWT  
- Redux  
- Arquitetura complexa  
- Separação exagerada de camadas  

Priorizar simplicidade.


---

# 📈 Evolução Futura (Não Implementar Agora)

O código deve ser organizado de forma que futuramente seja possível:

- Separar lógica do jogo em módulo  
- Adicionar persistência opcional  
- Adicionar sistema de salas  
- Melhorar UI  

Mas não implementar isso agora.


---

# 🎨 Interface

- Interface mínima funcional  
- Atualizar UI sempre que receber `updateGameState`  
- Renderização simples baseada no estado atual  
- Sem necessidade de design avançado  


---

# 🔐 Segurança

Como será usado apenas em rede local:

- Não implementar segurança avançada  
- Apenas validação básica no servidor  


---

# 📌 Padrão de Desenvolvimento

Gerar código incrementalmente.

Etapas recomendadas:

1. Servidor básico  
2. Conexão Socket.IO funcionando  
3. Teste de múltiplos clientes  
4. Sincronização de estado  
5. Reconexão  

Não gerar tudo de uma vez.