/*
	Marco Magnani 1532000
	Interactive graphics 2018/2019
*/

/*global THREE*/
/*global Stats*/


window.addEventListener('load', init, false);

/* Setting Variable */
var canvas_width;		// Canvas's width
var canvas_height;		// Canvas's height
var camera;				// Camera
var scene;				// Scena
var renderer;			// Render
var dom;				// Dom page
var clock;
var stats;


/* Variable for object */
var sun;
var orbitControl;
var airplane;

/* Bullet's variable */
var bullet_radius = 0.3;	// Bullet radius
var bulletsBad;				// The list of bullet bad against user

/* Earth's variable*/
var rollingEarth;
var earthlHelper;
var rollingSpeed 	= 0.007;	// Rolling speed
var worldRadius 	= 26;		// World radius

/* Track's variable */
var left_track		=	-1;
var right_track		=	1;
var center_track	=	0;
var current_track;

var pathAngleValues;
var treeReleaseInterval	=	0.5;	// Time to release a tree
var bulletInPath;
var youLose;

// Stats variable
var stats;
var scoreText;
var score;

// Sound variables
var sound_background;
var sound_explosion;

// The init function
function init() {
	// set the scene
	createScene();
	//call game
	update();
}

function createScene(){
	// Init variable
	score 		= 	0;
	youLose	=	false;
	bulletInPath	=	[];
	bulletsBad	=	[];
	clock 		=	new THREE.Clock();
	clock.start();
	earthlHelper = new THREE.Spherical();
	pathAngleValues	= [1.52,1.57,1.62];
    
    // Set the canvas size
    canvas_width 	= document.getElementById('canvas').offsetWidth;
    canvas_height 	= document.getElementById('canvas').offsetHeight;

    // Set the scene
    scene 		= new THREE.Scene();//the 3d scene
    scene.fog 	= new THREE.FogExp2( 0xf0fff0, 0.14 );

    // Set the texture for the sky
    var texture_sky 	= new THREE.TextureLoader().load('img/cielo.jpg');
	scene.background 	= texture_sky;

    camera = new THREE.PerspectiveCamera( 80, canvas_width / canvas_height, 0.1, 1000 );//perspective camera

    // Set the audio
    setAudio();

    // Set up of render
    renderer = new THREE.WebGLRenderer({alpha:true});//renderer with transparent backdrop
    renderer.setClearColor(0xfffafa, 1); 
    renderer.shadowMap.enabled 	= true;//enable shadow
    renderer.shadowMap.type 	= THREE.PCFSoftShadowMap;
    renderer.setSize( canvas_width, canvas_height );

    dom = document.getElementById('canvas');
	dom.appendChild(renderer.domElement);

	stats = new Stats();
	dom.appendChild(stats.dom);

	// Call the function
	createBulletBad();
	createWorld();
	createPlane();
	createLight();
	

	//Set properties for camera and orbitControl
	camera.position.z = 6.5;
	camera.position.y = 3.5;
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );//helper to rotate around in scene
	orbitControl.addEventListener( 'change', render );
	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableZoom = false;
	orbitControl.minPolarAngle = 1.1;
	orbitControl.maxPolarAngle = 1.1;
	orbitControl.minAzimuthAngle = -0.2;
	orbitControl.maxAzimuthAngle = 0.2;
	
	// Set up the event for window resize function
	window.addEventListener('resize', onWindowResize, false);//resize callback

	// Set up the function of onkeydown event
	document.onkeydown = handleKeyDown;

	// Set up of the data(score and mode) on the screen
	setDataVideo();
}

