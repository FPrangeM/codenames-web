# Codenames Web

Jogo multiplayer local de associação de palavras, baseado no clássico **Codenames**.

## Como Jogar

### Requisitos
- Node.js instalado
- Navegador moderno

### Instalação

```bash
pnpm install
```

### Iniciar Servidor

```bash
pnpm start
```

O servidor estará disponível em:
- **Local:** http://localhost:3000
- **Rede local:** http://<SEU_IP>:3000

### Preparação

1. Abra http://localhost:3000 em vários navegadores/abas
2. Cada aba representa um jogador diferente
3. Cada jogador escolhe:
   - **Time:** Vermelho, Azul ou Observador
   - **Função:** Spymaster (dá dicas) ou Operativo (adivinha)

### Regras do Jogo

1. **Spymasters** veem a "chave secreta" (cores das palavras)
2. **Operativos** só veem as palavras neutras
3. Spymaster dá uma palavra + número como dica
4. Operativos marcam e verificam cartas
5. Turno continua até errar ou passar
6. Primeiro a encontrar todas as suas palavras vence

### Distribuição (25 cartas)
- Time que começa: **9 palavras**
- Outro time: **8 palavras**
- Civis: **7 palavras**
- Assassina: **1 palavra** (derrota imediata)

## Tecnologias

- Node.js + Express
- Socket.IO (WebSocket)
- Vanilla JavaScript
- HTML5 + CSS3

## Estrutura do Projeto

```
/project-root
├── package.json
├── server.js          # Servidor Node + Socket.IO
└── public/
    ├── index.html     # Interface HTML
    ├── client.js      # Lógica do cliente
    └── style.css      # Estilos CSS
```
