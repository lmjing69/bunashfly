const STORAGE_KEY = 'flappybird_highscore';

export class StorageManager {
    constructor() {
        this._storageAvailable = this._checkStorageAvailability();
    }

    _checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    getHighScore() {
        if (!this._storageAvailable) return 0;
        try {
            const score = localStorage.getItem(STORAGE_KEY);
            return score ? parseInt(score, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    setHighScore(score) {
        if (!this._storageAvailable) return;
        try {
            const current = this.getHighScore();
            if (score > current) {
                localStorage.setItem(STORAGE_KEY, score.toString());
            }
        } catch (e) {
        }
    }
}
