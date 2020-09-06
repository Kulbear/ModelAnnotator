// Three.js - Load .OBJ ?
// from https://threejsfundamentals.org/threejs/threejs-load-obj-no-materials.html

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/OBJLoader2.js';


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas });

// camera settings
const fov = 45;
const aspect = 1;  // the canvas default
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(1, 0.5, 1);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');

{
    const planeSize = 5;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.position.set(0, -0.5, 0)
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
}

{
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
}

{
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target);
}

{
    const objLoader = new OBJLoader2();
    objLoader.load('models/286/objs/bbadf45aa419015c7e4d369f13ed434e.obj', (root) => {

        root.traverse(function (child) {

            if (child instanceof THREE.Mesh) {


                let geometry = child.geometry;
                let material = child.material;
                let mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                const wireframeGeometry = new THREE.WireframeGeometry(geometry);
                const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x0A0Aff });
                const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                scene.add(wireframe);

                // controls on mesh and wireframe
                document.getElementById("toggleShow").addEventListener("click", function () {
                    mesh.visible = !mesh.visible;
                });
                document.getElementById("toggleWF").addEventListener("click", function () {
                    wireframe.visible = !wireframe.visible;
                });

            }

        });

    });
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function render() {

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);