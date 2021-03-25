///////////////////////////////////
//////////// UTILITIES ////////////
///////////////////////////////////

// Selector
function id(arg){
  return document.getElementById(arg);
} 

// Short console.log
var log = console.log;

// Dirty error handling
function stoperror(){
  return true;
} //window.onerror = stoperror;

// Info text
function info(txt) {
    id("infos").style.display = 'flex';
    id("outputinfos").innerText = txt;
    setTimeout(()=>id("infos").style.display = 'none', 1000)
}





let boardElement = null;
const board = [];
const grid = 6;

function make2Darray() {
// Counter to make pair values	
let c = 0;
	for(let i = 0; i < grid; i++) {
		let row = [];
		
		for(let j = 0; j < grid; j++) {
			let col = document.createElement('div');
			col.className = 'cards';
			// Increment c
			c++;
			// Write c value only if its %2
			col.innerHTML = c%2 ==0 ? c : c+1;
			boardElement.appendChild(col);
			row.push(col);
		}
		
		board.push(row);
	}
}

const emojis = [
"👹",
"👹","🐶",
"👹","🐱",
"👹","🐭",
"👹","🐹",
"👹","🐰",
"👹","🦊",
"👹","🐻",
"👹","🐼",
"👹","🐨",
"👹","🐯",
"👹","🦁",
"👹","🐮",
"👹","🐷",
"👹","🐸",
"👹","🐵",
"👹","🐥",
"👹","🦉",
"👹","🐺"
];

/* function gothru() {
	for(let row = 0; row < board.length; row++) {
		for(let col = 0; col < board[row].length; col++) {
			console.log(board[row][col]);
		}
	}
} */


//////////////////////////////////////////////////////////
let p1 = {
	move: true,
	score: 0
};

let p2 = {
	move: false,
	score: 0
};

function handleMoves() {
	p1.move = p1.move === true ? false : true;
	p2.move = p2.move === true ? false : true;
	info("NEXT PLAYER");
	//log(p1.move, p2.move);
	
	if(p1.move && !p2.move) {
		id('p1').style.color = "red";
		id('p2').style.color = "black";
	}
	else if(!p1.move && p2.move) {
		id('p2').style.color = "red";
		id('p1').style.color = "black";
	}
}

///////////////////////////////////////////////
// Timing function
let LASTTIME = 0;
let INTERVAL = 5000;
function loopRAF() {
	let now = Date.now();
	if(!LASTTIME) LASTTIME = now;
	let dt = (now - LASTTIME);
	if(dt >= INTERVAL) {
		LASTTIME = now;
		// log(dt);
		handleMoves();
	}
	
	requestAnimationFrame(loopRAF);
}
// Run rAF in loop
loopRAF();


function cancelLoopRAF () {
	cancelAnimationFrame(loopRAF);
}

///////////////////////////////////////////////

function incrementScore() {
	p1.move === true? p1.score++ : p1.score += 0;
	p2.move === true? p2.score++ : p2.score += 0;
}

function updateScore() {
	id('p1').innerHTML = 'p1: ' + p1.score;
	id('p2').innerHTML = 'p2: ' + p2.score;
}

//////////////////////////////////////////////////////////
let clicked, first, second = null;
let tempFirst, tempSecond = null;

