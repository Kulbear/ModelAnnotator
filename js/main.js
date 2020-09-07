import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from '../threejs/examples/jsm/loaders/OBJLoader2.js';


// You all-in-one fake state manager
const globalState = {
    scaleFactor: 2.25, // for unknown reason either the scale of the object or the joints are not correct, hard-coded workaround only
    lightIntensity: 1,
    cameraSettings: [45, 1, 0.1, 100],  // FoV, aspect, near, far,

    // joints
    jointSephereConfig: [0.02, 10, 10, 0, Math.PI * 2, 0, Math.PI * 2],
    renderedJoints: [],
    renderedObject: null,
    renderedWireframe: null,
    scene: null
}

const CONSTANT = {
    degree270: 4.71
}

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

function setupScene() {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const lightHemi = new THREE.HemisphereLight(skyColor, groundColor, globalState.lightIntensity);
    scene.add(lightHemi);

    const color = 0xFFFFFF;
    const directionalLight = new THREE.DirectionalLight(color, globalState.lightIntensity);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
    // scene.add(directionalLight.target);
}

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas });

const camera = new THREE.PerspectiveCamera(...globalState.cameraSettings);
camera.position.set(1, 0.5, 3);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
// controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');
globalState.scene = scene;

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

const scaleUpBy = (obj, scaleFactor) => {
    obj.scale.x = scaleFactor;
    obj.scale.y = scaleFactor;
    obj.scale.z = scaleFactor;
}

function setToggleObjectById(elementDOMId, object) {
    document.getElementById(elementDOMId).addEventListener("click", () => {
        object.visible = !object.visible;
    });
}

function setToggleObjectsById(elementDOMId, objects) {
    document.getElementById(elementDOMId).addEventListener("click", () => {
        for (let idx in objects) {
            objects[idx].visible = !objects[idx].visible;
        }
    });
}

// adaptive resize canvas display and rendering
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


// joint candidates rendering
function renderJointCandidates() {
    for (let location in SAMPLE_JOINT_LOCATIONS) {
        const jointBall = new THREE.Mesh(
            new THREE.SphereGeometry(...globalState.jointSephereConfig),
            new THREE.MeshNormalMaterial()
        );
        // TODO: load from local fsys
        jointBall.position.set(...SAMPLE_JOINT_LOCATIONS[location]);
        scene.add(jointBall);

        // for later control purpose, order not matters
        globalState.renderedJoints.push(jointBall);
    }

    setToggleObjectsById("toggleJoints", globalState.renderedJoints);
}

function renderedWireframe(objectGeometry) {
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(objectGeometry), 
        new THREE.LineBasicMaterial({ color: 0x0A0Aff })
    );
    wireframe.rotation.y = CONSTANT.degree270;
    scaleUpBy(wireframe, globalState.scaleFactor);
    globalState.scene.add(wireframe);
    globalState.renderedWireframe = wireframe;

    setToggleObjectById("toggleWireframe", globalState.renderedWireframe);
}


function renderObject(object) {
    object.traverse(function (child) {
        if (child instanceof THREE.Mesh) { // in case there are multiple components in the object
            // render object
            let mesh = new THREE.Mesh(child.geometry, child.material);
            mesh.rotation.y = CONSTANT.degree270;
            scaleUpBy(mesh, globalState.scaleFactor);
            globalState.renderedObject = mesh;
            globalState.scene.add(mesh);
            renderedWireframe(child.geometry);
            setToggleObjectById("toggleShow", globalState.renderedObject);
        }
    });
}

function loadAndRenderObject() {
    const objLoader = new OBJLoader2();
    // TODO: load from local fsys
    objLoader.load('models/286/objs/source.obj', (root) => {
        renderObject(root);
    });
    renderJointCandidates();
}


setupScene();
loadAndRenderObject();
requestAnimationFrame(render);

// for debugging
window.globalState = globalState;