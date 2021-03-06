

function initializeAsteroidGame() {
    var geometry	= new THREE.TorusGeometry( 1, 0.42 );
    var material	= new THREE.MeshNormalMaterial();
    var mesh	= new THREE.Mesh( geometry, material );
    mesh.position.set(0, 0, -5);
    scene.add( mesh );
    //scene.add( spaceship );
    camera.lookAt(mesh.position);
    mesh.visible = false;

    camera.rotation.z = 0;

    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    };

    if(!spaceship) loadSpaceship(manager, function() {
        for(var i = 0; i < 10; i++) {
            if(spawn_asteroids) {
                setTimeout(function () {
                    asteroids.push(generateAsteroid());
                }, i * 600);
            }
        }
    });

}

function updateAsteroids() {

    var len = asteroids.length;
    for(var i = len - 1; i >= 0; i--) {
        var obj = asteroids[i];
        if(!obj.position) {
            continue;
        }

        obj.position.z += astVelocity + gameLevel*5;


        if(spaceship !== undefined && gameState == GameStateEnum.PLAYING) {
            detectCollisions(obj);
        }

        // Reset positions
        if(obj.position.z > 500){
            var positionObj = getNewAsteroidPosition();

            var newObj = asteroids.shift();

            newObj.position.set(positionObj.x, positionObj.y, positionObj.z);

            asteroids.push(newObj);
            if(Math.random() > .98 && asteroids.length < MAX_ASTEROIDS) {
                setTimeout(function() {
                    asteroids.push(generateAsteroid());
                }, Math.random()*600+200);
            }
        }

        if(obj.helper) obj.helper.update();
    }
}


function addMesh( meshes ) {

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh( geometry, material );
    meshes.push( mesh );

    return mesh;

}

function updateMesh( bone ) {
    var centerBone = bone.center();
    // normalize the bone about the center axis

    var posX = centerBone[0];
    var posY = centerBone[1]-150;
    var posZ = Math.min(-25, Math.max(centerBone[2] - 250.0, -100.0));

    setSpaceShipPosition(posX, posY, posZ);

}

function setSpaceShipPosition(posX, posY, posZ) {

    if(gameState !== GameStateEnum.PLAYING) return;

    var oldXPos = spaceship.position.x;
    var oldYPos = spaceship.position.y;

    var r = (posX*posX + posY*posY);
    if(posX == 0) posX = .00001;
    var theta = Math.atan(posY/posX);

    if(r <= TUNNEL_RADIUS * TUNNEL_RADIUS) {
        spaceship.position.set(posX, posY + 5, posZ);
    }
    else {
        r = TUNNEL_RADIUS;
        if(posX > 0) {
            spaceship.position.setX(r * Math.cos(theta));
            spaceship.position.setY(r * Math.sin(theta) + 5);
        }
        else {
            spaceship.position.setX(-r * Math.cos(theta));
            spaceship.position.setY(-r * Math.sin(theta) + 5);
        }
        spaceship.position.setZ(posZ);
    }

    spaceship.scale.set( .025, .025, .025 );

    var newXPos = spaceship.position.x;

    var xRot = Math.PI;
    var yRot = Math.PI * 11/6;

    if(oldXPos == newXPos && spaceship.rotation.x != Math.PI) {
        xRot += (spaceship.rotation.x - xRot) / 20;
    }
    else {
        xRot -= (oldXPos - newXPos) / 1.5;
    }

    spaceship.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( [xRot,yRot,0,'XYZ'] ) );
    spaceship.quaternion.multiply( baseBoneRotation );

    camera.position.setX(spaceship.position.x / 4);
    camera.position.setY(spaceship.position.y / 4);
    camera.lookAt(new THREE.Vector3(0,0,-100));

    addTailRing();
}

function leapAnimate( frame ) {

    usingLeap = true;

    if(gameState == GameStateEnum.DEAD || gameState == GameStateEnum.MENU){
        if (frame.gestures.length > 0) {
            for (var i = 0; i < frame.gestures.length; i++) {
                var gesture = frame.gestures[i];
                if (gesture.type == "swipe") {
                    transitionTo(GameStateEnum.PLAYING);
                }
            }
        }
    }

    if(gameState != GameStateEnum.PLAYING)
        return;

    if(frame.hands[0]) {
        if(spaceship && frame.hands[0].fingers[0].bones[0]) {
            updateMesh(frame.hands[0].fingers[0].bones[0], spaceship);
        }
    }
    else {

    }

}

function updateSpaceshipByMouse() {
    if(spaceship) {
        var newX = ( mouseX - (window.innerWidth / 2) ) / sensitivityLevel;
        var newY = ( window.innerHeight-mouseY - (window.innerHeight / 2) ) / sensitivityLevel;
        setSpaceShipPosition(newX, newY, -100);
    }
}

