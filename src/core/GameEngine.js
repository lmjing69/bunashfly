import { PhysicsEngine } from './PhysicsEngine.js';
import { PipeManager } from './PipeManager.js';
import { CollisionManager } from './CollisionManager.js';

export const GameState = {
    INIT: 'INIT',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

// ============================
// 🎨 CUSTOMIZATION ZONE START
// ============================
// Change these to customize your game!

const CONFIG = {
    // ==========================================
    // 🖼️  CHARACTER IMAGE
    // ==========================================
    // Set a URL/path to use a custom character image (cropped to a circle)
    // Set to null for the default yellow bird
    // Examples:
    //   './assets/modi.png'
    //   'https://example.com/my-face.png'
    characterImage: './assets/character.jpeg',

    // ==========================================
    // 🚧 OBSTACLE IMAGE
    // ==========================================
    // Set a URL/path to use a custom obstacle image instead of wooden pipes
    // Set to null for default rustic pipes
    obstacleImage: './assets/obstacles.jpeg',

    // ==========================================
    // 🌆 BACKGROUND IMAGE
    // ==========================================
    // Set a URL/path to use a custom background image
    // Set to null for the default procedural city skyline
    // Example: './assets/ruined-city.jpg'
    backgroundImage: null,

    // ==========================================
    // 😵 CRASH FACES (emojis OR image URLs)
    // ==========================================
    // When the bird crashes, one of these is picked randomly.
    // Each entry can be:
    //   - An emoji string like '😵' or '💀'
    //   - An image URL/path like './assets/crash1.png'
    // If it's an image URL, it will be preloaded.
    // Examples:
    //   crashFaces: ['😵', '💀', './assets/funny1.png', './assets/funny2.png']
    crashFaces: ['./assets/wasted.jpg'],

    // ==========================================
    // 🎵 BACKGROUND MUSIC
    // ==========================================
    // Set a URL/path to a music file (MP3, WAV, OGG)
    // Set to null for no background music
    // Example: './assets/bgm.mp3'
    bgmAudio: './assets/audio/bgm.mp3',

    // ==========================================
    // 💥 CRASH SOUND EFFECT
    // ==========================================
    // Set a URL/path to a crash sound effect file
    // Set to null for the default generated crash noise
    // Example: './assets/crash.mp3'
    crashSound: './assets/crashed.mp3',

    // ==========================================
    // 🎮 GAMEPLAY
    // ==========================================
    // Pipe scroll speed (lower = easier). Default: 2.0
    pipeSpeed: 2.0,

    // Gap between top and bottom pipes (higher = easier). Default: 150
    pipeGap: 150,

    // Game title shown on start screen
    gameTitle: 'Flying Bird',

    // ==========================================
    // 🎨 VISUAL COLORS
    // ==========================================
    // Brick wall
    brickColor: '#8B2500',
    brickHighlight: '#CD3700',
    brickMortar: '#4a1a0a',

    // City skyline
    skyTop: '#FFD89B',
    skyBottom: '#E8A87C',
    buildingColors: ['#2d1810', '#3d2418', '#4a2c1f', '#1a0e07', '#5c3a28'],
    cloudColor: 'rgba(255, 235, 200, 0.3)',

    // Obstacle colors (only used when obstacleImage is null)
    obstacleGradientStart: '#8B4513',
    obstacleGradientMid: '#CD853F',
    obstacleGradientEnd: '#8B4513',
    obstacleCap: '#5C2E00',
    obstacleCapInner: '#6B3A10',
};

// ==========================
// 🎨 CUSTOMIZATION ZONE END
// ==========================

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.state = GameState.INIT;

        this.physics = new PhysicsEngine(canvas);
        this.pipeManager = new PipeManager(canvas);
        this.collisionManager = new CollisionManager(canvas);

        this.score = 0;
        this.highScore = 0;

        this.lastTime = 0;
        this.accumulator = 0;
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 1800;

        this.animationFrameId = null;

        this.audioManager = null;
        this.assetManager = null;
        this.storageManager = null;
        this.uiController = null;

        // Loaded images
        this.characterImg = null;
        this.obstacleImg = null;
        this.backgroundImg = null;
        this.crashFaceImages = {};  // Map of URL -> loaded Image
        this.isCrashed = false;
        this.crashFace = '';         // Current crash face (emoji or URL)
        this.crashFaceImg = null;    // Current crash face Image object (if URL)

        // Background scroll
        this.bgScrollX = 0;

        // Pre-generated buildings for consistent skyline
        this.buildings = [];
        this._generateBuildings();

        // Apply CONFIG gameplay settings
        this.pipeManager.setDifficulty(CONFIG.pipeSpeed, CONFIG.pipeGap);

        this._loadConfigImages();
        this._bindEvents();
        this._setupResize();
    }

    _generateBuildings() {
        // Generate random buildings for the skyline
        const count = 20;
        for (let i = 0; i < count; i++) {
            this.buildings.push({
                x: i * 30 + Math.random() * 10 - 5,
                width: 18 + Math.random() * 20,
                height: 40 + Math.random() * 100,
                color: CONFIG.buildingColors[Math.floor(Math.random() * CONFIG.buildingColors.length)],
                windows: Math.floor(Math.random() * 6) + 2,
            });
        }
    }

    async _loadConfigImages() {
        if (CONFIG.characterImage) {
            try {
                this.characterImg = await this._loadImage(CONFIG.characterImage);
            } catch (e) {
                console.warn('Failed to load character image:', e);
            }
        }
        if (CONFIG.obstacleImage) {
            try {
                this.obstacleImg = await this._loadImage(CONFIG.obstacleImage);
            } catch (e) {
                console.warn('Failed to load obstacle image:', e);
            }
        }
        if (CONFIG.backgroundImage) {
            try {
                this.backgroundImg = await this._loadImage(CONFIG.backgroundImage);
            } catch (e) {
                console.warn('Failed to load background image:', e);
            }
        }

        // Preload crash face images (entries that look like URLs/paths)
        for (const face of CONFIG.crashFaces) {
            if (this._isImageUrl(face)) {
                try {
                    this.crashFaceImages[face] = await this._loadImage(face);
                } catch (e) {
                    console.warn('Failed to load crash face image:', face, e);
                }
            }
        }
    }

    _isImageUrl(str) {
        if (!str || typeof str !== 'string') return false;
        // If it starts with ./ or / or http or has an image extension, treat as URL
        return str.startsWith('./') || str.startsWith('/') || str.startsWith('http') ||
            /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(str);
    }

    _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this._handleInput();
            }
        });

        this.canvas.addEventListener('click', () => this._handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._handleInput();
        });
    }

    _setupResize() {
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const container = this.canvas.parentElement;
        const isLandscape = window.innerWidth > window.innerHeight;
        const isDesktop = window.innerWidth >= 768;

        let canvasWidth, canvasHeight;

        if (isLandscape && isDesktop) {
            canvasWidth = 800;
            canvasHeight = 450;
        } else {
            canvasWidth = 288;
            canvasHeight = 512;
        }

        const aspectRatio = canvasWidth / canvasHeight;
        let width = container.clientWidth;
        let height = container.clientHeight;

        if (isLandscape && isDesktop) {
            width = container.clientWidth;
            height = container.clientHeight;
        } else {
            if (width / height > aspectRatio) {
                width = height * aspectRatio;
            } else {
                height = width / aspectRatio;
            }
        }

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        if (this.state === GameState.INIT) {
            this.physics.init(this.canvas.width, this.canvas.height);
            this.pipeManager.init();
        }
    }

    _handleInput() {
        if (this.audioManager) {
            this.audioManager._ensureAudioContext();
        }

        if (this.state === GameState.INIT) {
            this.startGame();
        } else if (this.state === GameState.PLAYING) {
            this.physics.jump();
        }
    }

    setManagers(audioManager, assetManager, storageManager, uiController) {
        this.audioManager = audioManager;
        this.assetManager = assetManager;
        this.storageManager = storageManager;
        this.uiController = uiController;

        this.highScore = this.storageManager.getHighScore();
    }

    async loadAudio() {
        if (!this.audioManager) return;
        if (CONFIG.bgmAudio) {
            try {
                await this.audioManager.loadAudioFromUrl('bgm', CONFIG.bgmAudio);
            } catch (e) {
                console.warn('Failed to load BGM:', e);
            }
        }
        if (CONFIG.crashSound) {
            try {
                await this.audioManager.loadAudioFromUrl('crash', CONFIG.crashSound);
            } catch (e) {
                console.warn('Failed to load crash sound:', e);
            }
        }
    }

    start() {
        this.physics.init(this.canvas.width, this.canvas.height);
        this.pipeManager.init();
        this.state = GameState.INIT;
        this.score = 0;
        this.isCrashed = false;

        if (this.uiController) {
            this.uiController.showStartScreen();
        }

        // Draw initial frame
        this.render();
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.pipeSpawnTimer = 0;
        this.isCrashed = false;

        this.physics.reset(this.canvas.width, this.canvas.height);
        this.pipeManager.reset();

        this.pipeManager.spawn();

        if (this.uiController) {
            this.uiController.hideStartScreen();
            this.uiController.hideGameOverScreen();
            this.uiController.updateScore(0);
        }

        if (this.audioManager) {
            this.audioManager.playBgm();
        }

        if (!this.lastTime) {
            this.lastTime = performance.now();
        }

        this.animationFrameId = requestAnimationFrame(() => this._gameLoop());
    }

    _gameLoop() {
        if (this.state !== GameState.PLAYING) return;

        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;

        if (deltaTime > 100) {
            deltaTime = 16.67;
        }

        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this._gameLoop());
    }

    update(deltaTime) {
        this.physics.update(deltaTime);
        this.pipeManager.update(deltaTime);

        // Scroll background
        this.bgScrollX += 0.3 * (deltaTime / 16.67);

        this.pipeSpawnTimer += deltaTime;
        if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
            this.pipeSpawnTimer = 0;
            this.pipeManager.spawn();
        }

        const bird = this.physics.getBird();
        const birdHitbox = this.physics.getHitbox();

        if (this.collisionManager.checkGroundCollision(bird)) {
            this._gameOver();
            return;
        }

        if (this.collisionManager.checkPipeCollisions(birdHitbox, this.pipeManager.getPipes())) {
            this._gameOver();
            return;
        }

        if (this.pipeManager.checkPassed(bird.x + bird.width)) {
            this.score++;
            if (this.uiController) {
                this.uiController.updateScore(this.score);
            }
            if (this.audioManager) {
                this.audioManager.playScore();
            }
        }
    }

    render() {
        this._drawBackground();
        this._drawPipes();
        this._drawBrickBorders();
        this._drawBird();
    }

    // ===== BACKGROUND: Ruined City Skyline =====
    _drawBackground() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const borderH = 40;

        if (this.backgroundImg) {
            // Draw custom background image
            this.ctx.drawImage(this.backgroundImg, 0, 0, w, h);
            return;
        }

        // Sky gradient (warm, hazy, post-apocalyptic feel)
        const skyGrad = this.ctx.createLinearGradient(0, borderH, 0, h - borderH);
        skyGrad.addColorStop(0, CONFIG.skyTop);
        skyGrad.addColorStop(0.4, CONFIG.skyBottom);
        skyGrad.addColorStop(1, '#c97f5a');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, borderH, w, h - 2 * borderH);

        // Haze / dust particles
        this.ctx.fillStyle = 'rgba(255, 220, 180, 0.15)';
        for (let i = 0; i < 30; i++) {
            const px = ((i * 97 + this.bgScrollX * 0.5) % (w + 40)) - 20;
            const py = borderH + 20 + (i * 53) % (h - 2 * borderH - 40);
            const size = 2 + (i % 4);
            this.ctx.beginPath();
            this.ctx.arc(px, py, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Clouds
        this.ctx.fillStyle = CONFIG.cloudColor;
        this._drawCloud(30 - (this.bgScrollX * 0.2) % 350, borderH + 20, 50, 18);
        this._drawCloud(150 - (this.bgScrollX * 0.15) % 350, borderH + 40, 60, 20);
        this._drawCloud(240 - (this.bgScrollX * 0.25) % 350, borderH + 15, 40, 14);

        // Far buildings (darker, smaller — back layer)
        const groundY = h - borderH;
        this.ctx.globalAlpha = 0.4;
        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            const bx = ((b.x * 2 - this.bgScrollX * 0.3) % (w + 100)) - 50;
            this.ctx.fillStyle = b.color;
            const bh = b.height * 0.6;
            this.ctx.fillRect(bx, groundY - bh, b.width * 0.8, bh);
        }
        this.ctx.globalAlpha = 1.0;

        // Near buildings (larger — front layer)
        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            const bx = ((b.x * 1.5 - this.bgScrollX * 0.6) % (w + 100)) - 50;
            this.ctx.fillStyle = b.color;
            this.ctx.fillRect(bx, groundY - b.height, b.width, b.height);

            // Windows (tiny yellow dots)
            this.ctx.fillStyle = 'rgba(255, 200, 80, 0.6)';
            for (let wy = 0; wy < b.windows; wy++) {
                for (let wx = 0; wx < 2; wx++) {
                    const winX = bx + 3 + wx * (b.width / 2 - 2);
                    const winY = groundY - b.height + 6 + wy * 14;
                    if (winY < groundY - 4) {
                        this.ctx.fillRect(winX, winY, 3, 4);
                    }
                }
            }
        }

        // Ground rubble line
        this.ctx.fillStyle = '#5c3a28';
        this.ctx.fillRect(0, groundY - 4, w, 4);
    }

    _drawCloud(x, y, w, h) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x + w * 0.5, y - h * 0.3, w * 0.7, h * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x - w * 0.4, y + h * 0.1, w * 0.6, h * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // ===== BRICK WALL BORDERS (top + bottom) =====
    _drawBrickBorders() {
        const borderH = 40;
        this._drawBrickWall(0, 0, this.canvas.width, borderH);
        this._drawBrickWall(0, this.canvas.height - borderH, this.canvas.width, borderH);
    }

    _drawBrickWall(startX, startY, width, height) {
        const brickW = 20;
        const brickH = 10;
        const mortar = 1;

        // Mortar background
        this.ctx.fillStyle = CONFIG.brickMortar;
        this.ctx.fillRect(startX, startY, width, height);

        const rows = Math.ceil(height / (brickH + mortar));
        const cols = Math.ceil(width / (brickW + mortar)) + 1;

        for (let row = 0; row < rows; row++) {
            const offset = (row % 2 === 0) ? 0 : brickW / 2;
            for (let col = -1; col < cols; col++) {
                const bx = startX + col * (brickW + mortar) + offset;
                const by = startY + row * (brickH + mortar);

                // Brick body
                const shade = 0.85 + Math.random() * 0.3;
                this.ctx.fillStyle = this._shadeColor(CONFIG.brickColor, shade);
                this.ctx.fillRect(bx, by, brickW, brickH);

                // Highlight on top edge
                this.ctx.fillStyle = CONFIG.brickHighlight;
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillRect(bx, by, brickW, 2);
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Subtle border line
        this.ctx.fillStyle = '#1a0a04';
        if (startY === 0) {
            this.ctx.fillRect(startX, startY + height - 2, width, 2);
        } else {
            this.ctx.fillRect(startX, startY, width, 2);
        }
    }

    _shadeColor(hex, factor) {
        const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
        const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
        const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
        return `rgb(${r},${g},${b})`;
    }

    // ===== PIPES / OBSTACLES =====
    _drawPipes() {
        const pipes = this.pipeManager.getPipes();

        for (const pipe of pipes) {
            this._drawPipe(pipe.top, true);
            this._drawPipe(pipe.bottom, false);
        }
    }

    _drawPipe(pipeRect, isTop) {
        if (this.obstacleImg) {
            this._drawImagePipe(pipeRect, isTop);
            return;
        }

        const capHeight = 24;

        // Wooden / rustic pipe gradient
        const gradient = this.ctx.createLinearGradient(pipeRect.x, 0, pipeRect.x + pipeRect.width, 0);
        gradient.addColorStop(0, CONFIG.obstacleGradientStart);
        gradient.addColorStop(0.3, CONFIG.obstacleGradientMid);
        gradient.addColorStop(0.7, CONFIG.obstacleGradientMid);
        gradient.addColorStop(1, CONFIG.obstacleGradientEnd);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pipeRect.x, pipeRect.y, pipeRect.width, pipeRect.height);

        // Pipe cap
        this.ctx.fillStyle = CONFIG.obstacleCap;
        if (isTop) {
            this.ctx.fillRect(pipeRect.x - 3, pipeRect.y + pipeRect.height - capHeight, pipeRect.width + 6, capHeight);
        } else {
            this.ctx.fillRect(pipeRect.x - 3, pipeRect.y, pipeRect.width + 6, capHeight);
        }

        // Cap inner highlight
        this.ctx.fillStyle = CONFIG.obstacleCapInner;
        if (isTop) {
            this.ctx.fillRect(pipeRect.x + 2, pipeRect.y + pipeRect.height - capHeight + 4, pipeRect.width - 4, capHeight - 8);
        } else {
            this.ctx.fillRect(pipeRect.x + 2, pipeRect.y + 4, pipeRect.width - 4, capHeight - 8);
        }

        // Wood grain lines
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        for (let ly = pipeRect.y; ly < pipeRect.y + pipeRect.height; ly += 12) {
            this.ctx.beginPath();
            this.ctx.moveTo(pipeRect.x + 3, ly);
            this.ctx.lineTo(pipeRect.x + pipeRect.width - 3, ly);
            this.ctx.stroke();
        }
    }

    _drawImagePipe(pipeRect, isTop) {
        this.ctx.save();

        const img = this.obstacleImg;
        const imgRatio = img.width / img.height;
        const pipeRatio = pipeRect.width / pipeRect.height;

        let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

        if (imgRatio > pipeRatio) {
            // Image is wider than pipe, crop sides
            srcW = img.height * pipeRatio;
            srcX = (img.width - srcW) / 2;
        } else {
            // Image is taller than pipe, crop top/bottom
            srcH = img.width / pipeRatio;
            // For columns, usually we want to see the top (faces), so maybe crop bottom. Or center it.
            srcY = (img.height - srcH) / 2;
        }

        if (isTop) {
            // Draw inverted (flip vertically)
            this.ctx.translate(pipeRect.x + pipeRect.width / 2, pipeRect.y + pipeRect.height / 2);
            this.ctx.scale(1, -1);
            this.ctx.drawImage(
                img,
                srcX, srcY, srcW, srcH,
                -pipeRect.width / 2,
                -pipeRect.height / 2,
                pipeRect.width,
                pipeRect.height
            );
        } else {
            this.ctx.translate(pipeRect.x, pipeRect.y);
            this.ctx.drawImage(
                img,
                srcX, srcY, srcW, srcH,
                0, 0,
                pipeRect.width,
                pipeRect.height
            );
        }
        this.ctx.restore();
    }

    // ===== BIRD / CHARACTER =====
    _drawBird() {
        const bird = this.physics.getBird();
        const charImg = this.characterImg || (this.assetManager ? this.assetManager.getCharacter() : null);

        this.ctx.save();
        this.ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        this.ctx.rotate(bird.rotation);

        // If crashed, show crash face (image or emoji) regardless of character
        if (this.isCrashed) {
            this._drawCrashFace(bird.width);
        } else if (charImg) {
            this._drawCircularImage(charImg, bird.width);
        } else {
            this._drawDefaultBird();
        }

        this.ctx.restore();
    }

    _drawCrashFace(size) {
        if (this.crashFaceImg) {
            // Draw crash face image in a circle
            this._drawCircularImage(this.crashFaceImg, size);
        } else {
            // Draw crash face as emoji text
            this.ctx.font = `${size}px serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.crashFace, 0, 2);
        }
    }

    _drawCircularImage(img, size) {
        const radius = size / 2;

        // Clip to circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.clip();

        // Draw image filling the circle
        this.ctx.drawImage(img, -radius, -radius, size, size);

        // Border ring
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    _drawDefaultBird() {
        const w = 34;
        const h = 24;
        const radius = Math.min(w, h) / 2;

        // Circular yellow bird body
        const gradient = this.ctx.createRadialGradient(0, -2, 0, 0, 0, radius + 4);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.6, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // White border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Eye (white)
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(4, -3, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(5.5, -3, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Tiny highlight in eye
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(6.5, -4.5, 1, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(radius - 3, -1);
        this.ctx.lineTo(radius + 7, 1);
        this.ctx.lineTo(radius - 3, 4);
        this.ctx.closePath();
        this.ctx.fill();

        // Wing
        this.ctx.fillStyle = '#E69500';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 3, 7, 4, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _gameOver() {
        this.state = GameState.GAME_OVER;
        this.isCrashed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Pick a random crash face (emoji or image URL)
        const faces = CONFIG.crashFaces;
        this.crashFace = faces[Math.floor(Math.random() * faces.length)];

        // If it's an image URL, set the pre-loaded image
        if (this._isImageUrl(this.crashFace) && this.crashFaceImages[this.crashFace]) {
            this.crashFaceImg = this.crashFaceImages[this.crashFace];
        } else {
            this.crashFaceImg = null;
        }

        // Render one more frame with crash face
        this.render();

        // Screen shake
        this.canvas.classList.add('shake');
        setTimeout(() => this.canvas.classList.remove('shake'), 500);

        if (this.audioManager) {
            this.audioManager.playCrash();
            this.audioManager.fadeOutBgm();
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (this.storageManager) {
                this.storageManager.setHighScore(this.highScore);
            }
        }

        if (this.uiController) {
            this.uiController.showGameOverScreen(this.score, this.highScore, this.crashFace);
        }
    }

    restart() {
        this.isCrashed = false;
        this.crashFaceImg = null;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.uiController) {
            this.uiController.hideGameOverScreen();
        }

        this.state = GameState.PLAYING;
        this.score = 0;
        this.pipeSpawnTimer = 0;
        this.lastTime = 0;

        this.physics.reset(this.canvas.width, this.canvas.height);
        this.pipeManager.reset();
        this.pipeManager.spawn();

        if (this.uiController) {
            this.uiController.hideStartScreen();
            this.uiController.updateScore(0);
        }

        if (this.audioManager) {
            this.audioManager.playBgm();
        }

        this.animationFrameId = requestAnimationFrame(() => this._gameLoop());
    }
}
