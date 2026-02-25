export class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gravity = 0.4;
        this.jumpForce = -7;
        this.maxVelocity = 9;
        this.borderHeight = 40;
        this.bird = {
            x: 0,
            y: 0,
            width: 45,
            height: 45,
            velocity: 0,
            rotation: 0
        };
        this.snake = {
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            speed: 3.5
        };
        this.rotationSpeed = 0.1;
        this.maxRotation = Math.PI / 4;
    }

    init(canvasWidth, canvasHeight) {
        this.bird.x = canvasWidth * 0.25;
        this.bird.y = canvasHeight * 0.45;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        
        this.snake.x = -80;
        this.snake.y = canvasHeight * 0.45;
    }

    jump() {
        this.bird.velocity = this.jumpForce;
    }

    update(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;

        this.bird.velocity += this.gravity * normalizedDelta;
        this.bird.velocity = Math.min(this.bird.velocity, this.maxVelocity);

        this.bird.y += this.bird.velocity * normalizedDelta;

        if (this.bird.velocity < 0) {
            this.bird.rotation = -this.maxRotation;
        } else if (this.bird.velocity > 0) {
            this.bird.rotation += this.rotationSpeed * normalizedDelta;
            this.bird.rotation = Math.min(this.bird.rotation, this.maxRotation);
        }

        this._clampBounds();
        this._updateSnake(deltaTime);
    }

    _updateSnake(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;
        
        const targetX = this.bird.x - 80;
        
        if (this.snake.x < targetX) {
            this.snake.x += this.snake.speed * normalizedDelta;
        }
        
        const targetY = this.bird.y + this.bird.height / 2 - this.snake.height / 2;
        const diff = targetY - this.snake.y;
        this.snake.y += diff * 0.03 * normalizedDelta;
        
        this.snake.y = Math.max(this.borderHeight + 10, Math.min(this.canvas.height - this.borderHeight - this.snake.height - 10, this.snake.y));
    }

    snakeAttack(bird) {
        this.snake.x = bird.x + bird.width / 2 - this.snake.width / 2;
        this.snake.y = bird.y + bird.height / 2 - this.snake.height / 2;
    }

    _clampBounds() {
        const topBound = this.borderHeight + 2;
        const bottomBound = this.canvas.height - this.borderHeight - this.bird.height;

        if (this.bird.y < topBound) {
            this.bird.y = topBound;
            this.bird.velocity = 0;
        }

        if (this.bird.y > bottomBound) {
            this.bird.y = bottomBound;
            this.bird.velocity = 0;
        }
    }

    getBird() {
        return this.bird;
    }

    getSnake() {
        return this.snake;
    }

    getHitbox() {
        const padding = 6;
        return {
            x: this.bird.x + padding,
            y: this.bird.y + padding,
            width: this.bird.width - padding * 2,
            height: this.bird.height - padding * 2
        };
    }

    getSnakeHitbox() {
        return {
            x: this.snake.x + 5,
            y: this.snake.y + 5,
            width: this.snake.width - 10,
            height: this.snake.height - 10
        };
    }

    isAtGround() {
        return this.bird.y >= this.canvas.height - this.borderHeight - this.bird.height;
    }

    isAtCeiling() {
        return this.bird.y <= this.borderHeight + 2;
    }

    reset(canvasWidth, canvasHeight) {
        this.init(canvasWidth, canvasHeight);
    }
}
