export class CollisionManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.borderHeight = 40; // Brick wall border height
    }

    checkCollision(birdHitbox, pipe) {
        const topRect = {
            x: pipe.top.x,
            y: pipe.top.y,
            width: pipe.top.width,
            height: pipe.top.height
        };

        const bottomRect = {
            x: pipe.bottom.x,
            y: pipe.bottom.y,
            width: pipe.bottom.width,
            height: pipe.bottom.height
        };

        if (this._checkAABB(birdHitbox, topRect)) {
            return true;
        }

        if (this._checkAABB(birdHitbox, bottomRect)) {
            return true;
        }

        return false;
    }

    _checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    checkGroundCollision(bird) {
        const birdBottom = bird.y + bird.height;
        return birdBottom >= this.canvas.height - this.borderHeight;
    }

    checkCeilingCollision(bird) {
        return bird.y <= this.borderHeight;
    }

    checkPipeCollisions(birdHitbox, pipes) {
        for (const pipe of pipes) {
            if (this.checkCollision(birdHitbox, pipe)) {
                return true;
            }
        }
        return false;
    }
}