// Function is used from the user to move the airplane.
function handleKeyDown(keyEvent){
	var validMove = true;		// I use this variable to check if the moving is valid.
	// If the user presses on left arrow of keyboard the airplane will move on the left side if the moving is valid.
	if ( keyEvent.keyCode === 37) { 		//left moving
		if(current_track == center_track){	// I check if I am on the center track.
			current_track 					= left_track;
			airplane.leftFlap.rotation.x 	= 10;	// Move the flap
			airplane.rightFlap.rotation.x 	= -10;
		}else if(current_track == right_track){	// I check if I am on the right track
			current_track 					= center_track;
			airplane.leftFlap.rotation.x 	= 0;
			airplane.rightFlap.rotation.x 	= 0;
		}else{									// Otherwise I am on the left side, bad move
			validMove = false;	
		}
	} else if ( keyEvent.keyCode === 39) { //right moving
		if(current_track == center_track){	// I check if I am on the center track.
			current_track 					= right_track;
			airplane.leftFlap.rotation.x 	= -10;	// Move the flap
			airplane.rightFlap.rotation.x 	= +10;
		}else if(current_track == left_track){	// I check if I am on the left track
			current_track 					= center_track;
			airplane.leftFlap.rotation.x 	= 0;	// Move the flap
			airplane.rightFlap.rotation.x 	= 0;
		}else{								// Otherwise I am on the right side, bad move
			validMove = false;	
		}
	}
	airplane.mesh.position.x = current_track;
}

// This is heart of airplane model. In this variable I have all hierarchy model of the aereo.
var AirPlane = function() {
	
	// I create the mesh object 3D
	this.mesh = new THREE.Object3D();

	/*For each parts I define the geometry, material, position and shadow*/ 

	// Create the pilot
	var geometryPilot 	= new THREE.BoxGeometry(0.5,0.2,0.5,1,1,1);
	var materialPilot 	= new THREE.MeshPhongMaterial({color:'white', shading:THREE.FlatShading});
	var pilot 			= new THREE.Mesh(geometryPilot, materialPilot);
	pilot.position.set(0,0.6,0);
	pilot.castShadow 		= true;
	pilot.receiveShadow 	= true;
	this.mesh.add(pilot);
	
	// Create the cabin
	var geometryCockpit = new THREE.BoxGeometry(1,1,1.5,1,1,1);
	var materialCockpit = new THREE.MeshPhongMaterial({color:'green', shading:THREE.FlatShading});
	var cockpit = new THREE.Mesh(geometryCockpit, materialCockpit);
	cockpit.position.set(0,0,0);
	cockpit.castShadow 		= true;
	cockpit.receiveShadow 	= true;
	this.mesh.add(cockpit);
	
	// Create the engine
	var geometryEngine = new THREE.BoxGeometry(1,1,1,1,1,1);
	var materialEngine = new THREE.MeshPhongMaterial({color:'black', shading:THREE.FlatShading});
	var engine = new THREE.Mesh(geometryEngine, materialEngine);
	engine.position.set(0,0,-1);
	engine.castShadow = true;
	engine.receiveShadow = true;
	this.mesh.add(engine);

	// Create the left-flap
	var geometryLeftFlap = new THREE.BoxGeometry(2,0.1,0.2,1,1,1);
	var materialLeftFlap = new THREE.MeshPhongMaterial({color:'white', shading:THREE.FlatShading});
	this.leftFlap = new THREE.Mesh(geometryLeftFlap, materialLeftFlap);
	this.leftFlap.position.set(-1.5,0.1,0.5);
	this.leftFlap.castShadow = true;
	this.leftFlap.receiveShadow = true;
	this.mesh.add(this.leftFlap);

	// Create the right-flap
	var geometryRightFlap = new THREE.BoxGeometry(2,0.1,0.2,1,1,1);
	var materialRightflap = new THREE.MeshPhongMaterial({color:'white', shading:THREE.FlatShading});
	this.rightFlap = new THREE.Mesh(geometryRightFlap, materialRightflap);
	this.rightFlap.position.set(1.5,0.1,0.5);
	this.rightFlap.castShadow = true;
	this.rightFlap.receiveShadow = true;
	this.mesh.add(this.rightFlap);

	// Create the tail
	var geometryTailPlane = new THREE.BoxGeometry(0.7,0.3,1,1,1,1);
	var materialTailPlane = new THREE.MeshPhongMaterial({color:'yellow', shading:THREE.FlatShading});
	var tailPlane = new THREE.Mesh(geometryTailPlane, materialTailPlane);
	tailPlane.position.set(0,0,1);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	this.mesh.add(tailPlane);

	// Create the tail-2
	var geometryTailPlane_2 = new THREE.BoxGeometry(2,0.3,0.5,1,1,1);
	var materialTailPlane_2 = new THREE.MeshPhongMaterial({color:'orange', shading:THREE.FlatShading});
	var tailPlane_2 = new THREE.Mesh(geometryTailPlane_2, materialTailPlane_2);
	tailPlane_2.position.set(0,0,1.7);
	tailPlane_2.castShadow = true;
	tailPlane_2.receiveShadow = true;
	this.mesh.add(tailPlane_2);
	
	// Create the wing
	var geometrySideWing = new THREE.BoxGeometry(5,0.25,1,1,1,1);
	var materialSideWing = new THREE.MeshPhongMaterial({color:'red', shading:THREE.FlatShading});
	var sideWing = new THREE.Mesh(geometrySideWing, materialSideWing);
	sideWing.castShadow = true;
	sideWing.receiveShadow = true;
	this.mesh.add(sideWing);
	
	// propeller
	var geometryPropeller = new THREE.BoxGeometry(0.1,2,0.1,1,1,1);
	var materialPropeller = new THREE.MeshPhongMaterial({color:'brown', shading:THREE.FlatShading});
	this.propeller = new THREE.Mesh(geometryPropeller, materialPropeller);
	this.propeller.position.set(0,0,-1.9);
	this.propeller.castShadow = true;
	this.propeller.receiveShadow = true;
	this.mesh.add(this.propeller);
};

