import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../threejs/examples/jsm/controls/TransformControls.js';
import { DragControls } from '../threejs/examples/jsm/controls/DragControls.js';
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

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = 0.1;

const camera = new THREE.PerspectiveCamera(...globalState.cameraSettings);
camera.position.set(1, 0.5, 3);
camera.position.set(10, 5, 30);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
// controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');

// set up cursor
const cursor = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.5),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
cursor.visible = false;
scene.add(cursor);

// // grid helper 
// var helper = new THREE.GridHelper( 10, 10 );
// helper.position.y = - 199;
// helper.material.opacity = 0.25;
// helper.material.transparent = true;
// scene.add( helper );

document.addEventListener('click', onDocumentMouseClick, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);

// transform contorol
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('change', render);
transformControl.addEventListener('dragging-changed', function (event) {

    controls.enabled = !event.value;

});
scene.add(transformControl);

// Hiding transform situation is a little in a mess :()
transformControl.addEventListener('change', function () {

    cancelHideTransform();

});

transformControl.addEventListener('mouseDown', function () {

    cancelHideTransform();

});

transformControl.addEventListener('mouseUp', function () {

    delayHideTransform();

});

var hiding;

function delayHideTransform() {

    cancelHideTransform();
    hideTransform();

}

function hideTransform() {

    hiding = setTimeout(function () {

        transformControl.detach(transformControl.object);

    }, 2500);

}

function cancelHideTransform() {

    if (hiding) clearTimeout(hiding);

}

var dragcontrols = new DragControls(globalState.renderedJoints, camera, renderer.domElement); //
dragcontrols.enabled = false;
dragcontrols.addEventListener('hoveron', function (event) {

    transformControl.attach(event.object);
    cancelHideTransform();

});

dragcontrols.addEventListener('hoveroff', function () {

    delayHideTransform();

});


function onDocumentMouseMove(event) {
    event.preventDefault();

    mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1;
    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1;


    if (globalState.renderedObject != null) {
        var intersects = raycaster.intersectObject(globalState.renderedObject, true);
        if (intersects.length > 0) {
            // TODO: now if click over exsiting joints, we still see the cursor.
            cursor.visible = true;
            cursor.position.copy(intersects[0].point);

        } else {
            cursor.visible = false;
        }

    }
}

document.addEventListener("keypress", function (event) {
    // TODO: maybe not a good idea to monitor "Enter"?
    if (event.keyCode == 13) {
        if (cursor.visible) {
            const jointBall = createOneJoint([cursor.position.x, cursor.position.y, cursor.position.z]);
            scene.add(jointBall);

            // for later control purpose, order not matters
            globalState.renderedJoints.push(jointBall);
        }
    }
});

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


function createOneJoint(location) {
    const jointBall = new THREE.Mesh(
        new THREE.SphereGeometry(...globalState.jointSephereConfig),
        new THREE.MeshPhongMaterial({ color: COLOR.UNSELECTED_BALL })
    );
    // TODO: load from local fsys
    jointBall.position.set(...location);
    jointBall.selected = false;
    return jointBall
}

function renderJointCandidates(joint_locations) {
    for (let location in joint_locations) {
        const jointBall = createOneJoint(joint_locations[location])
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
            child.material.side = THREE.DoubleSide;
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