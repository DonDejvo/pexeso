const express = require("express");
const { stat } = require("fs");
const { cursorTo } = require("readline");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const favicon = require("serve-favicon");

app.use("/assets", express.static("assets"));
app.use("/scripts", express.static("scripts"));
app.use(favicon(__dirname + "/favicon.ico"));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const FRAME_RATE = 30;
const BOARD_SIZE = 36;
const STATE = {
  NOT_STARTED: 0,
  ONE_PLAYING: 1,
  TWO_PLAYING: 2,
  SHOWING: 3,
  NO_GAME: 4
};
const MOVE_TIME = 10;
const SHOW_TIME = 2;
const DIFFICULTY = {
  EASY: 2,
  MEDIUM: 6,
  HARD: 12,
  INSANE: 18
}

const state = {};
const clientRooms = {};

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', (socket) => {

  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  socket.on("submitMove", handleSubmitMove);
  socket.on("firstCard", handleFirstCard);

  function handleJoinGame(roomName) {

    const room = io.sockets.adapter.rooms.get(roomName);

    let num_users = 0;
    if(room) {

      num_users = room.size;
    }

    if(num_users == 0) {
      socket.emit("unknownCode");
      return;
    } else if(num_users > 1) {
      socket.emit("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = roomName;

    socket.join(roomName);
    socket.number = 2;
    socket.emit("init", 2);
    socket.emit("gameCode", roomName);

    startGameInterval(roomName);
  }

  function handleNewGame(data) {

    const roomName = makeid(4);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = initGame(data);

    socket.join(roomName);
    socket.number = 1;
    socket.emit("init", 1);

    if(data.single) {
      startGameInterval(roomName);
    }
  }

  function handleFirstCard(cardNum) {
    
    const roomName = clientRooms[socket.id];
    if(!roomName) {
      return;
    }
  
    const roomState = state[roomName];
    if((roomState.state == STATE.ONE_PLAYING && socket.number == 1) ||
    (roomState.state == STATE.TWO_PLAYING && socket.number == 2)) {
  
      try {
  
        const num = parseInt(cardNum);
  
        firstCard(roomState, num);
  
      } catch(e) {
  
        console.error(e);
      }
    }
  }

  function handleSubmitMove(cardNum) {

    const roomName = clientRooms[socket.id];
    if(!roomName) {
      return;
    }
    
    const roomState = state[roomName];
    if((roomState.state == STATE.ONE_PLAYING && socket.number == 1) ||
    (roomState.state == STATE.TWO_PLAYING && socket.number == 2)) {
  
      try {
  
        const num = parseInt(cardNum);
  
        secondCard(roomState, num, socket.number);

      } catch(e) {
  
        console.error(e);
      }
  
    }
  }
  
});

function firstCard(roomState, num) {

  if(roomState.board[num] == undefined ||
    roomState.guessed.includes(num)) {
    return;
  }

  roomState.move[0] = num;
  roomState.played.push(num);
}

function secondCard(roomState, num, playerNum) {

  if(roomState.board[num] == undefined ||
    roomState.guessed.includes(num)) {
    return;
  }

  roomState.move[1] = num;
  roomState.played.push(num);
  while(roomState.played.length > roomState.difficulty) {
    roomState.played.shift();
  }

  let success = false;
  if(roomState.board[roomState.move[0]] == roomState.board[roomState.move[1]]) {
    
    success = true;
    roomState.guessed.push(roomState.move[0], roomState.move[1]);
    roomState.players[playerNum - 1].score++;
  }

  roomState.timer = 0;
  roomState.state = STATE.SHOWING;
  if(!success) {
    roomState.last = playerNum;
  }
}

