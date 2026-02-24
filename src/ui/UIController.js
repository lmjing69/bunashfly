export class UIController {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.gameOverScreen = document.getElementById('game-over-screen');

        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.scoreDisplay = document.getElementById('score');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.highScoreDisplay = document.getElementById('high-score');
        this.crashFaceContainer = document.getElementById('crash-face-container');

        this.gameEngine = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.startBtn.addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.startGame();
            }
        });

        this.restartBtn.addEventListener('click', () => {
            this.hideGameOverScreen();
            if (this.gameEngine) {
                this.gameEngine.restart();
            }
        });
    }

    setGameEngine(engine) {
        this.gameEngine = engine;
    }

    setManagers(assetManager, audioManager) {
        // Kept for compatibility, no longer needs upload wiring
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
    }

    showHud() {
        this.hud.classList.remove('hidden');
    }

    hideHud() {
        this.hud.classList.add('hidden');
    }

    updateScore(score) {
        this.scoreDisplay.textContent = score;
    }

    showGameOverScreen(score, highScore, crashFace = '💀') {
        this.finalScoreDisplay.textContent = score;
        this.highScoreDisplay.textContent = highScore;

        // Show crash face
        if (this.crashFaceContainer) {
            if (crashFace.includes('/') || crashFace.includes('.')) {
                this.crashFaceContainer.innerHTML = `<img src="${crashFace}" class="crash-face-img" alt="Crash Face">`;
            } else {
                this.crashFaceContainer.textContent = crashFace;
            }
        }

        this.finalScoreDisplay.classList.add('pop');
        setTimeout(() => {
            this.finalScoreDisplay.classList.remove('pop');
        }, 300);

        this.gameOverScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
    }

    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }
}