function test(event) {

	// First click
	if(!clicked) {
		first = event.target;
		first.style.backgroundColor = "#D8D8D8";
		tempFirst = first.innerHTML;
		first.innerHTML = emojis[first.innerHTML];
		//console.log(first.innerHTML);
		clicked = true;
	}
	// Second click
	else if (clicked && first && event.target !== first) {
		second = event.target;
		second.style.backgroundColor = "#D8D8D8";
		tempSecond = second.innerHTML;
		second.innerHTML = emojis[second.innerHTML];
		//log(tempSecond);
		//console.log(second.innerHTML);
		//second.removeEventListener("click",test);
		//clicked = false;
		
		// Matching algo
		if(first && second && first.innerHTML === second.innerHTML) {
			//console.log("match!");
			//first.style.backgroundColor = "#D8D8D8";
			//second.style.backgroundColor = "#D8D8D8";
			// Change class to win class
			// Event listeners are for cards class so it also removes listeners
			first.className = 'win';
			second.className = 'win';
			// Remove listeners
			first.removeEventListener("click",test);
			second.removeEventListener("click",test);
			
			// Add and update players score
			incrementScore();
			updateScore();
			LASTTIME = 0;
			//intervalChange();
			// Repeat process
			clicked = false;
		}
		else if(first && second && first.innerHTML !== second.innerHTML) {
			// Handle player moves, if player 1 or player 2 is on move
			handleMoves();
			LASTTIME = 0;
			//intervalChange();
			// Remove listeners and stop unwanted clicks
			document.querySelectorAll('.cards').forEach(item => {
			item.removeEventListener('click', test)
			});
			// Turn colors back after few ms
			setTimeout(function(){
			first.style.backgroundColor = "black";
			second.style.backgroundColor = "black";
			// Set back number innerHTML values
			first.innerHTML = tempFirst;
			second.innerHTML = tempSecond;

			// Add listeners back and let player click again
			document.querySelectorAll('.cards').forEach(item => {
			item.addEventListener('click', test)
			});
			clicked = false;
			},800)
		}
		else {
			clicked = false;
		}
	}
	else if(clicked && first === event.target) {
		//console.log("clicked 2 times");
	}
	else {
		// Repeat process
		clicked = false;
		LASTTIME = 0;
	}
}

//////////////////////////////////////////////////////////

const listeners = () => {

	document.querySelectorAll('.cards').forEach(item => {
		item.addEventListener('click', test)
	});
    //handle click
	//console.log(event.target);
	//console.log(this);
	
	id("menuCreateGame").addEventListener("click", menuCreateGame);
	id("menuJoinGame").addEventListener("click", menuJoinGame);
	id("menuAbout").addEventListener("click", menuAbout);
	id("menuExit").addEventListener("click", menuExit);
};

//////////////////////////////////////////////////////////

///////////////////////////
// Shuffle
///////////////////////////
function shuffle() {
  const container = id("board");
  let elementsArray = Array.prototype.slice.call(container.getElementsByClassName('cards'));
	elementsArray.forEach(function(element){
  	container.removeChild(element);
  })
  shuffleArray(elementsArray);
  elementsArray.forEach(function(element){
  container.appendChild(element);
})
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
///////////////////////////
// Shuffle
///////////////////////////


// Menu function
function menuCreateGame(){
  // Game runs in background so after clicking on createGame time and moves resets
  p2.move = false; p1.move = true; LASTTIME = 0;  
  id("menu").style.display = "none";
}
function menuJoinGame(){
  p2.move = false; p1.move = true; LASTTIME = 0;   
  id("menu").style.display = "none";
}
function menuAbout(){
  p2.move = false; p1.move = true; LASTTIME = 0;    
  id("menu").style.display = "none";
} 
function menuExit(){
  p2.move = false; p1.move = true; LASTTIME = 0;  
  id("menu").style.display = "none";
} 


///////////////////////////
// Menu
///////////////////////////
function menu() {
	document.body.innerHTML +=
		'<div class="wrapper">'+
		  '<div id="menu">'+
            '<div class="nadpis">'+'<h1>PEXESO</h1>'+'</div>'+
			'<div class="nadpis2">'+'<h3>multiplayer game</h3>'+'</div>'+
			'<button id="menuCreateGame">Create Game</button>'+
			'<button id="menuJoinGame">Join Game</button>'+
			'<button id="menuAbout">About</button>'+
			'<button id="menuExit">Exit</button>'+
		  '</div>'+
		'</div>';
}

///////////////////////////
// Init
///////////////////////////
function init() {
	document.body.innerHTML = '<h1>PEXESO</h1>';
	document.body.innerHTML += '<div id="board"></div>';
	document.body.innerHTML += '<div class="clear"></div>'+'<div id="p1">p1: 0</div>' + '<div id="p2">p2: 0</div>'
	document.body.innerHTML += '<div id="infos">' +'<div id="outputinfos"></div>'+'</div>'
	id('p1').style.color = "red";
	boardElement = id('board');
	make2Darray();
	shuffle(); // Shuffle game array
	menu(); // Show menu
	listeners(); // Add event listeners
}

onload = init;