// This function create a model and to add the scene.
function createPlane(){ 
	// I create the airplane and set its positions
	airplane = new AirPlane();
	scene.add(airplane.mesh);
	airplane.mesh.scale.set(.25,.25,.25);
	// The start position of the airplane is the center track.
	airplane.mesh.position.y = 2.5;
	airplane.mesh.position.z = 4.8;
	current_track = center_track;
	airplane.mesh.position.x = center_track;
}

// This function is used to create the world
function createWorld(){
	var sides = 40;
	var tiers = 40;
	// Load a texture from one image.
	var texture = new THREE.TextureLoader().load('img/prato.png');

	// I make the Earth with geometry and material
	var earthGeometry 	= new THREE.SphereGeometry(worldRadius,sides,tiers);
	var earthMaterial 	= new THREE.MeshBasicMaterial({ 
														map: texture 
													 });
	rollingEarth = new THREE.Mesh( earthGeometry, earthMaterial );

	// I set the properties of the Earth
	rollingEarth.receiveShadow 		= true;
	rollingEarth.castShadow 		= false;
	rollingEarth.rotation.z 		= -Math.PI/2;

	// I add the Earth to scena.
	scene.add(rollingEarth);
	rollingEarth.position.y 		= -24;
	rollingEarth.position.z 		= 2;

	// I call the tree function.
	createSetTrees();
}

// This function is used to add and create the light for the world
function createLight(){
	// I make the light and I set the color.
	var earthLight = new THREE.HemisphereLight(0xfffafa,0x000000, .9)
	scene.add(earthLight);

	// I set a direction of the light.
	sun = new THREE.DirectionalLight( 0xcdc1c5, 0.9);
	sun.position.set(12,6,-7);
	sun.castShadow = true;
	scene.add(sun);

	//Set shadow properties for the sun light
	sun.shadow.mapSize.width 	= 256;
	sun.shadow.mapSize.height 	= 256;
	sun.shadow.camera.near 		= 0.5;
	sun.shadow.camera.far 		= 30 ;
}

