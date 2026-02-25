export class PipeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.pipeWidth = 100;
        this.pipeGap = 110;
        this.pipeSpeed = 4.5;
        this.pipeSpacing = 120;
        this.borderHeight = 40;
        this.minGapY = 0;
        this.maxGapY = 0;
        this.pipes = [];
        this.pool = [];
        this.poolSize = 10;
        this.scoreCounted = [];
        this.lastGapY = 0;
    }

    init() {
        this.minGapY = this.borderHeight + 80;
        this.maxGapY = this.canvas.height - this.borderHeight - 80;
        
        const newPoolSize = Math.ceil(this.canvas.width / 200) + 5;
        if (newPoolSize > this.poolSize) {
            this.poolSize = newPoolSize;
        }
        
        this._initPool();
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

        let xPos;
        if (this.lastSpawnX === 0 || this.pipes.length === 0) {
            xPos = this.canvas.width + this.spawnDistance;
        } else {
            xPos = this.lastSpawnX + this.pipeSpacing;
        }
        
        const gapY = this.minGapY + (this.maxGapY - this.minGapY) * 0.5;
        this.lastGapY = gapY;
        this.lastSpawnX = xPos;

        pipe.top.x = xPos;
        pipe.top.y = this.borderHeight;
        pipe.top.height = gapY - this.pipeGap / 2 - this.borderHeight;

        pipe.bottom.x = xPos;
        pipe.bottom.y = gapY + this.pipeGap / 2;
        pipe.bottom.height = this.canvas.height - pipe.bottom.y - this.borderHeight;

        pipe.gapY = gapY;
        pipe.passed = false;

        this.pipes.push(pipe);
        this.scoreCounted.push(false);
    }

    spawnAt(x) {
        let pipe;

        if (this.pool.length > 0) {
            pipe = this.pool.pop();
        } else {
            pipe = this._createPipePair();
        }

        const gapY = this.minGapY + (this.maxGapY - this.minGapY) * 0.5;
        this.lastGapY = gapY;
        this.lastSpawnX = x;

        pipe.top.x = x;
        pipe.top.y = this.borderHeight;
        pipe.top.height = gapY - this.pipeGap / 2 - this.borderHeight;

        pipe.bottom.x = x;
        pipe.bottom.y = gapY + this.pipeGap / 2;
        pipe.bottom.height = this.canvas.height - pipe.bottom.y - this.borderHeight;

        pipe.gapY = gapY;
        pipe.passed = false;

        this.pipes.push(pipe);
        this.scoreCounted.push(false);
    }

    spawnNear(x) {
        this.spawnAt(x);
    }

    init() {
        this.minGapY = this.borderHeight + 80;
        this.maxGapY = this.canvas.height - this.borderHeight - 80;
        
        const newPoolSize = Math.ceil(this.canvas.width / 200) + 5;
        if (newPoolSize > this.poolSize) {
            this.poolSize = newPoolSize;
        }
        
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

        const xPos = this.canvas.width + 50;

        const availableHeight = this.maxGapY - this.minGapY;
        let gapY;
        
        if (this.lastGapY === 0) {
            gapY = this.minGapY + availableHeight * 0.5;
        } else {
            const minGap = this.minGapY;
            const maxGap = this.maxGapY;
            const maxShift = availableHeight;
            const shift = (Math.random() - 0.5) * maxShift;
            gapY = this.lastGapY + shift;
            gapY = Math.max(minGap, Math.min(maxGap, gapY));
        }
        
        this.lastGapY = gapY;

        pipe.top.x = xPos;
        pipe.top.y = this.borderHeight;
        pipe.top.height = gapY - this.pipeGap / 2 - this.borderHeight;

        pipe.bottom.x = xPos;
        pipe.bottom.y = gapY + this.pipeGap / 2;
        pipe.bottom.height = this.canvas.height - pipe.bottom.y - this.borderHeight;

        pipe.gapY = gapY;
        pipe.passed = false;

        this.pipes.push(pipe);
        this.scoreCounted.push(false);
    }

    spawnAt(x) {
        let pipe;

        if (this.pool.length > 0) {
            pipe = this.pool.pop();
        } else {
            pipe = this._createPipePair();
        }

        const availableHeight = this.maxGapY - this.minGapY;
        const gapY = this.minGapY + availableHeight * 0.5;
        this.lastGapY = gapY;

        pipe.top.x = x;
        pipe.top.y = this.borderHeight;
        pipe.top.height = gapY - this.pipeGap / 2 - this.borderHeight;

        pipe.bottom.x = x;
        pipe.bottom.y = gapY + this.pipeGap / 2;
        pipe.bottom.height = this.canvas.height - pipe.bottom.y - this.borderHeight;

        pipe.gapY = gapY;
        pipe.passed = false;

        this.pipes.push(pipe);
        this.scoreCounted.push(false);
    }

    spawnNear(x) {
        this.spawnAt(x);
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
        this.lastGapY = 0;
    }

    setDifficulty(speed, gap, spacing) {
        this.pipeSpeed = speed;
        this.pipeGap = gap;
        if (spacing) {
            this.pipeSpacing = spacing;
        }
    }
}
