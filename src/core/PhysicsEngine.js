export class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gravity = 0.3;       // Slower gravity — easy/medium difficulty
        this.jumpForce = -6;      // Softer jump
        this.maxVelocity = 8;     // Slower max fall speed
        this.borderHeight = 40;   // Brick wall border height
        this.bird = {
            x: 0,
            y: 0,
            width: 60,
            height: 60, // Larger size for player uploaded images
            velocity: 0,
            rotation: 0
        };
        this.rotationSpeed = 0.08;
        this.maxRotation = Math.PI / 6; // Less extreme tilt
    }

    init(canvasWidth, canvasHeight) {
        this.bird.x = canvasWidth * 0.4;
        this.bird.y = canvasHeight * 0.2; // Start higher up (20% from top)
        this.bird.velocity = 0;
        this.bird.rotation = 0;
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

    getHitbox() {
        const padding = 6;
        return {
            x: this.bird.x + padding,
            y: this.bird.y + padding,
            width: this.bird.width - padding * 2,
            height: this.bird.height - padding * 2
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
