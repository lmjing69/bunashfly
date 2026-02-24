import { GameEngine } from './src/core/GameEngine.js';
import { AudioManager } from './src/managers/AudioManager.js';
import { AssetManager } from './src/managers/AssetManager.js';
import { StorageManager } from './src/managers/StorageManager.js';
import { UIController } from './src/ui/UIController.js';

class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('game-canvas');

        this.storageManager = new StorageManager();
        this.audioManager = new AudioManager();
        this.assetManager = new AssetManager();

        this.uiController = new UIController();

        this.gameEngine = new GameEngine(this.canvas);

        this._init();
    }

    async _init() {
        this.uiController.setGameEngine(this.gameEngine);
        this.uiController.setManagers(this.assetManager, this.audioManager);

        await this.audioManager.init();

        this.gameEngine.setManagers(
            this.audioManager,
            this.assetManager,
            this.storageManager,
            this.uiController
        );

        await this.gameEngine.loadAudio();

        this.gameEngine.start();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlappyBird();
});
