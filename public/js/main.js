var GameStateEnum = Object.freeze({MENU : 0, CREDITS: 1, PLAYING : 2, DEAD: 3, INIT : 4, OPTIONS : 5, PAUSED : 6, LEADERBOARD : 7});

var explosionSound = new Audio("Sounds/Explosion.mp3");
var hitSound = new Audio("Sounds/Hit.mp3");

// start in the init state
var gameState = GameStateEnum.INIT;
var gameTimer = new THREE.Clock(false);
var gameLives = 3;
var gameLevel = 1;
var gameTimerUpdateString = undefined;

///////////////////////////
// RENDER STATE
///////////////////////////
var stats, scene, renderer;
var camera;

var baseBoneRotation = ( new THREE.Quaternion ).setFromEuler( new THREE.Euler( 0, 0, Math.PI / 2 ) );
var mouseX = window.innerWidth/2;
var mouseY = window.innerHeight/2;
var sensitivityLevel = 5;
var animateID;
var totalSeconds;
var submitted = false;

///////////////////////////
// SETTINGS
///////////////////////////
var rangeLimited = true;
var loadAssets = true;      // load expensive assets and show the progress bar
var gameplay = true;        // enabled if the game is going to be played
var usingLeap = false;      // Support for LeapMotion
var debug_mode = false;     // Shows bounding boxes of asteroids and ship
var spawn_asteroids = true; // If true, asteroids will spawn

///////////////////////////
// ENVIRONMENT VARIABLES
///////////////////////////
var FOG_FALLOFF = 0.003;
var RECOVER_TIME = 750;    // Recovery time in ms

// tunnel variables
var TUNNEL_BACK = -800.0;
var TUNNEL_RADIUS = 25;
var TUNNEL_SEGMENT_STEP = 30.0;
var currColorPointer = 0;
var levelColorArray = [0x0000FF, 0xFF0000, 0x33FF00, 0xFFFFFF, 0xFF00CC];
var tunnelSegments = [];
var TUNNEL_VELOCITY = 2.3 * gameLevel;
var particles = [];

// asteroidVariables
var asteroids = [];
var astVelocity = 25;
var spaceship = undefined;
var MAX_ASTEROIDS = 100;


/////////////////////////////////////////////////////////////////////////////////////////
// Event listener to track mouse movement
document.onmousemove = function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
}

// do one time initialization
if( !init() ) {
    // enter the main menu
    transitionTo(GameStateEnum.MENU);
    animate();
}

// init the scene
function init(){

    document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true);

    if( Detector.webgl ){
        renderer = new THREE.WebGLRenderer({
            antialias       : true, // to get smoother output
            preserveDrawingBuffer   : true  // to allow screenshot
        });

        renderer.setClearColor(0x000000, 1);
        // uncomment if webgl is required
        //}else{
        //  Detector.addGetWebGLMessage();
        //  return true;
    }else{
        renderer    = new THREE.CanvasRenderer();
    }
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    // add Stats.js - https://github.com/mrdoob/stats.js
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom   = '0px';
    document.body.appendChild( stats.domElement );

    // create a scene for all scenes
    scene = new THREE.Scene();

    // put a camera in the scene
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 0, 5);
    scene.add(camera);

    var light = new THREE.AmbientLight( 0xBBBBBB ); // soft white light
    scene.add( light );
    // create a camera contol
    cameraControls  = new THREEx.DragPanControls(camera);

    // allow debugging with the camera
    if(rangeLimited) {
        cameraControls.rangeX = -5;
        cameraControls.rangeY = 5;
    }

    // transparently support window resize
    THREEx.WindowResize.bind(renderer, camera);

    //var oldFullScreenCancel = THREEx.FullScreen.cancel;
    //THREEx.FullScreen.cancel = function () {
    //  console.log("Cancelling fullscreen");
    //  document.getElementById('inlineDoc').style.display = true;
    //  oldFullScreenCancel()
    //};
    //var oldFullScreenRequest = THREEx.FullScreen.request;
    //THREEx.FullScreen.request = function (entity) {
    //  console.log("Entering fullscreen");
    //  document.getElementById('inlineDoc').style.display = false;
    //  oldFullScreenRequest()
    //};

    // allow 'f' to go fullscreen where this feature is supported
    if( THREEx.FullScreen.available() ){
        THREEx.FullScreen.bindKey();
        document.getElementById('inlineDoc').innerHTML = "F for fullscreen";
    }

    if(gameplay) {
        Leap.loop( {background: true}, leapAnimate ).connect();
    }

}

function clearScene() {
    asteroids = [];
    scene.remove(spaceship);
    spaceship = undefined;
    for( var i = scene.children.length - 1; i >= 0; i--) {
        var obj = scene.children[i];
        scene.remove(obj);
    }
}

