// import {
//     Scene,
//     PerspectiveCamera,
//     OrthographicCamera,
//     WebGLRenderer,
//     DirectionalLight,
//     AmbientLight,
//     BoxGeometry,
//     PlaneGeometry,
//     MeshBasicMaterial,
//     MeshStandardMaterial,
//     TextureLoader,
//     Mesh,
//     Vector3,
//     Vector2,
//     Euler,
//     Group,
//     Raycaster,
//     Color,
//     VideoTexture,
//     LinearFilter,
//     RGBFormat
// } from 'three';

import * as THREE from 'three';

import { OBJLoader } from 'three-obj-mtl-loader';

let scene,
    renderer,
    directionalLight,
    camera,
    camFactor = 150,
    boombox,
    cassette,
    holder,
    ground,
    lastTime = 0,
    lerpRate = 4;

const init = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xff7411 );
    
    const cam_width = window.innerWidth / camFactor;
    const cam_height = window.innerHeight / camFactor;
    camera = new THREE.OrthographicCamera( -cam_width, cam_width, cam_height, -cam_height, 0.001, 1000 );
    camera.position.set(25, 20, 30);
    camera.lookAt(new THREE.Vector3(0, 1.5, 0,));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.BasicShadowMap;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    const ground_geometry = new THREE.PlaneGeometry( 10, 10, 10 );
    // const ground_material = new THREE.ShadowMaterial();
    const ground_material = new THREE.MeshStandardMaterial( { emissive: 0xff0000, roughness: 0.8, metalness: 0.0 } );
    ground_material.opacity = 1.0;
    ground = new THREE.Mesh( ground_geometry, ground_material );
    ground.receiveShadow = true;
    // scene.add( ground );
    ground.rotation.set(-Math.PI/2, 0, 0);

    directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    directionalLight.position.set( 5, 5, 5 );
    directionalLight.lookAt( new THREE.Vector3(0, 0, 0) );
    scene.add( directionalLight );

    loadObjects();
}

const loadObjects = () => {
    const objLoader = new OBJLoader();

    new THREE.TextureLoader().load("./model/boombox.png", (tex) => {
        const material = new THREE.MeshStandardMaterial( { emissive: 0x443f3a, map: tex, roughness: 0.8, metalness: 0.0 } );

        // Load boombox
        objLoader.load('./model/boombox.obj', (boomboxObject) => {
            boombox = boomboxObject;
            boombox.children.forEach((child) => {
                child.material = material;
            });
            // boombox.castShadow = true;
            scene.add(boombox);
            // console.log(boombox);

            // Boombox outline
            const boomboxOutline = boombox.children[0].clone();
            // boomboxOutline.castShadow = true;
            boombox.add(boomboxOutline);
            boomboxOutline.material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
            boomboxOutline.scale.setScalar(1.008);

            holder = boombox.children[1];
            holder.status = false;
            boombox.children[1].position.set(0, 0.55, 0.6);
            // boombox.children[1].rotation.set(Math.PI/6, 0, 0);

            handleLoader();
        });

        // Load cassette
        objLoader.load('./model/cassette.obj', (cassetteObject) => {
            cassette = cassetteObject;
            cassette.children.forEach((child) => {
                child.material = material;
            });
            scene.add(cassette);
            // console.log(cassette);

            const cassetteOutline = cassette.children[0].clone();
            cassette.add(cassetteOutline);
            cassetteOutline.material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.BackSide } );
            cassetteOutline.scale.setScalar(1.07);

            cassette.velocity = new THREE.Vector3(0, 0, 0);
            cassette.gravity = new THREE.Vector3(0, -0.05, 0);
            cassette.visible = false;
            cassette.scale.setScalar(1.2);

            handleLoader();
        });
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
    
    // Update cassette
    cassette.velocity.y += (cassette.gravity.y / (deltaTime+1));
    cassette.position.add(cassette.velocity);

    // cassette.position.add(new THREE.Vector3(cassette.velocity.x, cassette.position.y + cassette.velocity.y, cassette.velocity.z));

    // if(cassette.position.distanceTo(holder.position) < 0.01) {
    //     cassette.velocity.setScalar(0)
    //     cassette.gravity.setScalar(0);

    //     console.log("SNAP CASSETTE");
    // }

    renderer.render(scene, camera);
};

function launchCassette() {
    cassette.velocity.set(
        (Math.random()-0.5)*0.1, // -0.05 to 0.05 
        0.1, // 0.1
        (Math.random()-0.5)*0.1// -0.05 to 0.05
    );
}

function openBoombox(deltaTime) {
    boombox.rotation.x = boombox.rotation.x + (lerpRate/deltaTime)*(-Math.PI/8 - boombox.rotation.x);
    holder.rotation.x = holder.rotation.x + (lerpRate/deltaTime)*(Math.PI/6 - holder.rotation.x);
}

function closeBoombox(deltaTime) {
    boombox.rotation.x = boombox.rotation.x + (lerpRate/deltaTime)*(-boombox.rotation.x);
    holder.rotation.x = holder.rotation.x + (lerpRate/deltaTime)*(-holder.rotation.x);
}

function setHolderStatus(status) {
    holder.status = status;
}

function spawnCassette() {
    cassette.visible = true;
    cassette.position.set(0, 10, 0.5);
    cassette.velocity.set(0, -0.1, 0);
}

function despawnCassette() {
    launchCassette();
}

// window.addEventListener('mousemove', event => {});

window.addEventListener('mousedown', () => {
    // boombox.rotation.x = -Math.PI/8;
    // holder.rotation.x = Math.PI/6;

    spawnCassette();
    setHolderStatus(true);
});

window.addEventListener('mouseup', () => {
    // boombox.rotation.x = 0;
    // holder.rotation.x = 0;

    despawnCassette();
    setHolderStatus(false);
});

function handleLoader() {
    if(cassette.velocity && boombox) {
        console.log("READY");
        requestAnimationFrame( animate );
    } else {
        console.log("NOT READY");
    }
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