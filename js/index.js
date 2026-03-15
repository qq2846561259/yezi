import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// 场景初始化
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.002);

// 相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 45, 115); // 稍微调高调远，配合更分散的布局
camera.lookAt(0, 0, 0); // 让相机始终看向森林中心

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// 现代渲染设置，提升色彩亮度
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 更真实的电影感色调映射
renderer.toneMappingExposure = 1.2; // 曝光度微调
document.body.appendChild(renderer.domElement);

// 灯光
// 1. 半球光：模拟天空和地面的环境光，让阴影不那么死黑
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// 2. 主平行光：模拟主光源，产生明暗对比
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// 3. 点光源：增加局部细节亮点
const pointLight1 = new THREE.PointLight(0xffeebb, 2, 100);
pointLight1.position.set(-20, 10, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight2.position.set(20, 10, -20);
scene.add(pointLight2);

// 全局变量
const tree = new THREE.Group();
const stars = [];
scene.add(tree);

// --- 幸运果与祝福 ---
const wishesMap = {
    "事业树": ["祝叶子大王前程似锦，步步高升", "祝叶子大王大展宏图，马到成功", "祝叶子大王事业辉煌，成就梦想", "祝叶子大王旗开得胜，更上一层楼", "祝叶子大王宏图大展，蒸蒸日上"],
    "快乐树": ["祝叶子大王天天开心，笑口开怀", "祝叶子大王所有的快乐都如期而至", "祝叶子大王忧愁全消，快乐无边", "祝叶子大王简单快乐，平安喜乐", "祝叶子大王的生活充满阳光"],
    "健康树": ["祝叶子大王身体健康，龙马精神", "祝叶子大王百病不侵，活力常在", "祝叶子大王气色红润，精神焕发", "祝叶子大王长命百岁，健康如意", "祝叶子大王平安康泰，福寿安康"]
};

// 备选通用幸运果
const defaultWishes = [
    "祝叶子大王眼里的星星，永远闪亮。",
    "祝叶子大王每一天都充满阳光和欢笑。",
    "祝叶子大王被世界温柔以待。",
    "祝叶子大王所有美好都如期而至。"
];

// --- 加载所有 FBX 模型 ---
const loader = new FBXLoader();
const loadingEl = document.getElementById('loading');
const progressEl = document.getElementById('progress');

// 筛选出内存占用小的模型 (Tree4: 0.5MB, Tree5: 1.0MB, Tree7: 0.5MB)
const treeFiles = [
    'Tree4.fbx', 'Tree5.fbx', 'Tree7.fbx'
];

// 获取 Vite 的基础路径
const BASE_URL = import.meta.env.BASE_URL || '/';

const treeNames = [
    "快乐树", "健康树", "事业树"
];

let loadedCount = 0;
const treePositions = []; // 存储已加载树的位置以防重叠

treeFiles.forEach((fileName, index) => {
    const currentTreeName = treeNames[index];
    // 使用绝对路径加载，适配 GitHub Pages 部署，确保路径从 /yezi/ 开始
    const modelPath = `${BASE_URL}fbx/FBX_Y1374/${fileName}`.replace(/\/+/g, '/');
    loader.load(modelPath, function (object) {
        loadedCount++;
        
        // 进度更新
        if (progressEl) {
            progressEl.textContent = `正在唤醒森林中的光芒... (${loadedCount}/${treeFiles.length})`;
        }

        // 隐藏加载提示
        if (loadedCount === treeFiles.length) {
            if (loadingEl) loadingEl.style.display = 'none';
        }
        
        // 1. 尝试寻找不重叠的位置
        let x, z;
        let isOverlapping = true;
        let attempts = 0;
        const range = 110; // 稍微扩大范围 (从 80 增加到 110)，增加疏离感
        const minDistance = 25; // 增加最小间距 (从 15 增加到 25)，确保树木之间更通透

        while (isOverlapping && attempts < 100) {
            x = (Math.random() - 0.5) * range;
            z = (Math.random() - 0.5) * range;
            
            isOverlapping = treePositions.some(pos => {
                const dist = Math.sqrt((pos.x - x) ** 2 + (pos.z - z) ** 2);
                return dist < minDistance;
            });
            attempts++;
        }
        treePositions.push({ x, z });

        // 2. 调整模型大小 (恢复到较小尺寸)
        const randomScale = 0.07 + Math.random() * 0.03;
        object.scale.setScalar(randomScale);
        
        // 3. 设置位置
        object.position.set(x, -5, z);
        
        // 4. 随机旋转
        object.rotation.y = Math.random() * Math.PI * 2;
        
        // 遍历模型，确保材质正确显示并提升亮度
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    if (child.material.map) {
                        child.material.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x111111);
                        child.material.emissiveIntensity = 0.5;
                    }
                    if (child.material.isMeshStandardMaterial) {
                        child.material.roughness = 0.6;
                        child.material.metalness = 0.2;
                    }
                }
            }
        });

        tree.add(object);

        // 在每棵树上都生成一些星星，并根据树名分配愿望
        createStarsOnSingleTree(object, currentTreeName);

        // 为每棵树添加名字标签
        createNameLabel(object, currentTreeName);

    }, undefined, function (error) {
        console.error(`加载 ${fileName} 出错`, error);
        loadedCount++;
    });
});

