export class AssetManager {
    constructor() {
        this.customCharacter = null;
        this.characterUrl = null;
        this.customObstacle = null;
        this.obstacleUrl = null;
        this.customBackground = null;
        this.backgroundUrl = null;
    }

    loadCustomCharacter(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                reject(new Error('Invalid file type. Use PNG, JPG, or WEBP'));
                return;
            }

            if (this.characterUrl) {
                URL.revokeObjectURL(this.characterUrl);
            }

            this.characterUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                this.customCharacter = img;
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(this.characterUrl);
                this.characterUrl = null;
                reject(new Error('Failed to load image'));
            };
            
            img.src = this.characterUrl;
        });
    }

    loadCustomObstacle(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                reject(new Error('Invalid file type. Use PNG, JPG, or WEBP'));
                return;
            }

            if (this.obstacleUrl) {
                URL.revokeObjectURL(this.obstacleUrl);
            }

            this.obstacleUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                this.customObstacle = img;
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(this.obstacleUrl);
                this.obstacleUrl = null;
                reject(new Error('Failed to load image'));
            };
            
            img.src = this.obstacleUrl;
        });
    }

    loadCustomBackground(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                reject(new Error('Invalid file type. Use PNG, JPG, or WEBP'));
                return;
            }

            if (this.backgroundUrl) {
                URL.revokeObjectURL(this.backgroundUrl);
            }

            this.backgroundUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                this.customBackground = img;
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(this.backgroundUrl);
                this.backgroundUrl = null;
                reject(new Error('Failed to load image'));
            };
            
            img.src = this.backgroundUrl;
        });
    }

    getCharacter() {
        return this.customCharacter;
    }

    getObstacle() {
        return this.customObstacle;
    }

    getBackground() {
        return this.customBackground;
    }

    hasCustomCharacter() {
        return this.customCharacter !== null;
    }

    hasCustomObstacle() {
        return this.customObstacle !== null;
    }

    hasCustomBackground() {
        return this.customBackground !== null;
    }
}
