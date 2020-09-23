import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../threejs/examples/jsm/controls/TransformControls.js';
import { DragControls } from '../threejs/examples/jsm/controls/DragControls.js';
import { OBJLoader2 } from '../threejs/examples/jsm/loaders/OBJLoader2.js';


// You all-in-one fake state manager
const globalState = {
    // joints
    jointSephereConfig: [0.2, 10, 10],
    renderedJoints: [],
    renderedObject: null,
    renderedWireframe: null,
    scene: null,

    selectedJoint: null
}

const CONSTANT = {
    degree270: 4.71,
}

const CONFIGS = {
    scaleFactor: 22.5, // for unknown reason either the scale of the object or the joints are not correct, hard-coded workaround only
    lightIntensity: 1,
    cameraParams: [45, 1, 0.1, 100],  // FoV, aspect, near, far
    cameraPosition: [10, 5, 30],
    raycasterLineThres: 0.1
}

const COLOR = {
    SELECTED_BALL: '#AAAA00',
    UNSELECTED_BALL: '#AA33FF'
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


// ===================================== Main Implementation ===================================== //



function setupScene() {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const lightHemi = new THREE.HemisphereLight(skyColor, groundColor, CONFIGS.lightIntensity);
    scene.add(lightHemi);

    const color = 0xFFFFFF;
    const directionalLight = new THREE.DirectionalLight(color, globalState.lightIntensity);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
}

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas });
const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');

// for all the interactions around objects in the scene
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = CONFIGS.raycasterLineThres;

const camera = new THREE.PerspectiveCamera(...CONFIGS.cameraParams);
camera.position.set(...CONFIGS.cameraPosition);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);

// set up cursor
const cursor = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.15),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
cursor.visible = false;
scene.add(cursor);

// transform/drag contorol for joints
const transformControl = new TransformControls(camera, renderer.domElement);
const dragcontrols = new DragControls(globalState.renderedJoints, camera, renderer.domElement);
dragcontrols.enabled = false;

{
    let hiding;

    transformControl.addEventListener('change', render);

    transformControl.addEventListener('dragging-changed', function (event) {

        controls.enabled = !event.value;

    });

    scene.add(transformControl);

    transformControl.detach();

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


    function delayHideTransform() {

        cancelHideTransform();
        hideTransform();

    }

    function hideTransform() {

        hiding = setTimeout(() => {

            transformControl.detach(transformControl.object);

        }, 1500);

    }

    function cancelHideTransform() {

        if (hiding) clearTimeout(hiding);

    }


    dragcontrols.addEventListener('hoveron', function (event) {

        transformControl.attach(event.object);
        cancelHideTransform();

    });

    dragcontrols.addEventListener('hoveroff', function () {

        delayHideTransform();

    });

}


document.addEventListener('click', onDocumentMouseClick, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);

function onDocumentMouseMove(event) {
    event.preventDefault();

    // TODO: this won't work with fancier layout
    mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1;
    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1;
    //     var rect = renderer.domElement.getBoundingClientRect();
    // mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
    // mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;


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
    // trigger help modal
    if (event.code == 'KeyH') {
        $("#modalTrigger").click()
    }

    // TODO: maybe not a good idea to monitor "Enter"?
    if (event.code == 'KeyA') {
        if (cursor.visible) {
            const jointBall = createOneJoint([cursor.position.x, cursor.position.y, cursor.position.z]);
            scene.add(jointBall);

            // for later control purpose, order not matters
            globalState.renderedJoints.push(jointBall);
        }
    }

    if (event.code == 'KeyD') {
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(globalState.renderedJoints);
        if (intersects.length > 0) {
            let intersect = intersects[0];
            if (globalState.renderedJoints.includes(intersect.object)) {
                globalState.renderedJoints = globalState.renderedJoints.filter((e) => {
                    console.log(e.uuid == intersect.object.uuid);
                    return e.uuid !== intersect.object.uuid;
                })

                // must detach to avoid the following error
                // TransformControls: The attached 3D object must be a part of the scene graph.
                transformControl.detach(intersect.object);
                scene.remove(intersect.object);
            }
        }
    }

    if (event.code == 'KeyQ') {
        globalState.renderedObject.visible = !globalState.renderedObject.visible;
    }

    if (event.code == 'KeyW') {
        globalState.renderedWireframe.visible = !globalState.renderedWireframe.visible;
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

            // reset previously selected joint
            if (globalState.selectedJoint != null) {
                globalState.selectedJoint.material.color.set(COLOR.UNSELECTED_BALL);
                globalState.selectedJoint.selected = false;
                globalState.selectedJoint = null;
            }

            // select current joint and update
            globalState.selectedJoint = intersect.object;
            globalState.selectedJoint.material.color.set(COLOR.SELECTED_BALL);
            globalState.selectedJoint.selected = true;
            // TODO: load current joint info
        } else {
            // this way we ignore unselect operation when adjust the camera AND not hover on any objects
            globalState.selectedJoint.material.color.set(COLOR.UNSELECTED_BALL);
            globalState.selectedJoint.selected = false;
            globalState.selectedJoint = null;
        }
    }


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


