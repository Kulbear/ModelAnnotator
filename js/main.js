import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from '../threejs/examples/jsm/loaders/OBJLoader2.js';


// You all-in-one fake state manager
const globalState = {
    scaleFactor: 22.5, // for unknown reason either the scale of the object or the joints are not correct, hard-coded workaround only
    lightIntensity: 1,
    cameraSettings: [45, 1, 0.1, 100],  // FoV, aspect, near, far,

    // joints
    jointSephereConfig: [0.2, 10, 10],
    renderedJoints: [],
    renderedObject: null,
    renderedWireframe: null,
    scene: null
}

const CONSTANT = {
    degree270: 4.71,
}

const COLOR = {
    SELECTED_BALL: '#000000',
    UNSELECTED_BALL: '#AAAA00'
}


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

const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster();

const camera = new THREE.PerspectiveCamera(...globalState.cameraSettings);
camera.position.set(1, 0.5, 3);
camera.position.set(10, 5, 30);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
// controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');

const clock = new THREE.Clock();
let toggle = 0;

document.addEventListener('click', onDocumentMouseClick, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);
// renderJointCandidates(286);

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}


// for toggle select status for balls
function onDocumentMouseClick(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(globalState.renderedJoints);
    if (intersects.length > 0) {
        let intersect = intersects[0];

        if (globalState.renderedJoints.includes(intersect.object)) {

            // don't do tenary...CONSTANT
            if (intersect.object.selected == false) {
                intersect.object.material.color.set(COLOR.SELECTED_BALL);
            } else {
                intersect.object.material.color.set(COLOR.UNSELECTED_BALL);
            }
            intersect.object.selected = !intersect.object.selected;
        }
    }


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
function fetchJointCandidates(model_id) {
    // .then(data => console.log(data));
    fetch(`http://127.0.0.1:5000/api/v0.1/candidate_joints/${model_id}`, { method: 'get' })
        .then(response => {
            if (response.ok) {
                response.json().then(json => {
                    let joint_locations = json['joints'];
                    joint_locations = joint_locations.map((e) => {
                        let arr = [e[0] * 10, e[1] * 10, e[2] * 10];
                        return arr;
                    })

                    renderJointCandidates(joint_locations);
                });
            }
        })
}

function renderJointCandidates(joint_locations) {
    for (let location in joint_locations) {
        const jointBall = new THREE.Mesh(
            new THREE.SphereGeometry(...globalState.jointSephereConfig),
            new THREE.MeshPhongMaterial({ color: "#AAAA00" })
        );
        // TODO: load from local fsys
        jointBall.position.set(...joint_locations[location]);
        jointBall.selected = false;
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
    scene.add(wireframe);
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
            scene.add(mesh);
            renderedWireframe(child.geometry);
            setToggleObjectById("toggleShow", globalState.renderedObject);
        }
    });
}

function loadAndRenderObject() {
    const objLoader = new OBJLoader2();
    // TODO: load from local fsys
    // const path = 'models/286/objs/source.obj';
    // const model_id = 20390;
    const model_id = document.getElementById("modelIdInput").value;

    const path = `models/${model_id}/objs/source.obj`;
    objLoader.load(path, (root) => {
        renderObject(root);
    });

    fetchJointCandidates(model_id);
}


document.getElementById('loadModel').addEventListener("click", (e) => {
    e.preventDefault();
    loadAndRenderObject();
});


setupScene();
// loadAndRenderObject();
requestAnimationFrame(render);

// for debugging
window.globalState = globalState;