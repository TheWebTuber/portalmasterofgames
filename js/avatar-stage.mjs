import * as THREE from "three";
import { OrbitControls } from "../assets/avatar-viewer/controls/OrbitControls.js";
import { GLTFLoader } from "../assets/avatar-viewer/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "../assets/avatar-viewer/three-vrm.module.min.js";

export async function parseAvatar(buffer) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => {
    if (/^(blob:|data:)/i.test(url)) return url;
    throw new Error("Use a self-contained VRM export.");
  });
  const loader = new GLTFLoader(manager);
  loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync(buffer, "");
  const vrm = gltf.userData.vrm;
  if (!vrm?.humanoid) {
    VRMUtils.deepDispose(gltf.scene);
    throw new Error("This file does not contain a VRM humanoid.");
  }
  VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse(node => { if (node.isMesh) node.frustumCulled = false; });
  return vrm;
}

export function disposeAvatar(vrm) {
  vrm.scene.removeFromParent();
  VRMUtils.deepDispose(vrm.scene);
}

function joint(vrm, name) {
  return vrm.humanoid.getNormalizedBoneNode(name);
}

function point(vrm, name) {
  return joint(vrm, name).getWorldPosition(new THREE.Vector3());
}

function applyPose(vrm, name) {
  const rig = vrm.humanoid;
  rig.resetNormalizedPose();
  vrm.scene.updateMatrixWorld(true);
  const pose = {};
  // Store the pose in each bone's own rest frame, including older VRM 0.x rigs.
  function bend(bone, x, y, z) {
    const frame = joint(vrm, bone).getWorldQuaternion(new THREE.Quaternion());
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    pose[bone] = { rotation: frame.clone().invert().multiply(turn).multiply(frame).toArray() };
  }
  for (const [side, sign] of [["left", 1], ["right", -1]]) {
    const onHip = name === "hips";
    bend(side + "UpperArm", name === "sit" ? -.35 : -.08, -.08 * sign, (onHip ? -.77 : -1.30) * sign);
    bend(side + "LowerArm", name === "sit" ? -.85 : -.13, (onHip ? -.72 : -.24) * sign, (onHip ? -1.58 : -.25) * sign);
    if (name === "sit") {
      bend(side + "UpperLeg", -1.48, 0, .07 * sign);
      bend(side + "LowerLeg", 1.51, 0, 0);
    }
  }
  rig.setNormalizedPose(pose);
  vrm.update(0);
  vrm.scene.updateMatrixWorld(true);
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc5b5ce, 1.9));
  const light = new THREE.DirectionalLight(0xfff5e6, 2);
  light.position.set(2, 4, 3);
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = true;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener("change", render);
  let avatar;
  let height = 1.7;

  function resetView() {
    const distance = height * 2.18 / Math.min(camera.aspect, 1);
    controls.target.set(0, height * .5, 0);
    camera.position.copy(controls.target).add(new THREE.Vector3(0, height * .04, distance));
    controls.minDistance = height * .35;
    controls.maxDistance = distance * 3;
    camera.far = Math.max(100, distance * 5);
    camera.updateProjectionMatrix();
    controls.update();
    render();
  }
  function resize() {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  function pose(name) {
    applyPose(avatar, name);
    // Lower the pelvis when seated so the soles stay at the same level.
    const ankle = Math.min(point(avatar, "leftFoot").y, point(avatar, "rightFoot").y);
    avatar.scene.position.y += height * .045 - ankle;
    avatar.scene.updateMatrixWorld(true);
    avatar.springBoneManager?.reset();
    render();
  }
  return {
    show(next, name) {
      if (avatar) disposeAvatar(avatar);
      avatar = next;
      scene.add(avatar.scene);
      height = Math.max(.1, (point(avatar, "head").y - point(avatar, "leftFoot").y) * 1.22);
      pose(name);
      resetView();
    },
    pose,
    view(action) {
      if (action === "reset") return resetView();
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), action === "left" ? -.35 : .35);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
  };
}
