const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use("/assets", express.static("assets"));

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

const state = {};
const clientRooms = {};

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  socket.on("submitMove", handleSubmitMove);

  function handleJoinGame(roomName) {

    const room = io.sockets.adapter.rooms[roomName];

    let users;
    if(room) {
      const users = room.sockets;
    }

    let num_users = 0;
    if(users) {
      num_users = Object.keys(users).length;
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

    startGameInterval(roomName);
  }

  function handleNewGame() {

    const roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = initGame();

    socket.join(roomName);
    socket.number = 1;
    socket.emit("init", 1);
  }

  function handleSubmitMove(card_nums) {

    const roomName = clientRooms[socket.id];
    if(!roomName) {
      return;
    }
    
    const roomState = state[roomName];
    if((roomState.state == STATE.ONE_PLAYING && socket.number == 1) &&
    (roomState.state == STATE.TWO_PLAYING && socket.number == 2)) {

      try {

        const num1 = card_nums[0];
        const num2 = card_nums[1];

        if(roomState.board[num1] == undefined || roomState.board[num2] == undefined) {
          return;
        }

        roomState.move[0] = num1;
        roomState.move[1] = num2;

        if(roomState.move[0] == roomState.move[1]) {
          roomState.guessed.push(roomState.move[0], roomState.move[1]);
          roomState.players[socket.number - 1].score++;
        }

        roomState.timer = 0;
        roomState.state = STATE.SHOWING;
      } catch(e) {

        console.error(e);
      }

    }
  }
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

function gameLoop(roomState) {

  roomState.timer++;

  return { finished: false, result: [0, 0] };
}

function startGameInterval(roomName) {

  const interval = setInterval(() => {

    const game = gameLoop(state[roomName]);

    if(!game.finished) {
      emitGameState(roomName);
    } else {
      emitGameOver(roomName, game.result);
      clearInterval(interval);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room) {

  const roomState = state[room];
  const board = Array(BOARD_SIZE).fill(0).map(e => -1);

  roomState.guessed.forEach(e => {
    board[e] = roomState.board[e];
  });
  
  io.sockets.in(room).emit("gameState", JSON.stringify({ board: board, players: roomState.players, move: roomState.move }));
}

function emitGameOver(room, result) {
  io.sockets.in(room).emit("gameOver", JSON.stringify({ result }));
}

function initGame() {
  const roomState = createGameState();
  shuffleBoard(roomState);
  return roomState;
}

function createGameState() {

  return {
    timer: 0,
    state: STATE.NOT_STARTED,
    move: Array(2),
    guessed: [],
    players: [ { score: 0 }, { score: 0 } ],
    board: Array(BOARD_SIZE).fill(0).map((e, i) => i % (BOARD_SIZE / 2))
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
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const chars_len = chars.length;
  let str = "";
  for(let i = 0; i < len; i++) {
    str += chars[randint(chars_len)];
  }
  return str;
}

function randint(max, min = 0) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
