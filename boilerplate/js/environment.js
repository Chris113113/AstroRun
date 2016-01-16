function updateTunnel() {
    tunnelSegments.forEach(function (item) {
        item[0].position.z += 0.30;

        if(item[0].position.z >= 0.0) {
            item[0].position.z = TUNNEL_BACK;
        }
    });
}

function updateParticles() {
    particles.forEach(function (item) {
        item.position.z += 3.00;

        if(item.position.z >= 0.0) {
            item.position.z = TUNNEL_BACK-800.0;
        }
    });
}

// creates a random field of Particle objects
// http://creativejs.com/tutorials/three-js-part-1-make-a-star-field/
function makeParticles() {
    // we're gonna move from z position -1000 (far away)
    // to 1000 (where the camera is) and add a random particle at every pos.
    var geometry   = new THREE.SphereGeometry(0.5, 32, 32);
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    material.fog = false;
    for ( var count = 0; count < 2500; count += 1 ) {
        var sphere = new THREE.Mesh(geometry, material);

        // polar coordinates to determine the spawn area of the particles
        var r = Math.random()*1500 + TUNNEL_RADIUS*10;
        var theta = Math.random()*Math.PI*2;


        // give it a random x and y position between -500 and 500
        sphere.position.x = r * Math.cos(theta);
        sphere.position.y = r * Math.sin(theta);

        // set its z position
        sphere.position.z = Math.random()*(TUNNEL_BACK-800.0);

        // scale it up a bit
        //sphere.scale.x = sphere.scale.y = 10;

        // add it to the scene
        scene.add( sphere );

        // and to the array of particles.
        particles.push(sphere);
    }

}

function makeTunnel() {
    // draw the tunnel
    var material	= new THREE.MeshNormalMaterial();
    var radius = TUNNEL_RADIUS;
    var segments = 24;

    var count = 0;
    for(var step = 0.0; step > TUNNEL_BACK; step -= TUNNEL_SEGMENT_STEP) {
        var circleGeometry = new THREE.CircleGeometry(radius, segments);
        var circle = new THREE.Mesh(circleGeometry, material);

        //circle.position.z = step;
        circle.visible = false;
        edgesCircle = new THREE.EdgesHelper(circle, 0x0000ff);
        circle.position.z = step;

        scene.add(circle);
        scene.add(edgesCircle);

        tunnelSegments.push([circle, edgesCircle]);
        count++;
    }

    geometry = new THREE.CylinderGeometry( radius, radius, Math.abs(TUNNEL_BACK), segments, 1, true, 0, 6.3);
    material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    object = new THREE.Mesh( geometry, material );
    object.rotation.x = Math.PI/2.0;
    object.position.z = TUNNEL_BACK/2.0;
    // hide the actual object as we dont care to display it. only the edges
    object.visible = false;

    edges = new THREE.EdgesHelper( object, 0x0000ff);

    // we must display the object in order to actual have the rotation apply
    scene.add( object );
    scene.add( edges );
}