// --- 辅助函数：创建五角星纹理 ---
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const cx = 64;
    const cy = 64;
    const spikes = 5;
    const outerRadius = 60;
    const innerRadius = 25;

    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();

    // 渐变填充让五角星更有光泽
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#ffff00');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

const starTexture = createStarTexture();

// --- 辅助函数：创建名字标签 ---
function createNameLabel(model, name) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 背景半透明圆角矩形
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 64, 32);
    ctx.fill();

    // 文字样式
    ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 文字发光效果
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    
    ctx.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false // 确保不被遮挡
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    // 获取模型包围盒确定高度
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 放置在树的正上方
    sprite.position.set(model.position.x, center.y + size.y / 2 + 5, model.position.z);
    sprite.scale.set(12, 3, 1); // 比例 4:1

    tree.add(sprite);
}

// --- 在单棵树上生成星星 ---
function createStarsOnSingleTree(model, treeName) {
    const starMaterial = new THREE.SpriteMaterial({
        map: starTexture,
        color: 0xffffff, // 贴图已有颜色，这里设为白色
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthTest: false // 确保星星在树叶前面不被裁剪
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 获取对应树名的愿望列表
    const specificWishes = wishesMap[treeName] || defaultWishes;

    // 每棵树放 10 颗星星，让画面更清爽
    for (let i = 0; i < 10; i++) {
        const star = new THREE.Sprite(starMaterial);
        
        const r = Math.random() * size.x * 0.45;
        const theta = Math.random() * Math.PI * 2;
        const y = center.y + (Math.random() - 0.2) * size.y * 0.5;

        // 星星的位置需要相对于 tree Group 
        star.position.set(
            model.position.x + r * Math.cos(theta),
            y,
            model.position.z + r * Math.sin(theta)
        );

        star.scale.set(6, 6, 1); 
        // 随机分配一个该类别下的愿望
        star.wish = specificWishes[Math.floor(Math.random() * specificWishes.length)];
        stars.push(star);
        tree.add(star);
    }
}

// 降级处理：保留函数定义以防万一
function createFallbackTree() {}
function createStarsOnFallback() {}
function createStarsOnModel() {}

// 魔法尘埃 - 围绕树旋转的小亮点
const dustGroup = new THREE.Group();
const dustGeometry = new THREE.BufferGeometry();
const dustCount = 300;
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
    const radius = 10 + Math.random() * 25;
    const theta = Math.random() * Math.PI * 2;
    const y = -5 + Math.random() * 40; // 从 -15 改为 -5
    dustPositions[i * 3] = radius * Math.cos(theta);
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = radius * Math.sin(theta);
}
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.5 });
const dust = new THREE.Points(dustGeometry, dustMaterial);
dustGroup.add(dust);
scene.add(dustGroup);

// --- 飘雪效果 ---
const snowCount = 1500;
const snowGeometry = new THREE.BufferGeometry();
const snowPositions = new Float32Array(snowCount * 3);
const snowVelocities = new Float32Array(snowCount); // 存储每片雪花的下落速度

for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 150;     // X
    snowPositions[i * 3 + 1] = Math.random() * 100;         // Y (从高处开始)
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;   // Z
    snowVelocities[i] = 0.1 + Math.random() * 0.2;         // 随机下落速度
}

snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const snow = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snow);

