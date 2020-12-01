import * as THREE from '../threejs/build/three.module.js';
import { OrbitControls } from '../threejs/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../threejs/examples/jsm/controls/TransformControls.js';
import { DragControls } from '../threejs/examples/jsm/controls/DragControls.js';
import { OBJLoader2 } from '../threejs/examples/jsm/loaders/OBJLoader2.js';
import { PLYLoader } from '../threejs/examples/jsm/loaders/PLYLoader.js';
import { GUI } from '../threejs/examples/jsm/libs/dat.gui.module.js';


// You all-in-one fake state manager
const globalState = {
    // joints
    jointSephereConfig: [0.2, 10, 10],
    renderedJoints: [],
    renderedObject: [],
    renderedWireframe: [],
    scene: null,
    modelId: null,

    selectedJoint: null,
    kinematicChains: [],
    currentChain: [],
    annotatingChain: false,
    renderedChains: []
}

// for model and wireframe control panel GUI
let transformationParams = {
    scale: 10,
    rotation: 0,
    transX: 0,
    transY: 0,
    transZ: 0,
}

const ROTATIONS = {
    degree90: 1.5708,
    degree180: 3.1416,
    degree270: 4.7123,
}

const CONFIGS = {
    lightIntensity: 1,
    cameraParams: [45, 1, 0.1, 100],  // FoV, aspect, near, far
    cameraPosition: [10, 5, 30],
    raycasterLineThres: 0.1
}

const COLOR = {
    SELECTED_JOINT: '#AAAA00',
    UNSELECTED_JOINT: '#AA33FF',
    ANNOTATED_JOINT: '#C02121'
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

// scene initialization
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
scene.background = new THREE.Color('lightgray');

// GUI
const gui = new GUI({ width: 250 });
{
    // by default we hide the GUI and only display it when the model is loaded
    // GUI is shown after the model is loaded, see loadAndRenderObject()
    GUI.toggleHide();
    const objTransformation = gui.addFolder('Object Transformations');
    objTransformation.add(transformationParams, 'scale', 1, 30).step(0.01).onChange(() => {
        scaleUpBy(objPivot, transformationParams.scale);
        scaleUpBy(wireframePivot, transformationParams.scale);
    });
    objTransformation.add(transformationParams, 'rotation', ROTATIONS).onChange(() => {
        objPivot.rotation.y = transformationParams.rotation;
        wireframePivot.rotation.y = transformationParams.rotation;
    });
    objTransformation.add(transformationParams, 'transX', -10, 10).step(0.01).onChange(() => {
        objPivot.position.x = transformationParams.transX;
        wireframePivot.position.x = transformationParams.transX;
    });
    objTransformation.add(transformationParams, 'transY', -10, 10).step(0.01).onChange(() => {
        objPivot.position.y = transformationParams.transY;
        wireframePivot.position.y = transformationParams.transY;
    });
    objTransformation.add(transformationParams, 'transZ', -10, 10).step(0.01).onChange(() => {
        objPivot.position.z = transformationParams.transZ;
        wireframePivot.position.z = transformationParams.transZ;
    });
    objTransformation.open();
}


// Axes Helper
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// pivot group for transformations
// objects usually comes with multiple mesh components, we need to perform transformations for all of them wrt the same origin
const objPivot = new THREE.Group();
const wireframePivot = new THREE.Group();
scene.add(objPivot);
scene.add(wireframePivot);

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

// transform/drag control for joints
const transformControl = new TransformControls(camera, renderer.domElement);
let dragControls = new DragControls(globalState.renderedJoints, camera, renderer.domElement);
dragControls.enabled = false;

let hiding;
{
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

        }, 250);

    }

    function cancelHideTransform() {

        if (hiding) clearTimeout(hiding);

    }


    dragControls.addEventListener('hoveron', function (event) {

        transformControl.attach(event.object);
        cancelHideTransform();

    });

    dragControls.addEventListener('hoveroff', function () {

        delayHideTransform();

    });

}

