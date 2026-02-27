const socket = io();

let myPlayerId = null;
let selectedCardIndex = null;
let currentState = null;

const screens = {
  login: document.getElementById('login-screen'),
  lobby: document.getElementById('lobby-screen'),
  game: document.getElementById('game-screen')
};

const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');

const nicknameInput = document.getElementById('nickname-input');
const joinBtn = document.getElementById('join-btn');
const loginError = document.getElementById('login-error');

const playersList = document.getElementById('players-list');
const readyBtn = document.getElementById('ready-btn');
const startBtn = document.getElementById('start-btn');

const clueInput = document.getElementById('clue-input');
const clueNumberInput = document.getElementById('clue-number-input');
const giveClueBtn = document.getElementById('give-clue-btn');

const verifyBtn = document.getElementById('verify-btn');
const passBtn = document.getElementById('pass-btn');
const guessInfo = document.getElementById('guess-info');

const gameBoard = document.getElementById('game-board');
const clueArea = document.getElementById('clue-area');
const clueWord = document.getElementById('clue-word');
const clueNumber = document.getElementById('clue-number');
const clueSpymaster = document.getElementById('clue-spymaster');

const spymasterControls = document.getElementById('spymaster-controls');
const operativeControls = document.getElementById('operative-controls');

const teamIndicator = document.getElementById('turn-text');
const turnDot = document.querySelector('.turn-dot');

const redScoreEl = document.getElementById('red-score');
const blueScoreEl = document.getElementById('blue-score');

const gameoverModal = document.getElementById('gameover-modal');
const gameoverTitle = document.getElementById('gameover-title');
const gameoverMessage = document.getElementById('gameover-message');
const newGameBtn = document.getElementById('new-game-btn');
const gameoverNewGameBtn = document.getElementById('gameover-new-game-btn');
const playerInfo = document.getElementById('player-info');

joinBtn.addEventListener('click', joinGame);
nicknameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinGame();
});

readyBtn.addEventListener('click', toggleReady);
startBtn.addEventListener('click', startGame);

giveClueBtn.addEventListener('click', giveClue);
clueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') giveClue();
});
clueNumberInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') giveClue();
});

verifyBtn.addEventListener('click', verifyCard);
passBtn.addEventListener('click', passTurn);

newGameBtn.addEventListener('click', newGame);
gameoverNewGameBtn.addEventListener('click', newGame);

document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const team = btn.dataset.team;
    const role = btn.dataset.role || 'observer';
    selectTeamRole(team, role);
  });
});

function joinGame() {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    loginError.textContent = 'Digite um apelido';
    return;
  }
  
  socket.emit('joinGame', { nickname });
}

function selectTeamRole(team, role) {
  socket.emit('setTeam', { team, role });
}

function toggleReady() {
  const player = currentState?.players[socket.id];
  if (!player || !player.team || player.team === 'neutral') return;
  
  socket.emit('setReady', { ready: !player.ready });
}

function startGame() {
  socket.emit('startGame');
}

function giveClue() {
  const word = clueInput.value.trim();
  const number = parseInt(clueNumberInput.value);
  
  if (!word || isNaN(number) || number < 1) {
    alert('Digite uma palavra e um número válido');
    return;
  }
  
  socket.emit('giveClue', { word, number });
  clueInput.value = '';
  clueNumberInput.value = '';
}

function verifyCard() {
  if (selectedCardIndex === null) return;
  socket.emit('verifyCard', { cardIndex: selectedCardIndex });
  selectedCardIndex = null;
  verifyBtn.disabled = true;
}

function passTurn() {
  socket.emit('passTurn');
}

function newGame() {
  socket.emit('newGame');
}

socket.on('connect', () => {
  console.log('Connected to server');
  showScreen('login');
});

socket.on('error', (message) => {
  loginError.textContent = message;
  setTimeout(() => {
    loginError.textContent = '';
  }, 3000);
});