// --- 浪漫背景 (星空 & 星云) ---
function createStarfield() {
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 300 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        const type = Math.random();
        if (type > 0.8) { cols[i*3]=0.8; cols[i*3+1]=0.9; cols[i*3+2]=1; } // 蓝
        else if (type > 0.6) { cols[i*3]=1; cols[i*3+1]=1; cols[i*3+2]=0.8; } // 黄
        else { cols[i*3]=1; cols[i*3+1]=1; cols[i*3+2]=1; } // 白
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.8 }));
}
const starfield = createStarfield();
scene.add(starfield);

function createNebula() {
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 250 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        cols[i*3]=0.2+Math.random()*0.2; cols[i*3+1]=0.1+Math.random()*0.1; cols[i*3+2]=0.4+Math.random()*0.3;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 20, vertexColors: true, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
}
const nebula = createNebula();
scene.add(nebula);

// --- 交互逻辑 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const wishCard = document.getElementById('wish-card');
let isMouseDown = false;
let isRightMouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;
let isMouseOverTree = false;

// 触摸相关变量
let touchStartX = 0;
let touchStartY = 0;
let initialPinchDistance = 0;
let lastPinchCenter = new THREE.Vector2();

// 缩放与观察控制变量
const minZoom = 15;
const maxZoom = 400;
const snowBoundary = 75;
let cameraTarget = new THREE.Vector3(0, 0, 0);

// 键盘控制移动状态
const keys = { w: false, a: false, s: false, d: false };
document.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

// 统一缩放逻辑函数
function applyZoom(deltaY, targetX, targetY) {
    raycaster.setFromCamera(new THREE.Vector2(
        (targetX / window.innerWidth) * 2 - 1,
        -(targetY / window.innerHeight) * 2 + 1
    ), camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5);
    let targetPoint = new THREE.Vector3();
    const intersects = raycaster.intersectObjects(tree.children, true);

    if (intersects.length > 0) {
        targetPoint.copy(intersects[0].point);
    } else {
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            targetPoint.copy(intersection);
        } else {
            targetPoint.copy(cameraTarget);
        }
    }

    const zoomSpeed = 0.1;
    const factor = deltaY > 0 ? (1 + zoomSpeed) : (1 - zoomSpeed);
    const offset = new THREE.Vector3().subVectors(camera.position, targetPoint);
    offset.multiplyScalar(factor);
    const nextPosition = new THREE.Vector3().addVectors(targetPoint, offset);
    
    const distFromOrigin = nextPosition.length();
    if (distFromOrigin >= minZoom && distFromOrigin <= maxZoom) {
        camera.position.copy(nextPosition);
        cameraTarget.lerp(targetPoint, 0.1);
    }
}

// 统一平移逻辑函数 (自由移动)
function applyPan(deltaX, deltaZ) {
    const panSpeed = 0.5; // 提高平移速度
    
    // 计算相机的前方向和右方向 (在 XZ 平面上)
    const forward = new THREE.Vector3().subVectors(cameraTarget, camera.position);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    // 计算移动向量
    const moveVector = new THREE.Vector3()
        .addScaledVector(right, -deltaX * panSpeed)
        .addScaledVector(forward, deltaZ * panSpeed);
    
    // 预览新位置
    const nextCameraPos = camera.position.clone().add(moveVector);
    const nextTargetPos = cameraTarget.clone().add(moveVector);
    
    // 边界检查 (雪域范围内)
    if (Math.abs(nextTargetPos.x) < snowBoundary && Math.abs(nextTargetPos.z) < snowBoundary) {
        camera.position.copy(nextCameraPos);
        cameraTarget.copy(nextTargetPos);
    }
}

// 统一旋转逻辑函数 (旋转摄像机，而非旋转森林)
function applyOrbit(deltaX, deltaY) {
    const rotationSpeed = 0.005;
    const offset = new THREE.Vector3().subVectors(camera.position, cameraTarget);
    
    // 水平旋转 (围绕 Y 轴)
    const angleY = -deltaX * rotationSpeed;
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY);
    
    // 垂直旋转 (围绕右轴)
    const right = new THREE.Vector3().crossVectors(offset, new THREE.Vector3(0, 1, 0)).normalize();
    const angleX = -deltaY * rotationSpeed;
    
    // 限制垂直旋转角度，防止翻转 (保持在 5 到 85 度之间)
    const currentAngle = offset.angleTo(new THREE.Vector3(0, 1, 0));
    const nextAngle = currentAngle + angleX;
    if (nextAngle > 0.1 && nextAngle < Math.PI - 0.1) {
        offset.applyAxisAngle(right, angleX);
    }
    
    camera.position.copy(cameraTarget).add(offset);
}

function checkStarClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stars);
    if (intersects.length > 0) {
        wishCard.textContent = intersects[0].object.wish;
        wishCard.style.display = 'block';
        setTimeout(() => { wishCard.style.display = 'none'; }, 3000);
    } else {
        const treeIntersects = raycaster.intersectObjects(tree.children, true);
        if (treeIntersects.length === 0) {
            wishCard.style.display = 'none';
        }
    }
}

// 事件监听器
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    applyZoom(event.deltaY, event.clientX, event.clientY);
}, { passive: false });

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) isMouseDown = true;
    if (event.button === 2) isRightMouseDown = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkStarClick();
});

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 检查鼠标是否悬停在树上
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tree.children, true);
    isMouseOverTree = intersects.length > 0;

    const deltaX = event.clientX - previousMouseX;
    const deltaY = event.clientY - previousMouseY;

    if (isMouseDown) {
        // 左键：旋转视角 (Orbit)
        applyOrbit(deltaX, deltaY);
    } else if (isRightMouseDown) {
        // 右键：平移视角 (Pan)
        applyPan(deltaX * 0.4, deltaY * 0.4);
    }

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
    isRightMouseDown = false;
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
        isMouseDown = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        checkStarClick();
    } else if (event.touches.length === 2) {
        initialPinchDistance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        lastPinchCenter.set(
            (event.touches[0].clientX + event.touches[1].clientX) / 2,
            (event.touches[0].clientY + event.touches[1].clientY) / 2
        );
    }
}, { passive: false });

document.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if (event.touches.length === 1 && isMouseDown) {
        // 单指：旋转视角
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        applyOrbit(deltaX, deltaY);
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // 双指：缩放 + 平移
        const currentDistance = Math.hypot(
            event.touches[0].clientX - event.touches[1].clientX,
            event.touches[0].clientY - event.touches[1].clientY
        );
        const currentCenter = new THREE.Vector2(
            (event.touches[0].clientX + event.touches[1].clientX) / 2,
            (event.touches[0].clientY + event.touches[1].clientY) / 2
        );

        const deltaZoom = initialPinchDistance - currentDistance;
        applyZoom(deltaZoom * 2, currentCenter.x, currentCenter.y);
        initialPinchDistance = currentDistance;

        const deltaX = currentCenter.x - lastPinchCenter.x;
        const deltaY = currentCenter.y - lastPinchCenter.y;
        applyPan(deltaX * 0.8, deltaY * 0.8);
        lastPinchCenter.copy(currentCenter);
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    isMouseDown = false;
});

// --- 动画循环 ---
function animate() {
    requestAnimationFrame(animate);

    // 键盘移动逻辑
    if (keys.w) applyPan(0, 3);
    if (keys.s) applyPan(0, -3);
    if (keys.a) applyPan(3, 0);
    if (keys.d) applyPan(-3, 0);

    // 自动旋转 (当没有交互时)
    if (!isMouseDown && !isRightMouseDown && !isMouseOverTree) {
        applyOrbit(0.3, 0); // 模拟极小量的水平旋转
    }
    const time = Date.now() * 0.001;

    // 星星闪烁
    stars.forEach((s, i) => {
        s.material.opacity = 0.7 + Math.sin(time * 3 + i) * 0.3;
    });

    // 魔法尘埃旋转
    dustGroup.rotation.y += 0.001;
    
    // 雪花下落逻辑
    const positions = snowGeometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
        positions[i * 3 + 1] -= snowVelocities[i];
        positions[i * 3] += Math.sin(time + i) * 0.02;

        if (positions[i * 3 + 1] < -20) {
            positions[i * 3 + 1] = 60;
            positions[i * 3] = (Math.random() - 0.5) * 150;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
        }
    }
    snowGeometry.attributes.position.needsUpdate = true;
    
    starfield.rotation.y += 0.0001;
    nebula.rotation.y -= 0.0001;

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