function gameLoop(roomState) {

  roomState.timer++;

  if(roomState.single && roomState.state == STATE.TWO_PLAYING) {

    const not_guessed = [];
    for(let i = 0; i < BOARD_SIZE; i++) {
      if(!roomState.guessed.includes(i)) {
        not_guessed.push(i);
      }
    }
    
    let card1, card2;
    let done = false;
    
    let played = roomState.played.slice();
    played.sort((a, b) => roomState.board[b] - roomState.board[a]);
    for(let i = 0; i < played.length - 1; i++) {
      const a = played[i];
      const b = played[i + 1];
      if(not_guessed.includes(a) && roomState.board[a] == roomState.board[b] && a != b) {
        card1 = a;
        card2 = b;
        done = true;
        break;
      }
    }

    if(!done) {
    let num1 = randint(not_guessed.length - 1);
    card1 = not_guessed[num1];
    for(let i = 0; i < played.length; i++) {
      const a = played[i];
      if(a != card1 && roomState.board[a] == roomState.board[card1]) {
        done = true;
        card2 = a;
        break;
      }
    }
    }
    
    if(!done) {
    let num2 = randint(not_guessed.length - 1);
    if(num1 == num2) {
      num2 = (num2 + 1) % not_guessed.length;
    }
    card2 = not_guessed[num2];
    }

    firstCard(roomState, card1);
    secondCard(roomState, card2, 2);
  }

  if(roomState.state == STATE.SHOWING && roomState.timer > FRAME_RATE * SHOW_TIME) {

    roomState.timer = 0;
    roomState.move[0] = undefined;
    roomState.move[1] = undefined;
    roomState.state = roomState.last == 2 ? STATE.ONE_PLAYING : STATE.TWO_PLAYING;
  } else if((roomState.state == STATE.ONE_PLAYING || roomState.state == STATE.TWO_PLAYING) && 
  roomState.timer > FRAME_RATE * MOVE_TIME) {
    
    roomState.move[0] = undefined;
    roomState.move[1] = undefined;
    roomState.timer = 0;
    roomState.state = roomState.state == STATE.ONE_PLAYING ? STATE.TWO_PLAYING : STATE.ONE_PLAYING;
  }

  return { finished: roomState.guessed.length == roomState.board.length, result: roomState.players };
}

function startGameInterval(roomName) {

  state[roomName].state = STATE.ONE_PLAYING;

  const interval = setInterval(() => {

    const game = gameLoop(state[roomName]);

    if(!game.finished) {
      emitGameState(roomName);
    } else {
      emitGameState(roomName);
      emitGameOver(roomName, game.result);
      clearInterval(interval);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room) {

  const roomState = state[room];
  const board = Array(BOARD_SIZE).fill(0).map(e => -1);
  const move = [];

  if(roomState.move[0] != undefined) {
    //board[roomState.move[0]] = roomState.board[roomState.move[0]];
    move.push({ pos: roomState.move[0] , val: roomState.board[roomState.move[0]] });
    if(roomState.move[1] != undefined) {
      //board[roomState.move[1]] = roomState.board[roomState.move[1]];
      move.push({ pos: roomState.move[1] , val: roomState.board[roomState.move[1]] });
    }
  }

  roomState.guessed.forEach(e => {
    board[e] = roomState.board[e];
  });
  
  io.to(room).emit("gameState", JSON.stringify({ state: roomState.state, board: board, players: roomState.players, timer: Math.floor(roomState.timer / FRAME_RATE), move: move }));
}

function emitGameOver(room, result) {
  io.to(room).emit("gameOver", JSON.stringify({ result }));
}

function initGame(data) {
  const roomState = createGameState(data);
  shuffleBoard(roomState);
  return roomState;
}

function createGameState(data) {

  return {
    timer: 0,
    state: STATE.NOT_STARTED,
    move: Array(2),
    guessed: [],
    players: [ { score: 0 }, { score: 0 } ],
    board: Array(BOARD_SIZE).fill(0).map((e, i) => i % (BOARD_SIZE / 2)),
    last: 0,
    single: data.single,
    difficulty: DIFFICULTY[data.diff] || DIFFICULTY.MEDIUM,
    played: []
  };
}

function shuffleBoard(state) {
  const arr = state.board;
  const len = arr.length;
  for(let i = len - 1; i > 0; i--) {
    const j = randint(i);
    [ arr[i], arr[j] ] = [ arr[j], arr[i] ];
  }
}

function makeid(len) {
  const chars = "abcdefghijklmnpqrstuvwxyz123456789";
  const chars_len = chars.length;
  let str = "";
  for(let i = 0; i < len; i++) {
    str += chars[randint(chars_len - 1)];
  }
  return str;
}

function randint(max, min = 0) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