function sceneMainMenu() {
    clearScene();

    // put a camera in the scene
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 0, 5);
    scene.add(camera);

    var light = new THREE.AmbientLight( 0xBBBBBB ); // soft white light
    scene.add( light );
    // create a camera contol
    cameraControls  = new THREEx.DragPanControls(camera);

    // allow debugging with the camera
    if(rangeLimited) {
        cameraControls.rangeX = -5;
        cameraControls.rangeY = 5;
    }

    // transparently support window resize
    THREEx.WindowResize.bind(renderer, camera);

    // draw fog
    scene.fog = new THREE.FogExp2(0x0, FOG_FALLOFF);

    makeTunnel();
    makeParticles();
}


function scenePlaying() {
    clearScene();

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 0, 5);
    scene.add(camera);

    var light = new THREE.AmbientLight( 0xBBBBBB ); // soft white light
    scene.add( light );
    // create a camera contol
    cameraControls  = new THREEx.DragPanControls(camera);

    // allow debugging with the camera
    if(rangeLimited) {
        cameraControls.rangeX = -5;
        cameraControls.rangeY = 5;
    }

    // transparently support window resize
    THREEx.WindowResize.bind(renderer, camera);

    // draw fog
    scene.fog = new THREE.FogExp2(0x0, FOG_FALLOFF);

    if(gameplay) {
        initializeAsteroidGame();
    }

    makeTunnel();
    makeParticles();
}

function scenePaused() {
    cancelAnimationFrame( animateID );
    gameTimer.stop();
}

