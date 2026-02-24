export class PipeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pipeWidth = 52;
        this.pipeGap = 140;
        this.pipeSpeed = 2.5;
        this.spawnDistance = 200;
        this.borderHeight = 40;
        this.minGapY = 0;
        this.maxGapY = 0;
        this.pipes = [];
        this.pool = [];
        this.poolSize = 10;
        this.scoreCounted = [];
    }

    init() {
        this.minGapY = this.borderHeight + 60;
        this.maxGapY = this.canvas.height - this.borderHeight - 60;
        this._initPool();
    }

    _initPool() {
        this.pool = [];
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(this._createPipePair());
        }
    }

    _createPipePair() {
        return {
            top: { x: 0, y: 0, width: this.pipeWidth, height: 0 },
            bottom: { x: 0, y: 0, width: this.pipeWidth, height: 0 },
            gapY: 0,
            passed: false
        };
    }

    spawn() {
        let pipe;

        if (this.pool.length > 0) {
            pipe = this.pool.pop();
        } else {
            pipe = this._createPipePair();
        }

        const gapY = this.minGapY + Math.random() * (this.maxGapY - this.minGapY);

        pipe.top.x = this.canvas.width + this.spawnDistance;
        pipe.top.y = this.borderHeight;
        pipe.top.height = gapY - this.pipeGap / 2 - this.borderHeight;

        pipe.bottom.x = this.canvas.width + this.spawnDistance;
        pipe.bottom.y = gapY + this.pipeGap / 2;
        pipe.bottom.height = this.canvas.height - pipe.bottom.y - this.borderHeight;

        pipe.gapY = gapY;
        pipe.passed = false;

        this.pipes.push(pipe);
        this.scoreCounted.push(false);
    }

    update(deltaTime) {
        const normalizedDelta = deltaTime / 16.67;

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];

            pipe.top.x -= this.pipeSpeed * normalizedDelta;
            pipe.bottom.x -= this.pipeSpeed * normalizedDelta;

            if (pipe.top.x + pipe.top.width < 0) {
                this.pool.push(this.pipes.splice(i, 1)[0]);
                this.scoreCounted.splice(i, 1);
            }
        }
    }

    getPipes() {
        return this.pipes;
    }

    getTopPipeRect(pipe) {
        return {
            x: pipe.top.x,
            y: pipe.top.y,
            width: pipe.top.width,
            height: pipe.top.height
        };
    }

    getBottomPipeRect(pipe) {
        return {
            x: pipe.bottom.x,
            y: pipe.bottom.y,
            width: pipe.bottom.width,
            height: pipe.bottom.height
        };
    }

    checkPassed(birdX) {
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            if (!pipe.passed && birdX > pipe.top.x + pipe.top.width) {
                pipe.passed = true;
                return true;
            }
        }
        return false;
    }

    reset() {
        this.pipes = [];
        this.scoreCounted = [];
    }

    setDifficulty(speed, gap) {
        this.pipeSpeed = speed;
        this.pipeGap = gap;
    }
}
