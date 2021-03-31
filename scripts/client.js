
const BOARD_SIZE = 36;
const MOVE_TIME = 10;
const SHOW_TIME = 2;
const EMOJI = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐥","🦉","🐺"];
const STATES = {
	0: "not started",
	1: "your turn",
	2: "opponents turn",
	3: "showing",
	4: "game finished"
};

const socket = io();
let root;
let playerNum, yourTurn = false, firstCard = true;
const move = Array(2);

socket.on("init", handleInit);
socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);

addEventListener("load", () => {

	createBoard();
	createEvents();
	hide(id("intro"));
	hide(id("game"));

});

function handleGameOver(data) {
	id("status").innerHTML = STATES[4];
}

function handleInit(num) {
	playerNum = num;
	hide(id("menu"));
	show(id("game"));
}

function handleGameCode(code) {
	id("gamecode").innerHTML = "code: " + code;
}

function handleUnknownCode() {
	alert("Unknown code");
}

function handleTooManyPlayers() {
	alert("Too many players");
}

function handleGameState(data) {
	const gameState = JSON.parse(data);
	fillBoard(gameState.board, gameState.move);
	let status;
	if(gameState.state == 1 || gameState.state == 2) {
		const time = formatTime(MOVE_TIME - gameState.timer);
		yourTurn = gameState.state == playerNum;
		if(!yourTurn) {
			firstCard = true;
		}
		status = (yourTurn ? STATES[1] : STATES[2]) + " - " + time;
	} else if(gameState.state == 3) {
		yourTurn = false;
		const time = formatTime(SHOW_TIME - gameState.timer);
		status = STATES[3] + " - " + time;
	} else {
		yourTurn = false;
		status = STATES[4];
	}
	id("status").innerHTML = status;
	
	if(id("status").innerHTML.indexOf("your") !== -1) {
		id("playerYou").style.backgroundColor = 'pink';
		id("playerOpponent").style.backgroundColor = '#fff';
	}
	if(id("status").innerHTML.indexOf("opponents") !== -1) {
		id("playerYou").style.backgroundColor = '#fff';
		id("playerOpponent").style.backgroundColor = 'pink';
	}

	id("playerYou").innerHTML = "<h2>you</h2>" + 
	"<p>score: " + gameState.players[playerNum - 1].score + "</p>";
	id("playerOpponent").innerHTML = "<h2>opponent</h2>" + 
	"<p>score: " + gameState.players[playerNum % 2].score + "</p>";
}

function formatTime(num) {
	const fillZero = x => String(x).length == 1 ? "0" + x : x;
	res = fillZero(num % 60);
	let temp = Math.floor(num / 60);
	res = fillZero(temp % 60) + " : " + res;
	if(temp > 59) {
		res = Math.floor(temp / 60) + " : " + res;
	}
	return res;
}

function createBoard() {
	let html = "";
	for(let i = 0; i < BOARD_SIZE; i++) {
		html += "<div class='card' id='" + i + "'></div>";
	}
	id("board").innerHTML = html;
}

function createEvents() {
	if (window.PointerEvent) {                                  /* decent browsers */
    	addEventListener('pointerdown', handleClick);
	}
	else if (window.TouchEvent) {                               /* mobile Safari */
    	addEventListener('touchstart', handleClick);
	}
	else {                                                      /* desktop Safari */
    	etouch.addEventListener('mousedown', handleClick);
	}
	
	//addEventListener('touchstart', handleClick);
	addEventListener('gesturestart', e => {
    		e.preventDefault();
  	});
	addEventListener('touchmove', e => {
    		if(e.scale !== 1) {
      			e.preventDefault();
    		}
  	}, {passive: false});
	
	//addEventListener('touchstart', preventZoom); 
}

function handleClick(e) {
	const elem = e.target;
	if(elem.classList.contains("card") && !elem.classList.contains("card-active")) {
		if(!yourTurn) return;
		elem.classList.add("card-active");
		const cardNum = elem.id;
		if(firstCard) {
			firstCard = false;
			move[0] = cardNum;
			socket.emit("firstCard", cardNum);
		} else {
			firstCard = true;
			yourTurn = false;
			move[1] = cardNum;
			socket.emit("submitMove", cardNum);
		}
	}
}

function fillBoard(board, move) {
	
	const cards = cl("card");
	for(let i = 0; i < cards.length; i++) {
		cards[i].innerHTML = board[i] == -1 ? "" : EMOJI[board[i]];
		if(move.find(e => e.pos == i)) {
			cards[i].classList.add("card-active");
		} else {
			cards[i].classList.remove("card-active");
		}
		if(board[i] == -1) {
			cards[i].classList.remove("card-guessed");
		} else {
			cards[i].classList.add("card-guessed");
		}
	}
	for(let i = 0; i < move.length; i++) {
		cards[move[i].pos].innerHTML = EMOJI[move[i].val];
	}
}

function createGame() {
	socket.emit("newGame");
}

function joinGame() {
	const code = id("code-input").value;
	socket.emit("joinGame", code);
}
