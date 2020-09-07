// Three.js - Load .OBJ ?
// from https://threejsfundamentals.org/threejs/threejs-load-obj-no-materials.html

import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from '../threejs/examples/jsm/loaders/OBJLoader2.js';


const SAMPLE_JOINT_LOCATIONS = [
    [-0.3030651, -0.0789613, -0.2744476],
    [-0.30377717, -0.072937, -0.28056133],
    [0.30450148, -0.06736086, -0.27266805],
    [0.30791167, -0.0381285, -0.2683055],
    [0.30647807, -0.0906755, 0.3419955],
    [-0.30262428, -0.09324889, 0.3422875],
    [0.29374217, -0.040872, -0.24247183],
    [-0.3000119, -0.0607598, -0.2583307],
    [0.29917322, 0.92502611, -0.25896733],
    [0.30873829, 0.86773271, -0.25061214],
    [0.30782585, 0.80613995, -0.22947905],
    [0.30764372, 0.74597067, -0.21616383],
    [0.30982961, 0.68547178, -0.20661294],
    [0.30757024, 0.62047247, -0.20094135],
    [0.30655305, 0.55917005, -0.1947365],
    [0.3125742, 0.49845487, -0.19103407],
    [-0.30814722, 0.92304783, -0.26221333],
    [-0.29638911, 0.87096278, -0.247115],
    [-0.296074, 0.80737791, -0.22722436],
    [-0.29789663, 0.74260338, -0.22107462],
    [-0.2959845, 0.68400738, -0.2087295],
    [-0.2949456, 0.6201756, -0.1983724],
    [-0.30039192, 0.559004, -0.19301308],
    [-0.2944785, 0.49684488, -0.19092563]
]


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
    // const planeSize = 5;

    // const loader = new THREE.TextureLoader();
    // const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.magFilter = THREE.NearestFilter;
    // const repeats = planeSize / 2;
    // texture.repeat.set(repeats, repeats);

    // const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    // const planeMat = new THREE.MeshPhongMaterial({
    //     map: texture,
    //     side: THREE.DoubleSide,
    // });
    // const mesh = new THREE.Mesh(planeGeo, planeMat);
    // mesh.position.set(0, -0.5, 0)
    // mesh.rotation.x = Math.PI * -.5;
    // scene.add(mesh);
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
                mesh.rotation.y = 4.71;
                const scaleFactor = 2.25;
                mesh.scale.x = scaleFactor;    // 60 / (2 * radius 10 ) -> 3
                mesh.scale.y = scaleFactor;    //  4 / (2 * radius 10 ) -> 0.2
                mesh.scale.z = scaleFactor;
                scene.add(mesh);

                const wireframeGeometry = new THREE.WireframeGeometry(geometry);
                const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x0A0Aff });
                const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                wireframe.rotation.y = 4.71;
                wireframe.scale.x = scaleFactor;    // 60 / (2 * radius 10 ) -> 3
                wireframe.scale.y = scaleFactor;    //  4 / (2 * radius 10 ) -> 0.2
                wireframe.scale.z = scaleFactor;
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

// joint candidates rendering
{
    for (let location in SAMPLE_JOINT_LOCATIONS) {
        // console.log(SAMPLE_JOINT_LOCATIONS[location]);
        var geometry = new THREE.SphereGeometry(0.02, 10, 10, 0, Math.PI * 2, 0, Math.PI * 2);
        var material = new THREE.MeshNormalMaterial();
        var cube = new THREE.Mesh(geometry, material);
        cube.position.set(...SAMPLE_JOINT_LOCATIONS[location]);
        
        scene.add(cube);
    }
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