// joint candidates fetching and rendering
function fetchJointCandidates(model_id) {
    fetch(`http://127.0.0.1:5000/api/v0.1/candidate_joints/${model_id}`, { method: 'get' })
        .then(response => {
            if (response.ok) {
                response.json().then(json => {
                    let joint_locations = json['joints'];
                    joint_locations = joint_locations.map((e) => {
                        let arr = [e[0] * 10, e[1] * 10, e[2] * 10];
                        return arr;
                    })

                    let model_cat = json['model_cat'];
                    $('#modelType').text(model_cat);

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
    if (globalState.renderedJoints.length > 0) return;

    for (let location in joint_locations) {
        const jointBall = createOneJoint(joint_locations[location])
        scene.add(jointBall);

        // for later control purpose, order not matters
        globalState.renderedJoints.push(jointBall);
    }

    setToggleObjectsById("toggleJoints", globalState.renderedJoints);
}

function renderWireframe(objectGeometry) {

    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(objectGeometry),
        new THREE.LineBasicMaterial({ color: 0x0A0Aff })
    );

    wireframe.rotation.y = CONSTANT.degree270;

    // TODO: haven't fix this >_<
    scaleUpBy(wireframe, CONFIGS.scaleFactor);

    globalState.renderedWireframe = wireframe;
    scene.add(wireframe);

    setToggleObjectById("toggleWireframe", globalState.renderedWireframe);
}

function renderObject(object) {
    object.traverse(function (child) {
        if (child instanceof THREE.Mesh) { // in case there are multiple components in the object
            // render object
            child.material.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(child.geometry, child.material);
            mesh.rotation.y = CONSTANT.degree270;

            // TODO: haven't fix this >_<
            scaleUpBy(mesh, CONFIGS.scaleFactor);

            globalState.renderedObject = mesh;
            scene.add(mesh);

            renderWireframe(child.geometry);
            setToggleObjectById("toggleShow", globalState.renderedObject);
        }
    });
}

function loadAndRenderObject() {
    // when model is loaded, ignore the rest to avoid duplicated rendered objects
    if (globalState.renderedObject != null) return;

    // create loader and load model by given id from disk
    const objLoader = new OBJLoader2();
    const model_id = document.getElementById("modelIdInput").value;

    const path = `models/${model_id}/objs/source.obj`;
    // note here we render BOTH the object and the wireframe due to the hierachical model object structure
    objLoader.load(path, (root) => {
        renderObject(root);
    });

    // fetch candidate joints from backend
    fetchJointCandidates(model_id);
}


document.getElementById('loadModel').addEventListener("click", (e) => {
    e.preventDefault();
    loadAndRenderObject();
});


setupScene();
// leave this line here for easy debugging
// loadAndRenderObject();
requestAnimationFrame(render);

// for debugging
window.globalState = globalState;