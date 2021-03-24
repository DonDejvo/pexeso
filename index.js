const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

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

  function handleJoinGame() {

  }

  function handleNewGame() {

    const roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = initGame();
  }

  function handleSubmitMove() {

  }
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

function initGame() {
  const state = createGameState();
  shuffleBoard(state);
  return state;
}

function createGameState() {

  return {
    timer: 0,
    state: STATE.NOT_STARTED,
    move: Array(2),
    guessed: [],
    board: Array(BOARD_SIZE).fill(0).map((e, i) = i % (BOARD_SIZE / 2));
  };
}

function shuffleBoard(gameState) {
  const arr = gameState.board;
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