function onDocumentMouseMove(event) {
    event.preventDefault();

    // TODO: this won't work with fancier layout (such as with margin left on canvas)
    mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1;
    mouse.y = -((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1;

    if (globalState.renderedObject.length !== 0) {
        for (let idx in globalState.renderedObject) {
            let intersects = raycaster.intersectObject(globalState.renderedObject[idx], true);
            if (intersects.length > 0) {
                // TODO: now if click over exsiting joints, we still see the cursor.
                cursor.visible = true;
                cursor.position.copy(intersects[0].point);
                // greedly break the loop to force the cursor to target the closest surface wrt camera 
                break;
            } else {
                cursor.visible = false;
            }
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
    updateJointToForm(globalState.selectedJoint);
    drawChains();
}


// joint candidates fetching and rendering
function fetchJointCandidates(modelId) {
    fetch(`http://127.0.0.1:5000/api/v0.1/load_annotation/${modelId}`, {
        method: 'get'
    }).then(response => {
        if (response.ok) {
            response.json().then(json => {
                if (json['with_annotation']) {
                    let joints = json['joints'];
                    let chains = json['chains'];
                    for (let joint of joints) {
                        let jointBall = createOneJointFromAnnotation(
                            [joint.position[0] * 10, joint.position[1] * 10, joint.position[2] * 10],
                            joint.category, joint.index);
                        scene.add(jointBall);
                        globalState.renderedJoints.push(jointBall);
                    }

                    setToggleObjectsById("toggleJoints", globalState.renderedJoints);
                    // TODO: make chains to be Vector3s
                    let tempChains = chains.map((item) => {
                        item.map((e) => {
                            let coord = e[1];
                            console.log(coord);
                            let vec = new THREE.Vector3(coord.x , coord.y, coord.z);
                            e[1] = vec;
                            return e;
                        })
                        return item;
                    });
                    console.log(tempChains);
                    globalState.kinematicChains = tempChains;
                }
            });
        }
    })

    fetch(`http://127.0.0.1:5000/api/v0.1/candidate_joints/${modelId}`, {
        method: 'get'
    }).then(response => {
        if (response.ok) {
            response.json().then(json => {
                let joint_locations = json['joints'];
                // scale up by a factor of 10 to avoid the loss of precision with float
                joint_locations = joint_locations.map((e) => {
                    let arr = [e[0] * 10, e[1] * 10, e[2] * 10];
                    return arr;
                })
                let model_cat = json['model_cat'];
                $('#modelType').text(model_cat);
                $('#annotatingChainMode').text(globalState.annotatingChain);

                renderJointCandidates(joint_locations);
            });
        }
    })
}

// joint candidates fetching and rendering
function saveAnnotation() {

    const modelId = globalState.modelId;
    const data = {
        modelId: modelId,
        modelType: $('#modelType').text(),
        joints: null, // add joint meta data here
        chains: globalState.kinematicChains, // process and add chains
    };


    data.joints = globalState.renderedJoints.map((item) => {
        let e = item.position
        const joint = {
            position: [e.x / 10, e.y / 10, e.z / 10],
            category: item.typeAnnotation,
            index: item.index
        }
        return joint;
    });


    fetch(`http://127.0.0.1:5000/api/v0.1/save_joints/${modelId}`, {
        method: 'post',
        body: JSON.stringify(data)
    })
}

// for adding joint to the scene
function createOneJoint(location) {
    const jointBall = new THREE.Mesh(
        new THREE.SphereGeometry(...globalState.jointSephereConfig),
        new THREE.MeshPhongMaterial({ color: COLOR.UNSELECTED_JOINT })
    );
    jointBall.position.set(...location);
    jointBall.selected = false;
    jointBall.annotated = false;
    jointBall.typeAnnotation = null;
    jointBall.index = null;
    return jointBall
}

// for loading from annotation
function createOneJointFromAnnotation(location, typeAnnotation, index) {
    const jointBall = createOneJoint(location)
    jointBall.annotated = true;
    jointBall.typeAnnotation = typeAnnotation;
    jointBall.index = index;
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

    globalState.renderedWireframe = wireframe;
    scene.add(wireframe);
    wireframePivot.add(wireframe);
}

function renderObjectPLY(object) {

    var material = new THREE.MeshStandardMaterial({ color: 0x0055ff, flatShading: true });
    var mesh = new THREE.Mesh(object, material);

    globalState.renderedObject.push(mesh);
    scene.add(mesh);
    objPivot.add(mesh);

    renderWireframe(object);

    setToggleObjectById("toggleShow", objPivot);
    setToggleObjectById("toggleWireframe", wireframePivot);
}


function renderObject(object) {
    object.traverse(function (child) {
        if (child instanceof THREE.Mesh) { // in case there are multiple components in the object
            // render object
            child.material.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(child.geometry, child.material);

            globalState.renderedObject.push(mesh);
            scene.add(mesh);
            objPivot.add(mesh);

            renderWireframe(child.geometry);
        }
    });
    setToggleObjectById("toggleShow", objPivot);
    setToggleObjectById("toggleWireframe", wireframePivot);
}

function loadAndRenderObject() {
    // when model is loaded, ignore the rest to avoid duplicated rendered objects
    if (globalState.renderedObject.length > 0) return;

    // show GUI
    GUI.toggleHide();

    // create loader and load model by given id from disk
    let loader;
    let renderFunction;
    let path;
    let modelId = document.getElementById("modelIdInput").value;
    // PartNet models use pure digits for ID
    let isNumModelId = /^\d+$/.test(modelId);

    if (isNumModelId) {
        path = `models/${modelId}/objs/source.obj`;
    } else {
        path = `models_ply/${modelId}.ply`
    }
    if (path.endsWith('.ply')) {
        loader = new PLYLoader();
        renderFunction = renderObjectPLY;
    } else {
        loader = new OBJLoader2();
        // note here we render BOTH the object and the wireframe due to the hierachical model object structure
        renderFunction = renderObject;
    }
    loader.load(path, (root) => {
        renderFunction(root);
    });

    globalState.modelId = modelId;
    objPivot.scale.set(transformationParams.scale, transformationParams.scale, transformationParams.scale);
    wireframePivot.scale.set(transformationParams.scale, transformationParams.scale, transformationParams.scale);
    // TODO: fetch automatically generated joints from server
    // fetch candidate joints from backend (only for PartNet data)
    if (isNumModelId) {
        fetchJointCandidates(modelId);
    }
    // return (modelId, isNumModelId) ????
}


setupScene();
// leave this line here for easy debugging
// loadAndRenderObject();
requestAnimationFrame(render);


function updateJointToForm(joint) {
    if (joint != null) {
        const x = joint.position.x;
        const y = joint.position.y;
        const z = joint.position.z;
        const typeAnnotation = joint.typeAnnotation;
        const jointIndex = joint.index;
        $('#jointX')[0].value = x;
        $('#jointY')[0].value = y;
        $('#jointZ')[0].value = z;
        $('#jointCategorySelect')[0].value = typeAnnotation;
        $('#jointIndex')[0].value = jointIndex;
    }
}

{ // joint annotation form related

    $('#jointCategorySelect').change(() => {
        if (globalState.selectedJoint != null) {
            globalState.selectedJoint.annotated = true;
            globalState.selectedJoint.typeAnnotation = $('#jointCategorySelect')[0].value;
        }
        console.log(globalState.selectedJoint);
    })

    $('#jointIndex').change(function () {
        if (globalState.selectedJoint != null) {
            globalState.selectedJoint.index = $('#jointIndex')[0].value;
        }
        console.log(globalState.selectedJoint);
    })
}


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
                globalState.selectedJoint.material.color.set(COLOR.UNSELECTED_JOINT);
                globalState.selectedJoint.selected = false;
                globalState.selectedJoint = null;
            }

            // select current joint and update
            globalState.selectedJoint = intersect.object;
            globalState.selectedJoint.material.color.set(COLOR.SELECTED_JOINT);
            globalState.selectedJoint.selected = true;
            updateJointToForm(globalState.selectedJoint);

            // chain annotating mode
            if (globalState.annotatingChain) {
                globalState.currentChain.push([globalState.selectedJoint.index, globalState.selectedJoint.position]);
            }

        } else {
            // this way we ignore unselect operation when adjust the camera AND not hover on any objects
            globalState.selectedJoint.material.color.set(COLOR.UNSELECTED_JOINT);
            globalState.selectedJoint.selected = false;
            globalState.selectedJoint = null;
        }
    }
}