function generateAsteroid() {
    var radius = Math.random() * 3 + 1;
    var geometry = new THREE.SphereGeometry( radius );
    var material = new THREE.MeshNormalMaterial();
    var sphere = new THREE.Mesh( geometry, material );

    var positionObj = getNewAsteroidPosition();
    sphere.position.set(positionObj.x, positionObj.y, positionObj.z);

    scene.add(sphere);

    if(debug_mode) {
        sphere.helper = new THREE.BoundingBoxHelper(sphere);
        sphere.helper.update();
        scene.add(sphere.helper);
    }

    return sphere;
}

function getNewAsteroidPosition() {
    // polar coordinates to determine the spawn area of the particles
    var r = Math.random()*28;
    var theta = Math.random()*Math.PI*2;

    // give it a random x and y position between -500 and 500

    var newPosition = {
        x: 0,
        y: 0,
        z: -5000
    }

    newPosition.x = (r * Math.cos(theta));
    newPosition.y = (r * Math.sin(theta));

    return newPosition;
}

function detectCollisions(obj) {
    if(spaceship.recovery) {
        return;
    }

    var pos = obj.position.distanceTo(spaceship.position);
    if(pos < 150) {
        var compBox = new THREE.Box3().setFromObject(obj);
        var ssbox = new THREE.Box3().setFromObject(spaceship);
        var min = compBox.min;
        var max = compBox.max;
        var smin = ssbox.min;
        var smax = ssbox.max;

        var newBox = new THREE.Box3(new THREE.Vector3(min.x + 1, min.y + 1, min.z + 1), new THREE.Vector3(max.x - 1, max.y - 1, max.z - 1));
        var nmin = newBox.min;
        var nmax = newBox.max;
        if(((nmin.x < smax.x && nmin.x > smin.x ) || ( nmax.x > smin.x && nmax.x < smax.x)) &&
            ((nmin.y < smax.y && nmin.y > smin.y ) || ( nmax.y > smin.y && nmax.y < smax.y)) &&
            nmax.z >= smin.z) {

            playerHit();
        }
        //if (newBox.isIntersectionBox(new THREE.Box3().setFromObject(spaceship))) {
        //    playerHit();
        //}
    }
}

var tailRings = [];

function addTailRing() {
    var material = new THREE.MeshNormalMaterial();
    var radius = 0.75;
    var segments = 26;

    var circleGeometry = new THREE.CircleGeometry(radius, segments);
    var circle = new THREE.Mesh(circleGeometry, material);

    //circle.position.z = step;
    circle.visible = false;
    var edgesCircle = new THREE.EdgesHelper(circle, 0xAD42C7);
    circle.position.setX(spaceship.position.x);
    circle.position.setY(spaceship.position.y - 5);
    circle.position.setZ(spaceship.position.z);

    scene.add(circle);
    scene.add(edgesCircle);

    tailRings.push([circle, edgesCircle]);
}

function updateTailRings() {
    for (var i = tailRings.length-1; i >= 0; i--) {
        var item = tailRings[i];
        item[0].position.z += TUNNEL_VELOCITY;

        if(item[0].position.z >= 0.0) {
            scene.remove(item[0]);
            scene.remove(item[1]);
            tailRings.splice(i, 1);
        }
    }
}

function loadSpaceship(manager, callback) {
    // instantiate a loader
    var loader = new THREE.OBJMTLLoader(manager);

    if(loadAssets) {
        // load an obj / mtl resource pair
        loader.load(
            // OBJ resource URL
            'models/stuntglyder/stunt_glyder.obj',
            // MTL resource URL
            'models/stuntglyder/stunt_glyder.mtl',
            // Function when both resources are loaded
            function ( object ) {
                object.position.set(0, 250, -1000);
                spaceship = object;
                spaceship.recovery = false;
                scene.add( spaceship );
                if(debug_mode) {
                    spaceship.helper = new THREE.BoundingBoxHelper(spaceship);
                    scene.add(spaceship.helper);
                    var axisHelper = new THREE.AxisHelper( 25 );
                    spaceship.add( axisHelper );
                }

                callback();
            },
            // Function called when downloads progress
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            // Function called when downloads error
            function ( xhr ) {
                console.log( 'An error happened' );
            }
        );
    } else {
        spaceship = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshNormalMaterial());
    }

}


function pauseGame(){
    if(gameState == GameStateEnum.PLAYING){
        transitionTo(GameStateEnum.PAUSED);
    }
}

function resumeGame(){
    if(gameState == GameStateEnum.PAUSED){
        transitionTo(GameStateEnum.PLAYING);
    }
}