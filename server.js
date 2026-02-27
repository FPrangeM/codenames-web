const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

let gameState = {
  phase: 'lobby',
  players: {},
  teams: {
    red: { spymaster: null, operatives: [] },
    blue: { spymaster: null, operatives: [] }
  },
  gameData: {}
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('updateGameState', gameState);

  socket.on('joinGame', (data) => {
    const { nickname } = data;
    
    if (!nickname || nickname.trim().length === 0) {
      socket.emit('error', 'Nickname is required');
      return;
    }

    const existingPlayer = Object.values(gameState.players).find(
      p => p.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (existingPlayer) {
      socket.emit('error', 'Nickname already taken');
      return;
    }

    gameState.players[socket.id] = {
      id: socket.id,
      nickname: nickname.trim(),
      team: null,
      role: null,
      ready: false
    };

    io.emit('updateGameState', gameState);
    console.log(`${nickname} joined the game`);
  });

  socket.on('setTeam', (data) => {
    const { team, role } = data;
    const player = gameState.players[socket.id];

    if (!player) return;

    if (team === 'neutral') {
      player.team = 'neutral';
      player.role = 'observer';
      io.emit('updateGameState', gameState);
      return;
    }

    if (team !== 'red' && team !== 'blue') return;
    if (role !== 'spymaster' && role !== 'operative') return;

    if (role === 'spymaster' && gameState.teams[team].spymaster) {
      socket.emit('error', 'Team already has a spymaster');
      return;
    }

    if (team !== player.team) {
      if (player.team === 'red') {
        if (player.role === 'spymaster') {
          gameState.teams.red.spymaster = null;
        } else if (player.role === 'operative') {
          gameState.teams.red.operatives = gameState.teams.red.operatives.filter(id => id !== socket.id);
        }
      } else if (player.team === 'blue') {
        if (player.role === 'spymaster') {
          gameState.teams.blue.spymaster = null;
        } else if (player.role === 'operative') {
          gameState.teams.blue.operatives = gameState.teams.blue.operatives.filter(id => id !== socket.id);
        }
      }
    }

    player.team = team;
    player.role = role;

    if (role === 'spymaster') {
      gameState.teams[team].spymaster = socket.id;
    } else if (role === 'operative') {
      if (!gameState.teams[team].operatives.includes(socket.id)) {
        gameState.teams[team].operatives.push(socket.id);
      }
    }

    io.emit('updateGameState', gameState);
  });

  socket.on('setReady', (data) => {
    const { ready } = data;
    const player = gameState.players[socket.id];

    if (!player || !player.team || !player.role) return;

    player.ready = ready;
    io.emit('updateGameState', gameState);
  });

  socket.on('startGame', () => {
    const player = gameState.players[socket.id];
    if (!player) return;

    const redTeam = gameState.teams.red;
    const blueTeam = gameState.teams.blue;

    const canStart = 
      (redTeam.spymaster || redTeam.operatives.length > 0) &&
      (blueTeam.spymaster || blueTeam.operatives.length > 0);

    if (!canStart) {
      socket.emit('error', 'Need at least one player per team to start');
      return;
    }

    const allReady = Object.values(gameState.players)
      .filter(p => p.team && p.team !== 'neutral')
      .every(p => p.ready);

    if (!allReady) {
      socket.emit('error', 'All players must be ready');
      return;
    }

    startNewGame();
    io.emit('updateGameState', gameState);
  });

  socket.on('giveClue', (data) => {
    const player = gameState.players[socket.id];
    if (!player || player.role !== 'spymaster') return;
    if (gameState.phase !== 'playing') return;
    if (gameState.turn !== player.team) return;

    const { word, number } = data;
    if (!word || typeof number !== 'number' || number < 1) return;
    if (word.length < 2) return;

    const allWords = gameState.gameData.cards.map(c => c.word.toLowerCase());
    if (allWords.includes(word.toLowerCase())) {
      socket.emit('error', 'Clue cannot be any word on the board');
      return;
    }

    gameState.gameData.clue = {
      word: word.toUpperCase(),
      number: number,
      spymaster: player.nickname
    };
    gameState.gameData.guessesLeft = number;

    io.emit('updateGameState', gameState);
  });

  socket.on('markCard', (data) => {
    const player = gameState.players[socket.id];
    if (!player || player.role !== 'operative') return;
    if (gameState.phase !== 'playing') return;
    if (gameState.turn !== player.team) return;

    const { cardIndex } = data;
    if (cardIndex < 0 || cardIndex >= 25) return;

    const card = gameState.gameData.cards[cardIndex];
    if (card.revealed) return;

    if (!gameState.gameData.markedCards) {
      gameState.gameData.markedCards = [];
    }

    const existingMark = gameState.gameData.markedCards.find(m => m.cardIndex === cardIndex);
    if (existingMark) {
      gameState.gameData.markedCards = gameState.gameData.markedCards.filter(m => m.cardIndex !== cardIndex);
    } else {
      gameState.gameData.markedCards.push({
        cardIndex,
        team: player.team,
        player: player.nickname
      });
    }

    io.emit('updateGameState', gameState);
  });

  socket.on('verifyCard', (data) => {
    const player = gameState.players[socket.id];
    if (!player || player.role !== 'operative') return;
    if (gameState.phase !== 'playing') return;
    if (gameState.turn !== player.team) return;
    if (!gameState.gameData.clue) return;

    const { cardIndex } = data;
    if (cardIndex < 0 || cardIndex >= 25) return;

    const card = gameState.gameData.cards[cardIndex];
    if (card.revealed) return;

    card.revealed = true;

    if (gameState.gameData.markedCards) {
      gameState.gameData.markedCards = gameState.gameData.markedCards.filter(m => m.cardIndex !== cardIndex);
    }

    const teamColor = player.team;

    if (card.type === 'assassin') {
      gameState.phase = 'gameover';
      gameState.winner = teamColor === 'red' ? 'blue' : 'red';
      gameState.gameData.reason = 'assassin';
    } else if (card.type === teamColor) {
      gameState.gameData.scores[teamColor]++;

      if (gameState.gameData.scores[teamColor] === gameState.gameData.targetScore) {
        gameState.phase = 'gameover';
        gameState.winner = teamColor;
        gameState.gameData.reason = 'cleared';
      }
    } else if (card.type === 'civilian') {
      endTurn();
    } else {
      const rivalTeam = teamColor === 'red' ? 'blue' : 'red';
      if (card.type === rivalTeam) {
        gameState.gameData.scores[rivalTeam]++;
      }
      endTurn();
    }

    io.emit('updateGameState', gameState);
  });

  socket.on('passTurn', () => {
    const player = gameState.players[socket.id];
    if (!player || player.role !== 'operative') return;
    if (gameState.phase !== 'playing') return;
    if (gameState.turn !== player.team) return;

    endTurn();
    io.emit('updateGameState', gameState);
  });

  socket.on('newGame', () => {
    const player = gameState.players[socket.id];
    if (!player) return;

    gameState.phase = 'lobby';
    gameState.turn = null;
    gameState.winner = null;
    gameState.gameData = {};
    gameState.teams = {
      red: { spymaster: null, operatives: [] },
      blue: { spymaster: null, operatives: [] }
    };

    Object.values(gameState.players).forEach(p => {
      p.ready = false;
    });

    io.emit('updateGameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    const player = gameState.players[socket.id];
    if (player) {
      if (player.team === 'red') {
        if (player.role === 'spymaster') {
          gameState.teams.red.spymaster = null;
        } else if (player.role === 'operative') {
          gameState.teams.red.operatives = gameState.teams.red.operatives.filter(id => id !== socket.id);
        }
      } else if (player.team === 'blue') {
        if (player.role === 'spymaster') {
          gameState.teams.blue.spymaster = null;
        } else if (player.role === 'operative') {
          gameState.teams.blue.operatives = gameState.teams.blue.operatives.filter(id => id !== socket.id);
        }
      }

      delete gameState.players[socket.id];
    }

    io.emit('updateGameState', gameState);
  });
});

function startNewGame() {
  const words = getRandomWords(25);
  const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
  
  const cards = [];
  let cardIndex = 0;
  
  for (let i = 0; i < 9; i++) {
    cards.push({ word: words[cardIndex++], type: firstTeam, revealed: false });
  }
  
  const rivalTeam = firstTeam === 'red' ? 'blue' : 'red';
  for (let i = 0; i < 8; i++) {
    cards.push({ word: words[cardIndex++], type: rivalTeam, revealed: false });
  }
  
  for (let i = 0; i < 7; i++) {
    cards.push({ word: words[cardIndex++], type: 'civilian', revealed: false });
  }
  
  cards.push({ word: words[cardIndex], type: 'assassin', revealed: false });

  shuffleArray(cards);

  gameState.phase = 'playing';
  gameState.turn = firstTeam;
  gameState.gameData = {
    cards,
    scores: { red: 0, blue: 0 },
    targetScore: firstTeam === 'red' ? 9 : 8,
    clue: null,
    guessesLeft: 0,
    markedCards: []
  };
}

function endTurn() {
  gameState.gameData.clue = null;
  gameState.gameData.guessesLeft = 0;
  gameState.turn = gameState.turn === 'red' ? 'blue' : 'red';
}

function getRandomWords(count) {
  const allWords = [
    'PROGRAMADOR', 'ENCANADOR', 'ESTETICISTA', 'MATEMÁTICO', 'QUÍMICO', 'PSICÓLOGO', 'ADMINISTRADOR', 'ZELADOR', 'ELETRICISTA', 'JORNALISTA', 'DESIGNER', 'DANÇARINO', 'MÚSICO', 'TRADUTOR', 'POLÍTICO', 'YOUTUBER', 'PORTEIRO', 'GARI', 'LIXEIRO', 'FLORISTA',
    'ORÉGANO', 'GORDURA', 'PROTEÍNA', 'CEREAL', 'FARINHA', 'CACAU', 'GLICOSE', 'CEVADA', 'MALTE', 'MILHO', 'SÓDIO', 'ALHO', 'CORANTE', 'VITAMINA', 'VINAGRE', 'MEL', 'FIBRA', 'MOLHO', 'LACTOSE', 'GENGIBRE', 'FERMENTO', 'PAÇOCA', 'AÇAÍ', 'EMPADÃO', 'MANDIOCA', 'MAMONA',
    'SUBMARINO', 'TRATOR', 'ÔNIBUS', 'LANCHA', 'JETSKI', 'TRICICLO', 'RETROVISOR', 'ZEPPELIN', 'CAMÃO', 'MOTOCICLETA', 'PATINETE',
    'PANDA', 'ANTA', 'ARRAIA', 'ATUM', 'BAIA', 'CUBARATA', 'BESOURO', 'BURRO', 'CACATUA', 'CARNEIRO', 'CAMELO', 'CEGONHA', 'CASCAVEL', 'CENTOPEIA', 'CIGARRA', 'CUPIM', 'DROMEDÁRIO', 'GORILA', 'HIENA', 'JAVALI', 'LAGARTIXA', 'LULU', 'MARITACA', 'MORCEGO', 'ORNITORRINCO', 'PIOLHO', 'RINOCERONTE', 'SIRIATA', 'TUCANO', 'VAGA-LUME',
    'PANELA', 'ESCORREDOR', 'SABONETE', 'VARAL', 'RODO', 'PREGADOR', 'CORTINA', 'LENÇOL', 'TESOURA', 'GUARDANAPO', 'POLTRONA', 'FILTRO', 'ASPIRADOR', 'COLCHÃO', 'ABAJUR', 'TAPETE', 'ARMÁRIO', 'GELADEIRA', 'TOALHA', 'TORRADEIRA', 'LIQUIDIFICADOR', 'CHALEIRA', 'LIXEIRA', 'IMPRESSORA', 'FOGÃO',
    'JAPÃO', 'COREIA', 'CHILE', 'TURQUIA', 'EQUADOR', 'ISRAEL', 'SUÍÇA', 'IRAQUE', 'ANGOLA', 'BÉLGICA', 'HAITI', 'SUÉCIA',
    'HARPA', 'VIOLINO', 'CHOCALHO', 'PANDEIRO', 'GAITA', 'SAXOFONE', 'ALAÚDE', 'BANJO', 'UKULELE', 'ACORDEÃO',
    'FUNK', 'FORRÓ', 'ROCK', 'ELETRÔNICA', 'SERTANEJO', 'CLÁSSICO', 'GÓTICO', 'INDIE', 'JAZZ', 'PAGODE', 'REGGAE', 'FREVO',
    'ALUMÍNIO', 'ESTANHO', 'NÍQUEL', 'BRONZE', 'CARVÃO', 'ENXOFRE', 'GRAFITE', 'PRATA', 'RUBI', 'ESMERALDA', 'URÂNIO', 'SAFIRA', 'PLATINA',
    'RAIVA', 'HOSTIL', 'TRISTEZA', 'MEDO', 'FRUSTRAÇÃO', 'AVERSÃO', 'ALEGRIA', 'AFETO', 'CONFIANÇA', 'CIÚME', 'COMPAIXÃO', 'EMPATIA', 'APATIA', 'SURPRESA', 'ESPERANÇA', 'PAIXÃO', 'APEGO', 'ACEITAÇÃO', 'ADMIRAÇÃO', 'CALMA', 'CARISMA', 'CONFORTO', 'COVARDE', 'CORAGEM', 'DEVOTO', 'FÉ', 'HONRA', 'PIEDADE', 'SIMPATIA',
    'ACNE', 'ALCOOLISMO', 'ALZHEIMER', 'AMNÉSIA', 'ANOREXIA', 'ANSIEDADE', 'ASMA', 'CÂNCER', 'CATAPORA', 'DIABETES', 'DEPRESSÃO', 'DENGUE', 'ENXAQUECA', 'GASTRITE', 'HIPERTENSÃO', 'LABIRINTITE', 'LEPTOSPIROSE', 'PANDEMIA', 'RESFRIADO', 'RINITE', 'SONAMBULISMO', 'TENDINITE', 'TOSSE',
    'ABDÔMEN', 'ARTICULAÇÃO', 'AXILA', 'BEXIGA', 'BOCHECHA', 'CALCANHAR', 'CÍLIOS', 'CINTURA', 'COTOVELO', 'COXA', 'ESTÔMAGO', 'GARGANTA', 'MÚSCULO', 'QUEIXO', 'TESTA', 'UMBIGO', 'VEIA',
    'SINUCA', 'ATLETISMO', 'AUTOMOBILISMO', 'BASQUETE', 'CROSSFIT', 'ESGRIMA', 'ESPORTS', 'FISICULTURISMO', 'HIPISMO', 'JUDÔ', 'KARATÊ', 'NATAÇÃO', 'PATINAÇÃO', 'TÊNIS', 'VÔLEI', 'XADREZ', 'DOMINÓ', 'PARKOUR', 'PIPA', 'PAINTBALL', 'SURF', 'YOGA',
    'JAQUETA', 'CASACO', 'PALETÓ', 'CUECA', 'CARTEIRA', 'TERNO', 'UNGARO', 'PIJAMA', 'CAMISOLA', 'BAINHA', 'BANDANA', 'MAIÔ', 'LINGERIE', 'ESTILO', 'MODA', 'BRACELETE', 'UNIFORME',
    'JUVENTUDE', 'RIQUEZA', 'POBREZA', 'SAÚDE', 'ILUSÃO', 'VELHICE', 'PESO', 'COMPRIMENTO', 'ALTURA', 'LARGURA', 'PASSAGEM', 'FINGIMENTO', 'COLORIDO', 'ESPERAR', 'REGIME', 'COMUNIDADE', 'CARAVANA', 'HORDA', 'LEGIÃO', 'TIME', 'TURMA', 'PLATEIA',
    'CIANO', 'BEGE', 'CARMESIM', 'CASTANHO', 'DAMASCO', 'ROSA', 'SÉPIA', 'LOIRO', 'AZUL', 'AMARELO', 'ROXO',
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
    'CINZEIRO', 'DOCUMENTO', 'GILETE', 'AGENDA', 'CIGARRO', 'LAPISEIRA', 'PEDREGUILHO', 'KATANA', 'GLOBO', 'ANTENA', 'BIGORNA', 'BISTURI', 'CHUPETA', 'DENTADURA', 'DODÔ', 'DETERGENTE', 'DICIONÁRIO', 'ENXADA', 'ESTÁTUA', 'FLECHA', 'GAIOLA', 'GIBI', 'HIDRANTE', 'IMÃ', 'ISCA', 'KARAOKÊ', 'MOCHILA', 'PIERCING', 'TIJOLO', 'TROFÉU', 'URNA',
    'PROCESSADOR', 'TECLADO', 'PENDRIVE', 'SUCATA', 'SOLDAGEM', 'BINÁRIO', 'GABINETE', 'ARTIFICIAL', 'DISQUETE', 'DVD', 'GPS', 'NOTEBOOK', 'HEADSET', 'CRÉDITO', 'WIFI', 'WEBCAM',
    'BUDA', 'JESUS', 'MAOMÉ', 'TESLA', 'MICHELANGELO', 'KENNEDY', 'SAMURAI', 'XUXA', 'PELÉ',
    'SEREIA', 'LAMPIÃO', 'ÍNDIO', 'ODIN', 'CUCA', 'ZEUS', 'ARES', 'AFRODITE', 'ATENA', 'INFERNO', 'FRANKENSTEIN', 'MICKEY', 'COWBOY', 'DRÁCULA', 'GODZILLA', 'BARBIE', 'TARZAN', 'GOKU',
    'VIADUTO', 'CRUZAMENTO', 'TERRAÇO', 'PLANÍCIE', 'ESGOTO',
    'FLAMENGO', 'CHELSEA', 'CRUZEIRO', 'FORTALEZA', 'INTERNACIONAL', 'VASCO', 'PALMEIRAS', 'CORINTHIANS', 'BOTAFOGO', 'BARCELONA', 'MILAN', 'MADRID', 'MANCHESTER', 'LIVERPOOL', 'PORTO'
  ];

  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

server.listen(PORT, () => {
  console.log(`Codenames server running on http://localhost:${PORT}`);
  console.log(`For local network: http://<YOUR_IP>:${PORT}`);
});