socket.on('updateGameState', (state) => {
  currentState = state;
  render(state);
});

function render(state) {
  const myPlayer = state.players[socket.id];
  
  document.body.className = '';
  if (myPlayer) {
    if (myPlayer.team === 'red') {
      document.body.classList.add('bg-red');
    } else if (myPlayer.team === 'blue') {
      document.body.classList.add('bg-blue');
    } else {
      document.body.classList.add('bg-neutral');
    }
  }
  
  if (!myPlayer) {
    showScreen('login');
    return;
  }

  if (state.phase === 'lobby') {
    showScreen('lobby');
    renderLobby(state);
  } else if (state.phase === 'playing' || state.phase === 'gameover') {
    showScreen('game');
    renderGame(state);
  }
}

function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenName].classList.remove('hidden');
}

function renderLobby(state) {
  const players = Object.values(state.players);
  
  playersList.innerHTML = players.map(p => {
    let info = p.nickname;
    if (p.id === socket.id) info += ' (você)';
    if (p.ready) info += ' ✓';
    return `<li>${info}</li>`;
  }).join('');

  ['red', 'blue', 'neutral'].forEach(team => {
    const container = document.getElementById(`${team}-players`);
    const teamPlayers = players.filter(p => p.team === team);
    
    container.innerHTML = teamPlayers.map(p => `
      <div>
        ${p.nickname} 
        ${p.id === socket.id ? '(você)' : ''}
        ${p.role === 'spymaster' ? '(Spymaster)' : ''}
        ${p.ready ? '<span class="ready-indicator"></span>' : ''}
      </div>
    `).join('');
  });

  document.querySelectorAll('.role-btn').forEach(btn => {
    const team = btn.dataset.team;
    const role = btn.dataset.role || 'observer';
    const player = state.players[socket.id];
    
    btn.classList.remove('selected');
    if (player && player.team === team && player.role === role) {
      btn.classList.add('selected');
    }
  });

  const myPlayer = state.players[socket.id];
  if (myPlayer && myPlayer.team && myPlayer.team !== 'neutral') {
    readyBtn.classList.remove('hidden');
    readyBtn.textContent = myPlayer.ready ? 'Cancelar Pronto' : 'Pronto';
    if (myPlayer.ready) {
      readyBtn.classList.add('ready');
    } else {
      readyBtn.classList.remove('ready');
    }
    
    const allReady = players
      .filter(p => p.team && p.team !== 'neutral')
      .every(p => p.ready);
    
    if (allReady) {
      startBtn.classList.remove('hidden');
    } else {
      startBtn.classList.add('hidden');
    }
  } else {
    readyBtn.classList.add('hidden');
    startBtn.classList.add('hidden');
  }
}