// This function is use to create the red bullet model
function createBullet(){
	// To make the bullet I used a dodecahedron geometries. Here, I set the material,geometry and position. 
	var bulletGeometry = new THREE.DodecahedronGeometry( bullet_radius, 1);
	var bulletMaterial = new THREE.MeshPhongMaterial({ 
															color: 'red' ,shading:THREE.FlatShading
													    });
	var bulletTop 			= new THREE.Mesh( bulletGeometry, bulletMaterial );
	var bullet 				= new THREE.Object3D();
	bulletTop.position.y 	=	0.9;
	// Finally, I add the bullet
	bullet.add(bulletTop);
	return bullet;
}
// This function is used to create a number of bad bullet.
function createBulletBad(){
	var maxBullet = takeCookie();	// I take the value of bullet and that is the mode user chosen.
	var new_bullet;
	for(var i=0; i < maxBullet;i++){
		new_bullet = createBullet();
		bulletsBad.push(new_bullet);
	}
}

// This function is used to create to tree. This is hierarchic model: trunk and top
function createTree(){
	var sides = 8;
	var tiers = 6;
	// Set the cone geometry and the material
	var treeGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
	var treeMaterial = new THREE.MeshPhongMaterial({
														color: 0x33ff33,shading:THREE.FlatShading 
													  });
	var treeTop = new THREE.Mesh( treeGeometry, treeMaterial );
	// Set some properties: shadown and position
	treeTop.castShadow 		= true;
	treeTop.receiveShadow 	= false;
	treeTop.position.y 		= 0.9;
	treeTop.rotation.y 		= (Math.random()*(Math.PI));

	// Set the cylinder geometry and the material
	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
	var trunkMaterial = new THREE.MeshPhongMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, trunkMaterial );
	// Set some property position
	treeTrunk.position.y = 0.25;

	// I put together the the parts
	var tree =new THREE.Object3D();
	tree.add(treeTrunk);
	tree.add(treeTop);
	return tree;
}

// This function is used to create a set of tree. The maximum is 72.
function createSetTrees(){
	var numTrees = 72;
	var gap = 6.28/72;
	for(var i = 0; i < numTrees; i++){
		addObject(false,i*gap, true);
		addObject(false,i*gap, false);
	}
}

// This function is used to create a random path for tree outside the track-
function addTreeToWorld(){
	var options = [0,1,2];
	var line = Math.floor(Math.random()*3);
	addObject(true,line);
	options.splice(line,1);
	if(Math.random() > 0.5){
		line = Math.floor(Math.random()*2);
		addObject(true,options[line]);
	}
}

// This function is very important because add the bullet or trees to the world
function addObject(inPath, row, isLeft){
	var target_object;					//Tree if outside the path or bullet if inside the path
	if(inPath){
		if(bulletsBad.length==0 )
			return;
		target_object = bulletsBad.pop();
		target_object.visible = true;
		bulletInPath.push(target_object);	// Add the bullet
		earthlHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingEarth.rotation.x+4 );
	}else{
		target_object = createTree();		// Call the create tree
		var setTreeAngle = 0;
		if(isLeft){
			setTreeAngle = 1.68 + Math.random() * 0.1;
		}else{
			setTreeAngle = 1.46 - Math.random() * 0.1;
		}
		earthlHelper.set( worldRadius-0.3, setTreeAngle, row );
	}

	// Set the add during the roll
	target_object.position.setFromSpherical(earthlHelper);
	var rollingEarthVector 		= rollingEarth.position.clone().normalize();
	var target_object_vector 	= target_object.position.clone().normalize();
	target_object.quaternion.setFromUnitVectors(target_object_vector,rollingEarthVector);
	target_object.rotation.x 	+= (Math.random()*(2*Math.PI/10))+-Math.PI/10;
	rollingEarth.add(target_object);
}

