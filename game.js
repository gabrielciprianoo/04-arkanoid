// --- Constantes ---
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const BLOCK_COLORS = [ 'gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];

const BLOCK_POINTS = {
  gray: 1, red: 2, yellow: 3, cyan: 4,
  magenta: 5, hotpink: 6, green: 7,
};

const GRID_COLS = 8;
const GRID_ROWS = 5;

const LIVES_START = 5;

const HIGHSCORE_KEY = 'arkanoid-highscore';

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 6;
const PADDLE_Y = CANVAS_HEIGHT - 40;

const BALL_RADIUS = 8;
const BALL_SPEED = 4;
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI * ( 60 / 180 ); // clamp: evita rebote casi horizontal

const BLOCK_WIDTH = 56;
const BLOCK_HEIGHT = 20;
const BLOCK_GAP = 4;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = ( CANVAS_WIDTH - ( GRID_COLS * BLOCK_WIDTH + ( GRID_COLS - 1 ) * BLOCK_GAP ) ) / 2;

// --- Canvas ---
const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

// --- Start button (pantalla de inicio) ---
const START_BUTTON = { x: CANVAS_WIDTH / 2 - 60, y: 360, width: 120, height: 44 };

// --- Estado global del juego ---
const gameState = {
  state: 'start', // 'start' | 'playing' | 'gameover' | 'victory'
  score: 0,
  lives: LIVES_START,
  blocks: [],
  paddle: {
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: PADDLE_Y,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
  },
  ball: null,
  highScore: Number( localStorage.getItem( HIGHSCORE_KEY ) ) || 0,
};

// --- Input ---
const keys = {};

window.addEventListener( 'keydown', ( e ) => { keys[ e.key ] = true; } );
window.addEventListener( 'keyup', ( e ) => { keys[ e.key ] = false; } );

// --- Sonidos ---
const sndBounce = new Audio( 'assets/sounds/ball-bounce.mp3' );

function playBounce() {
  sndBounce.currentTime = 0;
  sndBounce.play();
}

// --- Ball ---
function resetBall() {
  const p = gameState.paddle;
  gameState.ball = {
    x: p.x + p.width / 2,
    y: p.y - BALL_RADIUS,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: BALL_RADIUS,
    speed: BALL_SPEED,
  };
}

resetBall();

// --- Blocks ---
function createBlocks() {
  const blocks = [];
  for ( let row = 0; row < GRID_ROWS; row++ ) {
    for ( let col = 0; col < GRID_COLS; col++ ) {
      const color = BLOCK_COLORS[ ( row * GRID_COLS + col ) % BLOCK_COLORS.length ];
      blocks.push( {
        x: BLOCK_OFFSET_LEFT + col * ( BLOCK_WIDTH + BLOCK_GAP ),
        y: BLOCK_OFFSET_TOP + row * ( BLOCK_HEIGHT + BLOCK_GAP ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        points: BLOCK_POINTS[ color ],
        destroyed: false,
        exploding: false,
        explosionStartTime: 0,
      } );
    }
  }
  gameState.blocks = blocks;
}

createBlocks();

function isInsideButton( px, py, btn ) {
  return px >= btn.x && px <= btn.x + btn.width && py >= btn.y && py <= btn.y + btn.height;
}

canvas.addEventListener( 'click', ( e ) => {
  if ( gameState.state !== 'start' ) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  if ( isInsideButton( clickX, clickY, START_BUTTON ) ) {
    resetBall();
    gameState.state = 'playing';
  }
} );

// --- Update ---
function updatePaddle() {
  const p = gameState.paddle;
  if ( keys[ 'ArrowLeft' ] || keys[ 'a' ] || keys[ 'A' ] ) p.x -= p.speed;
  if ( keys[ 'ArrowRight' ] || keys[ 'd' ] || keys[ 'D' ] ) p.x += p.speed;
  p.x = Math.max( 0, Math.min( CANVAS_WIDTH - p.width, p.x ) );
}

function checkPaddleCollision() {
  const b = gameState.ball;
  const p = gameState.paddle;

  if ( b.dy <= 0 ) return false;
  if ( b.y + b.radius < p.y || b.y - b.radius > p.y + p.height ) return false;
  if ( b.x + b.radius < p.x || b.x - b.radius > p.x + p.width ) return false;

  const relativeIntersect = ( b.x - ( p.x + p.width / 2 ) ) / ( p.width / 2 );
  const clamped = Math.max( -1, Math.min( 1, relativeIntersect ) );
  const angle = clamped * PADDLE_MAX_BOUNCE_ANGLE;

  b.dx = b.speed * Math.sin( angle );
  b.dy = -b.speed * Math.cos( angle );
  b.y = p.y - b.radius;

  return true;
}

function updateBall() {
  const b = gameState.ball;
  b.x += b.dx;
  b.y += b.dy;

  if ( b.x - b.radius < 0 ) {
    b.x = b.radius;
    b.dx *= -1;
    playBounce();
  } else if ( b.x + b.radius > CANVAS_WIDTH ) {
    b.x = CANVAS_WIDTH - b.radius;
    b.dx *= -1;
    playBounce();
  }

  if ( b.y - b.radius < 0 ) {
    b.y = b.radius;
    b.dy *= -1;
    playBounce();
  }

  if ( checkPaddleCollision() ) {
    playBounce();
  }

  if ( b.y - b.radius > CANVAS_HEIGHT ) {
    gameState.lives -= 1;
    if ( gameState.lives <= 0 ) {
      gameState.state = 'gameover';
    } else {
      resetBall();
    }
  }
}

function update() {
  if ( gameState.state === 'playing' ) {
    updatePaddle();
    updateBall();
  }
}

// --- Render ---
function drawStartScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = 'bold 40px sans-serif';
  ctx.fillText( 'ARKANOID', CANVAS_WIDTH / 2, 200 );

  ctx.font = '20px sans-serif';
  ctx.fillText( `High Score: ${ gameState.highScore }`, CANVAS_WIDTH / 2, 260 );

  ctx.fillStyle = '#0a6';
  ctx.fillRect( START_BUTTON.x, START_BUTTON.y, START_BUTTON.width, START_BUTTON.height );

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText( 'Start', CANVAS_WIDTH / 2, START_BUTTON.y + 29 );
}

function drawPlaying() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  const p = gameState.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.width, p.height );

  const b = gameState.ball;
  drawSprite( ctx, 'ball', b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2 );

  gameState.blocks.forEach( ( block ) => {
    if ( block.destroyed ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  } );
}

function render() {
  if ( gameState.state === 'start' ) {
    drawStartScreen();
  } else if ( gameState.state === 'playing' ) {
    drawPlaying();
  }
}

// --- Loop ---
function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