document.addEventListener('keypress', function (event) {
    // trigger help modal
    if (event.code === 'NumpadEnter') {
        $("#modalTrigger").click();
    }

    if (event.code === 'NumpadAdd') {
        axesHelper.visible = !axesHelper.visible;
    }

    // TODO: maybe not a good idea to monitor "Enter"?
    if (event.code === 'KeyA') {
        if (cursor.visible) {
            const jointBall = createOneJoint([cursor.position.x, cursor.position.y, cursor.position.z]);
            scene.add(jointBall);

            // for later control purpose, order not matters
            globalState.renderedJoints.push(jointBall);
        }
    }

    if (event.code === 'KeyD') {
        const selected = globalState.selectedJoint;
        if (selected) {
            globalState.renderedJoints = globalState.renderedJoints.filter((e) => e.uuid !== selected.uuid);

            // must detach to avoid the following error
            // TransformControls: The attached 3D object must be a part of the scene graph.
            transformControl.detach(selected);
            scene.remove(selected);
        }
    }

    if (event.code === 'KeyQ') {
        objPivot.visible = !objPivot.visible;
    }

    if (event.code === 'KeyC') {
        if (globalState.annotatingChain) {
            globalState.kinematicChains.push(globalState.currentChain);
            console.log('Adding chain of length', globalState.currentChain.length, globalState.currentChain);
            globalState.currentChain = [];
        }
    }

    if (event.code === 'KeyW') {
        wireframePivot.visible = !wireframePivot.visible;
    }
});

document.addEventListener('click', onDocumentMouseClick, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);

document.getElementById('loadModel').addEventListener("click", (e) => {
    e.preventDefault();
    loadAndRenderObject();
});

document.getElementById('loadAnnotation').addEventListener("click", (e) => {
    e.preventDefault();
    // TODO: ...
    console.log('Not implemented for now!');
});

document.getElementById('annotatingChain').addEventListener("click", (e) => {
    e.preventDefault();
    globalState.annotatingChain = !globalState.annotatingChain;
    $('#annotatingChainMode').text(globalState.annotatingChain);
});

// draw skeleton chains
function drawChains() {
    let chain;
    let lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    let points;
    let lineGeometry;
    let line;

    while (globalState.renderedChains.length > 0) {
        line = globalState.renderedChains.pop();
        scene.remove(line);
    }

    for (chain of globalState.kinematicChains) {
        points = chain.map((e) => e[1]);
        lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        line = new THREE.Line(lineGeometry, lineMaterial);
        globalState.renderedChains.push(line);
        scene.add(line)
    }
}

document.getElementById('saveAnnotation').addEventListener("click", (e) => {
    e.preventDefault();
    saveAnnotation();
});


// for debugging
window.globalState = globalState;