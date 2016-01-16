

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

    if(!spaceship) loadSpaceship(manager);

    for(var i = 0; i < 10; i++) {
        setTimeout(function () {
            asteroids.push(generateAsteroid({}));
        }, i * 600);
    }

}

function updateAsteroids() {
    for(var i = asteroids.length - 1; i >= 0; i--) {
        var obj = asteroids[i];
        obj.position.z += astVelocity;
        if(obj.position.z > 500){
            scene.remove(obj);
            asteroids.splice(i,1);
            asteroids.push(generateAsteroid({}));
            if(Math.random() > .95 && asteroids.length < MAX_ASTEROIDS) {
                setTimeout(function() {
                    asteroids.push(generateAsteroid({}));
                }, Math.random()*600+200);
            }
        }
        else {
            if(numFrames % 3 == 0 && spaceship !== undefined) {
                detectCollisions(obj);
            }
        }
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

    var r = Math.sqrt(posX*posX + posY*posY);
    var theta = Math.atan(posY/posX);


    if(r <= TUNNEL_RADIUS + 10) {
        spaceship.position.set(posX, posY, posZ);
    }
    else {
        r = TUNNEL_RADIUS;
        if(posX > 0) {
            spaceship.position.setX(r * Math.cos(theta));
            spaceship.position.setY(r * Math.sin(theta));
        }
        else {
            spaceship.position.setX(-r * Math.cos(theta));
            spaceship.position.setY(-r * Math.sin(theta));
        }
        spaceship.position.setZ(posZ);
    }
    //mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( bone.matrix() ) );
    //mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( [-Math.PI/2,-Math.PI/2,Math.PI/2,'XYZ'] ) );
    spaceship.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( [Math.PI,Math.PI*11/6,0,'XYZ'] ) );
    spaceship.quaternion.multiply( baseBoneRotation );
    spaceship.scale.set( .025, .025, .025 );

    camera.position.setX(spaceship.position.x / 4);
    camera.position.setY(spaceship.position.y / 4);
    camera.lookAt(new THREE.Vector3(0,0,-100));

    addTailRing();

}

function leapAnimate( frame ) {

    if(gameState == GameStateEnum.DEAD){
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

    var countBones = 0;
    var countArms = 0;

    armMeshes.forEach(function (item) {
        scene.remove(item)
    });
    boneMeshes.forEach(function (item) {
        scene.remove(item)
    });

    if(frame.hands[0]) {
        if(spaceship && frame.hands[0].fingers[0].bones[0]) {
            updateMesh(frame.hands[0].fingers[0].bones[0], spaceship);
        }
    }
    else {

    }

    renderer.render( scene, camera );
    stats.update();
}

function generateAsteroid(mesh) {
    var radius = Math.random() * 3 + 1;
    var geometry = new THREE.SphereGeometry( radius );
    var material = new THREE.MeshNormalMaterial();
    var sphere = new THREE.Mesh( geometry, material );

    // polar coordinates to determine the spawn area of the particles
    var r = Math.random()*20;
    var theta = Math.random()*Math.PI*2;

    // give it a random x and y position between -500 and 500
    sphere.position.setX(r * Math.cos(theta));
    sphere.position.setY(r * Math.sin(theta));
    sphere.position.setZ(-5000);
    scene.add(sphere);
    return sphere;
}

function detectCollisions(obj) {
    if(!spaceship.canCollide) {
        return;
    }
    var pos = obj.position.distanceTo(spaceship.position);
    if(pos < 50) {
        var compBox = new THREE.Box3().setFromObject(obj);
        var min = compBox.min;
        var max = compBox.max;
        var newBox = new THREE.Box3(new THREE.Vector3(min.x+1, min.y+1, min.z+1), new THREE.Vector3(max.x-1, max.y-1, max.z-1));
        if (newBox.isIntersectionBox(new THREE.Box3().setFromObject(spaceship))) {
            playerHit();
        }
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

function loadSpaceship(manager) {
    // instantiate a loader
    var loader = new THREE.OBJMTLLoader(manager);

    if(loadAssets) {
        // load an obj / mtl resource pair
        loader.load(
            // OBJ resource URL
            //'models/interceptor/alien_interceptor_flying.obj',
            //// MTL resource URL
            //'models/interceptor/alien_interceptor_flying.mtl',
            'models/stuntglyder/stunt_glyder.obj',
            'models/stuntglyder/stunt_glyder.mtl',
            // Function when both resources are loaded
            function ( object ) {
                object.position.set(0, 250, -1000);
                spaceship = object;
                spaceship.canCollide = true;
                scene.add( spaceship );
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