function sceneResumed() {
    //animate();
    gameTimer.start();
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// reset's the game timer and level and stops any playing events
function resetGameState() {
    gameTimer = new THREE.Clock(false);
    gameLevel = 1;
    gameLives = 3;
    currColorPointer = 0;

    if(gameTimerUpdateString) clearInterval(gameTimerUpdateString);
    document.getElementById('hud-time').innerText = "00:00";
}

function drawLevel() {
    document.getElementById('hud-level').innerText = "Level " + gameLevel;
}

// resets any current game state and immediately starts a new game
function startNewGame() {
    document.body.style.cursor = 'none';
    resetGameState();
    var nextLevelTime = 15;
    gameTimer.start();
    submitted = false;

    // update the play timer
    gameTimerUpdateString = setInterval(function() {
        var minutes = parseInt(gameTimer.getElapsedTime()/60);
        var seconds = parseInt(gameTimer.getElapsedTime() % 60);
        totalSeconds = parseInt(gameTimer.getElapsedTime());

        if(totalSeconds >= nextLevelTime){
            currColorPointer = (currColorPointer+1) % levelColorArray.length;
            nextLevelTime += 15;

            gameLevel += 1;
            drawLevel();
        }
        document.getElementById('hud-time').innerText = pad(minutes, 2) + ":" + pad(seconds, 2);
    }, 500);

    drawHealthBar();
    drawLevel();
}

function playerHit() {
    gameLives -= 1;

    drawHealthBar();

    if(gameLives <= 0) {
        scene.remove( spaceship );
        transitionTo(GameStateEnum.DEAD)
    }
    else if (GameStateEnum.PLAYING) {
        hitSound.play();
        blinkShip();
    }
}

function blinkShip() {
    spaceship.recovery = true;
    scene.remove(spaceship);
    setTimeout(function() {
        scene.add(spaceship);
        setTimeout(function() {
            scene.remove(spaceship);
            setTimeout(function() {
                scene.add(spaceship);
                spaceship.recovery = false;
            }, RECOVER_TIME/3);
        }, RECOVER_TIME/3);
    }, RECOVER_TIME/3);
}


function drawHealthBar() {
    var healthBar = document.getElementById('health-bar')

    if(gameLives == 3)
        healthBar.className = "full";
    else if(gameLives == 2)
        healthBar.className = "medium";
    else if(gameLives == 1)
        healthBar.className = "low";
    else if(gameLives <= 0)
        healthBar.className = "empty";
}

// stops the current game, but doesnt destroy the game state
function stopGame() {
    document.body.style.cursor = 'default';
    gameTimer.stop();
    clearInterval(gameTimerUpdateString);
}

function transitionTo(newGameState) {
    if(gameState == GameStateEnum.INIT) {
        if(newGameState != GameStateEnum.MENU) {
            throw new Error("Invalid state transition: " + newGameState);
        }

        resetGameState();
        sceneMainMenu();
    } else if(gameState == GameStateEnum.MENU) {

        if (newGameState == GameStateEnum.CREDITS) {
        } else if (newGameState == GameStateEnum.PLAYING) {
            startNewGame();
            scenePlaying();
        } else if (newGameState == GameStateEnum.OPTIONS) {
        } else if (newGameState == GameStateEnum.LEADERBOARD){
        } else {
            throw new Error("Invalid state transition: " + newGameState);
        }
    } else if(gameState == GameStateEnum.OPTIONS) {
        if(newGameState != GameStateEnum.MENU) {
            throw new Error("Invalid state transition: " + newGameState);
        }
    } else if(gameState == GameStateEnum.CREDITS) {
        if(newGameState != GameStateEnum.MENU) {
            throw new Error("Invalid state transition: " + newGameState);
        }
    } else if(gameState == GameStateEnum.PLAYING) {
        if (newGameState == GameStateEnum.PLAYING) {
            // ignore
        } else if(newGameState == GameStateEnum.PAUSED){
            scenePaused();
        } else if (newGameState != GameStateEnum.DEAD) {
            throw new Error("Invalid state transition: " + newGameState);
        } else {
            explosionSound.play();
            stopGame();
        }
    } else if(gameState == GameStateEnum.DEAD) {

        if(newGameState == GameStateEnum.MENU) {
            sceneMainMenu();
        } else if(newGameState == GameStateEnum.PLAYING) {
            startNewGame();
            scenePlaying();
        } else {
            throw new Error("Invalid state transition: " + newGameState);
        }
        resetGameOverScreen();
    } else if(gameState == GameStateEnum.PAUSED) {
        if(newGameState == GameStateEnum.PLAYING) {
            sceneResumed();
        }
    } else if(gameState == GameStateEnum.LEADERBOARD) {
        if(newGameState != GameStateEnum.MENU) {
            throw new Error("Invalid state transition: " + newGameState);
        }
    } else {
        throw new Error("Invalid state");
    }

    gameState = newGameState;

    drawMenu();
}

function drawMenu() {
    var hudDead = document.getElementById('game-hud-dead');
    var hud = document.getElementById('game-hud');
    var options = document.getElementById('options-menu');
    var credits = document.getElementById('credits-menu');
    var title = document.getElementById('title-menu');
    var fullscreenText = document.getElementById('inlineDoc');
    var hudPaused = document.getElementById('game-hud-paused');
    var leaderboard = document.getElementById('leaderboard-menu');
    // turn everything off

    var all = [hudDead, hud, options, credits, title, fullscreenText, hudPaused, leaderboard];
    all.forEach(function(item){item.style.display = "none"});

    if(gameState == GameStateEnum.INIT) {
    } else if(gameState == GameStateEnum.MENU) {
        title.style.display = "block";
        fullscreenText.style.display = "block";

        //console.log("MENU: " + "MAIN")
    } else if(gameState == GameStateEnum.OPTIONS) {
        options.style.display = "block";

        //console.log("MENU: " + "OPTIONS")
    } else if(gameState == GameStateEnum.CREDITS) {
        credits.style.display = "block";

        //console.log("MENU: " + "CREDITS")
    } else if(gameState == GameStateEnum.PLAYING) {
        hud.style.display = "inline-block";

        //console.log("MENU: " + "PLAYING")
    } else if(gameState == GameStateEnum.DEAD) {
        hudDead.style.display = "block";
        hud.style.display = "inline-block";

        //console.log("MENU: " + "DEAD")
    } else if(gameState == GameStateEnum.PAUSED) {
        hudPaused.style.display = "block";

    } else if(gameState == GameStateEnum.LEADERBOARD) {
        leaderboard.style.display = "block";
    } else {
        throw new Error("Invalid state");
    }
}

function setSensitivity(value) {
    sensitivityLevel = (10 - value);

}

function toggleFPS(checked) {
    
    if(checked == undefined) {
        var cb = document.getElementById("fps_checkbox")
        cb.checked = !cb.checked;
        checked = cb.checked;
    }

    if(checked == undefined) {
        var cb = document.getElementById("fps_checkbox")
        cb.checked = !cb.checked;
        checked = cb.checked;
    }

    if(checked) {
        document.getElementById("stats").style.display = "block";
    }
    else {
        document.getElementById("stats").style.display = "none";
    }
}

function toggleMusic(checked) {
    if(checked == undefined) {
        var cb = document.getElementById("music_checkbox")
        cb.checked = !cb.checked;
        checked = cb.checked;
    }

    var music = document.getElementById("music-player");

    if(checked) {
        music.play();
    } else {
        music.pause();
        music.currentTime = 0;
    }
}

// animation loop
function animate() {

    requestAnimationFrame(animate);

    // animate the tunnel
    updateTunnel();
    updateParticles();

    // animate others
    if(!usingLeap) updateSpaceshipByMouse();
    updateTailRings();
    updateAsteroids();
    if(spaceship && spaceship.helper) spaceship.helper.update();

    // do the render
    render();

    // update stats
    stats.update();
}

var numFrames = 0;

// render the scene
function render() {

    renderer.render( scene, camera );
}

function touchHandler(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }


    // initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //                screenX, screenY, clientX, clientY, ctrlKey,
    //                altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
        first.screenX, first.screenY,
        first.clientX, first.clientY, false,
        false, false, false, 0/*left*/, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function submitScore() {
    console.log('submitting score of', totalSeconds,'for',$("#high_score_input").val());
    if(!submitted) {
        $.post('addScore', {username: $("#high_score_input").val(), totSeconds: totalSeconds}, function (data, result) {
            console.log('Submission request returned ', data.success);
            if (data.success) {
                $("#submission_message").text("Success");
                $("#submit_button").hide();
                submitted = true;
            }
            else {
                console.log(data.errMessage);
                $("#submission_message").text("Submission Failed");
                submitted = false;
            }
            $("#submission_message").show();
        });
    }
}

function resetGameOverScreen() {
    $("#submit_button").show();
    $("#submission_message").hide();
}