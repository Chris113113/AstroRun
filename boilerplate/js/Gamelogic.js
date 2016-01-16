

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


function addMesh( meshes ) {

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh( geometry, material );
    meshes.push( mesh );

    return mesh;

}

function updateMesh( bone, mesh ) {
    var centerBone = bone.center();
    // normalize the bone about the center axis

    var posX = centerBone[0];
    var posY = centerBone[1]-250;
    var posZ = Math.min(-25, Math.max(centerBone[2] - 250.0, -100.0));

    var r = Math.sqrt(posX*posX + posY*posY);
    var theta = Math.atan(posY/posX);


    if(r <= TUNNEL_RADIUS + 10) {
        mesh.position.set(posX, posY, posZ);
    }
    else {
        r = TUNNEL_RADIUS;
        if(posX > 0) {
            mesh.position.x = r * Math.cos(theta);
            mesh.position.y = r * Math.sin(theta);
        }
        else {
            mesh.position.x = -r * Math.cos(theta);
            mesh.position.y = -r * Math.sin(theta);
        }
        mesh.position.z = posZ;
    }
    //mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( bone.matrix() ) );
    //mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( [-Math.PI/2,-Math.PI/2,Math.PI/2,'XYZ'] ) );
    mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( [Math.PI,Math.PI*11/6,0,'XYZ'] ) );
    mesh.quaternion.multiply( baseBoneRotation );
    mesh.scale.set( .025, .025, .025 );

    camera.position.setX(mesh.position.x / 4);
    camera.position.setY(mesh.position.y / 4);
    camera.lookAt(new THREE.Vector3(0,0,-100));

    scene.add( mesh );
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

var helper;

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