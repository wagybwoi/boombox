import * as THREE from 'three';
import { OBJLoader } from 'three-obj-mtl-loader';

let scene,
    renderer,
    directionalLight,
    camera,
    camFactor = 250,
    boombox,
    cassette,
    holder,
    lastTime = 0,
    lerpRate = 0.01,
    cassettes = [],
    listener = new THREE.AudioListener(),
    sound = new THREE.Audio( listener ),
    tracks = [],
    currentTrack = 0,
    timesSpawned = 0,
    loader = ["cassete", "boombox", "audio1", "audio2", "audio3"];

const init = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xff7411 );
    
    const cam_width = window.innerWidth / camFactor;
    const cam_height = window.innerHeight / camFactor;
    camera = new THREE.OrthographicCamera( -cam_width, cam_width, cam_height, -cam_height, 0.001, 1000 );
    camera.position.set(25, 20, 30);
    camera.lookAt(new THREE.Vector3(0, 1.5, 0,));
    camera.add( listener );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    directionalLight = new THREE.DirectionalLight( 0xffefe0, 1.8 );
    directionalLight.position.set( 30, 35, 50 );
    directionalLight.lookAt( new THREE.Vector3(0, 0, 0) );
    scene.add( directionalLight );

    sound.setLoop( true );
    sound.setVolume( 0.5 );

    loadAssets();
}

const loadAssets = () => {
    const objLoader = new OBJLoader();

    new THREE.TextureLoader().load("./model/boombox.png", (tex) => {
        const material = new THREE.MeshStandardMaterial( { map: tex, roughness: 1.0, metalness: 0.2 } );

        // Load boombox
        objLoader.load('./model/boombox.obj', (boomboxObject) => {
            boombox = boomboxObject;
            boombox.children.forEach((child) => {
                child.material = material;
            });
            scene.add(boombox);

            // Boombox outline
            const boomboxOutline = boombox.children[0].clone();
            boombox.add(boomboxOutline);
            boomboxOutline.material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
            boomboxOutline.scale.setScalar(1.008);
            boomboxOutline.position.set(0, 0, -0.01);

            holder = boombox.children[1];
            holder.status = false;
            holder.position.set(0, 0.55, 0.6);
            holder.loaded = null;

            updateLoader("boombox");
        });

        // Load cassette
        objLoader.load('./model/cassette.obj', (cassetteObject) => {
            cassette = cassetteObject;
            cassette.children.forEach((child) => {
                child.material = material;
            });
            cassette.scale.setScalar(1.2);

            const cassetteOutline = cassette.children[0].clone();
            cassette.add(cassetteOutline);
            cassetteOutline.material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
            cassetteOutline.scale.setScalar(1.07);

            updateLoader("cassette");
        });
    });

    // load a sound and set it as the Audio object's buffer
    new THREE.AudioLoader().load( 'audio/lildab.mp3', function( buffer ) {
        tracks[0] = buffer;
        updateLoader("audio1");
    });

    new THREE.AudioLoader().load( 'audio/numbaone.mp3', function( buffer ) {
        tracks[1] = buffer;
        updateLoader("audio2");
    });

    new THREE.AudioLoader().load( 'audio/shalmuta.mp3', function( buffer ) {
        tracks[2] = buffer;
        updateLoader("audio3");
    });
}

const animate = function (time) {
    requestAnimationFrame( animate );

    // Update time
    const deltaTime = time - lastTime;
    lastTime = time;

    // Animate holder/boombox
    if(holder.status) {
        openBoombox(deltaTime);
    } else {
        closeBoombox(deltaTime);
    }
    
    // Update cassettes
    cassettes.forEach(eachCassette => {
        if(eachCassette.position.distanceTo(holder.position) < 0.5 && !eachCassette.used && holder.loaded == null) {
            loadCassette(eachCassette);
            return;
        }
        eachCassette.velocity.y += (eachCassette.gravity.y * deltaTime);
        eachCassette.position.add(eachCassette.velocity.clone().multiplyScalar(deltaTime));
        eachCassette.rotation.x += (eachCassette.rotationalVelocity.x)*deltaTime;

        if (eachCassette.position.y < -10) {
            cassettes.splice(cassettes.indexOf(eachCassette), 1);
            scene.remove(eachCassette);
        }
    });

    if(holder.loaded) {
        boombox.scale.lerp(new THREE.Vector3(1 + Math.sin(time/120+1)/10, 1 + Math.sin(time/120)/10, 1), 0.2);
        // console.log(boombox.scale);
    }

    renderer.render(scene, camera);
};

function launchCassette(c) {
    boombox.scale.setScalar(1);
    sound.stop();

    c.velocity.set(
        0,
        0.02 + Math.random()*0.003,
        0.01
    );

    c.rotationalVelocity.set(
        Math.random()*0.01,
        0,
        0
    );
}

function loadCassette(c) {
    document.getElementById("container").classList.add("pointy");
    c.used = true;
    holder.loaded = c;
    holder.add(c);
    c.position.set(0, 0.37, -0.1);
    cassettes.splice(cassettes.indexOf(c), 1);
    setHolderStatus(false);
    
    // play audio
    currentTrack = currentTrack+1 == tracks.length ? 0 : currentTrack+1;
    sound.setBuffer( tracks[currentTrack] );
    sound.play();
}

function openBoombox(deltaTime) {
    boombox.rotation.x = THREE.Math.lerp(boombox.rotation.x, -Math.PI/8, lerpRate*deltaTime);
    holder.rotation.x = THREE.Math.lerp(holder.rotation.x, Math.PI/6, lerpRate*deltaTime);
}

function closeBoombox(deltaTime) {
    boombox.rotation.x = THREE.Math.lerp(boombox.rotation.x, 0, lerpRate*deltaTime);
    holder.rotation.x = THREE.Math.lerp(holder.rotation.x, 0, lerpRate*deltaTime);
}

function setHolderStatus(status) {
    holder.status = status;
}

function spawnCassette() {
    document.getElementById("container").classList.remove("pointy");
    const newCassette = cassette.clone();
    newCassette.position.set(0, 10, 0.3);
    newCassette.gravity = new THREE.Vector3(0, -0.00003, 0);
    newCassette.velocity = new THREE.Vector3(0, 0, 0);
    newCassette.rotationalVelocity = new THREE.Euler(0, 0, 0);
    
    cassettes.push(newCassette);
    scene.add(newCassette);

    timesSpawned++;
}

// window.addEventListener('mousemove', event => {});

window.addEventListener('mousedown', () => {
    if(holder.loaded != null) {
        scene.add(holder.loaded);
        cassettes.push(holder.loaded);
        launchCassette(holder.loaded);
        holder.loaded = null;
        spawnCassette();
        setHolderStatus(true);
        return;
    }

    if(!timesSpawned) {
        spawnCassette();
        setHolderStatus(true);
    }
});

function updateLoader(loadedElement) {
    loader.splice(loader.indexOf(loadedElement), 1);
    if (!loader.length) {
        requestAnimationFrame( animate );
    };
}

window.addEventListener('resize', () => {
	if(camera && renderer) {
        renderer.setSize( window.innerWidth, window.innerHeight );
        camera.left = -window.innerWidth / camFactor;
        camera.right = window.innerWidth / camFactor;
        camera.top = window.innerHeight / camFactor;
        camera.bottom = -window.innerHeight / camFactor;
        camera.updateProjectionMatrix();
	}
});

init();