// This function is used to set the logic bullet, that is when I hit or dodge a bullet
function bulletLogic(){
	var oneBullet;
	var bulletPos 		= new THREE.Vector3();
	var bulletsToRemove	= [];
	bulletInPath.forEach( function ( element, index ) {
		oneBullet = bulletInPath[index];
		bulletPos.setFromMatrixPosition(oneBullet.matrixWorld);
		if(bulletPos.z > 6 && oneBullet.visible){			//gone out of our view zone
			bulletsToRemove.push(oneBullet);
		}else{									//check collision
			if(bulletPos.distanceTo(airplane.mesh.position) <= 1.2){	// If I am here, I hit a bullet
				sound_background.stop();							// Stop the background audio
				sound_explosion.play();								// Lunch the explosion audio
				youLose = true;									
				// I ask to user if you play again
				var confirm_check = confirm("Game Over! Your score is "+score+". Click on OK for another match or Cancel for quit.");
				if (confirm_check == true) {		// Yes, I reset the game
					location.reload();
					cancelAnimationFrame( globalRenderID );
  					window.clearInterval( powerupSpawnIntervalID );
				} else {					/// Redirect him on another page.
				    window.location.href = "points.html";
				    cancelAnimationFrame( globalRenderID );
  					window.clearInterval( powerupSpawnIntervalID )
				}
			}
		}
	});
	// This code is responsible to remove the bullet when the player dodge them 
	// so they must remove from scena with visible=false
	var fromWhere;
	bulletsToRemove.forEach( function ( element, index ) {
		oneBullet = bulletsToRemove[ index ];
		fromWhere = bulletInPath.indexOf(oneBullet);
		bulletInPath.splice(fromWhere,1);
		bulletsBad.push(oneBullet);
		oneBullet.visible=false;
	});
}

// This function is used to update the canvas
function update(){
	// Update stat data from lib
	stats.update();

    //animate
    rollingEarth.rotation.x += rollingSpeed;	// update the roll
    airplane.propeller.rotation.z += 0.5;
    if(clock.getElapsedTime() > treeReleaseInterval){
    	clock.start();				// Start the clock for update
    	addTreeToWorld();			// add the tree to world
    	if(!youLose){			// If that say me if the user's point should increase or no.
			score += 2*treeReleaseInterval;
			scoreText.innerHTML = score.toString()+" your score.";
		}
    }
    bulletLogic();
    render();
	requestAnimationFrame(update); //request next update
}

// This function calls the rende.
function render(){
    renderer.render(scene, camera); 
}
// This function is responsible to set the auto resize the canvas dimension.
function onWindowResize() {
    canvas_width 	= document.getElementById('canvas').offsetWidth;
    canvas_height 	= document.getElementById('canvas').offsetHeight;
	renderer.setSize(canvas_width, canvas_height);
	camera.aspect = canvas_width/canvas_height;
	camera.updateProjectionMatrix();
}

// Function to set the audio
function setAudio(){
	// I create the 2 listener and i add them
	var listener 	= new THREE.AudioListener();
    var listener_2 	= new THREE.AudioListener();
	camera.add(listener);
	camera.add(listener_2);

	// I create the 2 sound and I link with listener
    sound_background 	= new THREE.Audio(listener);
    sound_explosion 			= new THREE.Audio(listener_2);

    // load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( 'sound/propeller.mp3', function( buffer ) {
		sound_background.setBuffer( buffer );
		sound_background.setLoop( true );
		sound_background.setVolume( 0.5 );
		sound_background.play();
	});
	audioLoader_explosion = new THREE.AudioLoader();
	audioLoader_explosion.load( 'sound/explosion.mp3', function( buffer ) {
		sound_explosion.setBuffer( buffer );
		sound_explosion.setVolume( 0.5 );				
	});
}

// Function is used to set the data on the screen for the user.
function setDataVideo(){
	// I take the div element
	scoreText 		= document.createElement('div');
	bulletBadText 	= document.createElement('div');

	// For both element set the init value, add the css style class and add to body.

	scoreText.innerHTML = "0";
	scoreText.classList.add("scoreText");
	document.body.appendChild(scoreText);

	bulletBadText.innerHTML = "Number of bad bullet: "+takeCookie();
	bulletBadText.classList.add("bulletBadText");
	document.body.appendChild(bulletBadText);
}

// Function is use to take value from cookie, that is the type of mode choosen from user.
function takeCookie(){
	// I take the name
	var name = "ModeIannaPlane=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
	  		c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {		// When I find my cookie, I return its value.
	  		return c.substring(name.length, c.length);
		}
	}
	// if i return here, the user did not choose the mode or he does not allow the cookie use
	// I set the easy mode the default
	return 10;
}