function renderGame(state) {
  const myPlayer = state.players[socket.id];
  
  if (state.turn === 'red') {
    turnDot.className = 'turn-dot red';
    teamIndicator.textContent = 'Turno: Vermelho';
  } else {
    turnDot.className = 'turn-dot blue';
    teamIndicator.textContent = 'Turno: Azul';
  }

  if (myPlayer) {
    const teamName = myPlayer.team === 'red' ? 'Vermelho' : myPlayer.team === 'blue' ? 'Azul' : 'Observador';
    const roleName = myPlayer.role === 'spymaster' ? 'Spymaster' : myPlayer.role === 'operative' ? 'Operativo' : 'Observador';
    playerInfo.textContent = `Você: ${myPlayer.nickname} | Time: ${teamName} | ${roleName}`;
    playerInfo.className = `player-info player-${myPlayer.team}`;
  }

  redScoreEl.textContent = state.gameData.scores.red;
  blueScoreEl.textContent = state.gameData.scores.blue;

  if (state.gameData.clue) {
    clueWord.textContent = state.gameData.clue.word;
    clueNumber.textContent = `: ${state.gameData.clue.number}`;
    clueSpymaster.textContent = `Dica do Spymaster ${state.gameData.clue.spymaster}`;
  } else {
    clueWord.textContent = '---';
    clueNumber.textContent = '';
    clueSpymaster.textContent = '';
  }

  if (myPlayer) {
    if (myPlayer.role === 'spymaster') {
      spymasterControls.classList.remove('hidden');
      operativeControls.classList.add('hidden');
    } else if (myPlayer.role === 'operative') {
      spymasterControls.classList.add('hidden');
      operativeControls.classList.remove('hidden');
      
      if (state.turn === myPlayer.team && state.gameData.clue) {
        guessInfo.textContent = `Dica: ${state.gameData.clue.word} (${state.gameData.clue.number}) - Acerte quantas quiser!`;
      } else if (state.turn !== myPlayer.team) {
        guessInfo.textContent = 'Aguarde o turno do seu time';
      } else {
        guessInfo.textContent = 'Aguarde a dica do Spymaster';
      }
    } else {
      spymasterControls.classList.add('hidden');
      operativeControls.classList.add('hidden');
    }
  }

  renderBoard(state);

  if (state.phase === 'gameover') {
    showGameOver(state);
  } else {
    gameoverModal.classList.add('hidden');
    newGameBtn.classList.remove('hidden');
  }
}

function renderBoard(state) {
  const myPlayer = state.players[socket.id];
  const cards = state.gameData.cards;
  const markedCards = state.gameData.markedCards || [];
  
  gameBoard.innerHTML = '';
  
  cards.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.textContent = card.word;
    
    if (card.revealed) {
      cardEl.classList.add('revealed', card.type);
    }
    
    if (myPlayer && myPlayer.role === 'spymaster') {
      if (!card.revealed) {
        cardEl.classList.add('secret', card.type);
      } else {
        cardEl.classList.add(card.type);
      }
    }
    
    const myTeam = myPlayer?.team;
    const hasTeamMark = markedCards.filter(m => m.cardIndex === index && m.team === myTeam && myTeam && myTeam !== 'neutral');
    const hasAnyMark = markedCards.filter(m => m.cardIndex === index && myTeam === 'neutral');
    
    if (hasTeamMark.length > 0 && !card.revealed) {
      cardEl.classList.add('marked', `marked-${myTeam}`);
    } else if (hasAnyMark.length > 0 && !card.revealed) {
      hasAnyMark.forEach(m => {
        cardEl.classList.add('marked', `marked-${m.team}`);
      });
    }
    
    if (selectedCardIndex === index) {
      cardEl.classList.add('selected');
    }
    
    const isMyTurn = myPlayer && myPlayer.role === 'operative' && state.turn === myPlayer.team && state.gameData.clue;
    
    if (!card.revealed && isMyTurn) {
      cardEl.addEventListener('click', () => {
        selectedCardIndex = index;
        verifyBtn.disabled = false;
        renderBoard(state);
      });
    } else if (myPlayer && myPlayer.role === 'spymaster' && !card.revealed) {
      cardEl.addEventListener('click', () => {
        socket.emit('markCard', { cardIndex: index });
      });
    }
    
    gameBoard.appendChild(cardEl);
  });
}

function showGameOver(state) {
  newGameBtn.classList.add('hidden');
  gameoverModal.classList.remove('hidden');
  
  if (state.winner === 'red') {
    gameoverTitle.textContent = 'Time Vermelho Vence!';
    gameoverTitle.style.color = '#e53935';
  } else {
    gameoverTitle.textContent = 'Time Azul Vence!';
    gameoverTitle.style.color = '#1e88e5';
  }
  
  let reason = '';
  if (state.gameData.reason === 'assassin') {
    reason = 'O time acertou a palavra ASSASSINA!';
  } else if (state.gameData.reason === 'cleared') {
    reason = 'O time revelou todas as suas palavras!';
  }
  
  gameoverMessage.textContent = reason;
}
