function initializeAsteroidGame() {
    var geometry	= new THREE.TorusGeometry( 1, 0.42 );
    var material	= new THREE.MeshNormalMaterial();
    var mesh	= new THREE.Mesh( geometry, material );
    mesh.position.set(0, 250, -250);
    scene.add( mesh );
    camera.lookAt(mesh.position);
    mesh.visible = false;

    camera.rotation.z = 0;

    var manager = new THREE.LoadingManager();
    manager.onProgress = function ( item, loaded, total ) {

        console.log( item, loaded, total );

    };

    loadSpaceship(manager);

    for(var i = 0; i < 3; i++) {
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

    mesh.position.fromArray( bone.center() );
    mesh.setRotationFromMatrix( ( new THREE.Matrix4 ).fromArray( bone.matrix() ) );
    mesh.quaternion.multiply( baseBoneRotation );
    mesh.scale.set( .15, .15, .15 );

    scene.add( mesh );

}

function leapAnimate( frame ) {

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
    var geometry = new THREE.SphereGeometry( Math.random() * 100 );
    var material = new THREE.MeshNormalMaterial();
    mesh = new THREE.Mesh( geometry, material );

    mesh.position.set(Math.random() * 1500 - 750, Math.random() * 1500 - 750, -5000);
    scene.add(mesh);
    return mesh;
}

function loadSpaceship(manager) {
    // instantiate a loader
    var loader = new THREE.OBJMTLLoader(manager);

    // load an obj / mtl resource pair
    loader.load(
        // OBJ resource URL
        'models/interceptor/alien_interceptor_flying.obj',
        // MTL resource URL
        'models/interceptor/alien_interceptor_flying.mtl',
        // Function when both resources are loaded
        function ( object ) {
            object.position.set(0, 250, -1000);
            scene.add( object );
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
}