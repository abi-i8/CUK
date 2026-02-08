
class CarGame {
    constructor() {
        this.canvas = document.getElementById('driving-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.video = document.getElementById('drive-webcam-feed');
        this.startBtn = document.getElementById('start-driving-game');
        this.overlay = document.getElementById('drive-start-overlay');
        this.hud = document.getElementById('drive-hud');
        this.guide = document.getElementById('steering-guide');
        this.wheelIcon = document.querySelector('.wheel-icon');

        this.isActive = false;
        this.playerX = 0.5; // 0 (left) to 1 (right)
        this.speed = 0;
        this.targetSpeed = 120;
        this.distance = 0;

        this.roadLineOffset = 0;
        this.obstacles = [];
        this.lastObstacleTime = 0;

        // Webcam Control Vars
        this.prevFrame = null;
        this.steeringIntensity = 0; // -1 (left) to 1 (right)

        this.init();
    }

    init() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }

        window.addEventListener('resize', () => {
            if (this.isActive) this.onResize();
        });
    }

    onResize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;

            this.video.onloadedmetadata = () => {
                this.overlay.classList.add('hidden');
                this.hud.classList.remove('hidden');
                this.guide.classList.remove('hidden');

                this.isActive = true;
                this.onResize();

                // Processing canvas for motion
                this.procCanvas = document.createElement('canvas');
                this.procCtx = this.procCanvas.getContext('2d');
                this.procCanvas.width = 80;
                this.procCanvas.height = 60;

                this.gameLoop();
            };
        } catch (err) {
            alert("Camera needed for steering!");
        }
    }

    detectSteering() {
        if (!this.video.videoWidth) return;

        this.procCtx.drawImage(this.video, 0, 0, this.procCanvas.width, this.procCanvas.height);
        const frame = this.procCtx.getImageData(0, 0, this.procCanvas.width, this.procCanvas.height);
        const data = frame.data;

        let leftMotion = 0;
        let rightMotion = 0;

        if (this.prevFrame) {
            for (let i = 0; i < data.length; i += 4) {
                const diff = Math.abs(data[i] - this.prevFrame[i]) +
                    Math.abs(data[i + 1] - this.prevFrame[i + 1]) +
                    Math.abs(data[i + 2] - this.prevFrame[i + 2]);

                if (diff > 60) {
                    const x = (i / 4) % this.procCanvas.width;
                    if (x < this.procCanvas.width / 2) {
                        rightMotion++; // Mirrored: left side of video is right side of player
                    } else {
                        leftMotion++;
                    }
                }
            }
        }

        this.prevFrame = new Uint8ClampedArray(data);

        // Update Steering Intensity
        // We want a balance. If leftMotion > rightMotion, turn left.
        const sensitivity = 50;
        let turn = 0;
        if (Math.abs(leftMotion - rightMotion) > sensitivity) {
            turn = (leftMotion - rightMotion) / 500;
        }

        this.steeringIntensity += (turn - this.steeringIntensity) * 0.1;
        this.steeringIntensity = Math.max(-1, Math.min(1, this.steeringIntensity));

        // Tilt wheel icon
        if (this.wheelIcon) {
            this.wheelIcon.style.transform = `rotate(${this.steeringIntensity * 90}deg)`;
        }
    }

    update() {
        this.detectSteering();

        // Update Player Pos
        this.playerX += this.steeringIntensity * 0.02;
        this.playerX = Math.max(0.2, Math.min(0.8, this.playerX));

        // Speed/Distance
        this.speed += (this.targetSpeed - this.speed) * 0.01;
        this.distance += this.speed / 60;

        // Road Animation
        this.roadLineOffset = (this.distance % 100) / 100;

        // Obstacles
        if (Date.now() - this.lastObstacleTime > 2000) {
            this.obstacles.push({
                x: 0.3 + Math.random() * 0.4,
                y: 0,
                speed: 0.5 + Math.random() * 0.5
            });
            this.lastObstacleTime = Date.now();
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let o = this.obstacles[i];
            o.y += 0.01;

            // Collision
            if (o.y > 0.8 && o.y < 0.95) {
                if (Math.abs(o.x - this.playerX) < 0.1) {
                    this.speed *= 0.5; // Crash penalty
                }
            }

            if (o.y > 1) this.obstacles.splice(i, 1);
        }

        // HUD
        document.getElementById('drive-speed').textContent = Math.floor(this.speed);
        document.getElementById('drive-dist').textContent = Math.floor(this.distance);
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // Draw Road (Pseudo 3D)
        const horizon = h * 0.4;

        // Grass
        this.ctx.fillStyle = '#0a2a0a';
        this.ctx.fillRect(0, horizon, w, h - horizon);

        // Road surface
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.45, horizon);
        this.ctx.lineTo(w * 0.55, horizon);
        this.ctx.lineTo(w * 0.9, h);
        this.ctx.lineTo(w * 0.1, h);
        this.ctx.fill();

        // Road Lines
        this.ctx.strokeStyle = '#fff';
        this.ctx.setLineDash([20, 20]);
        this.ctx.lineDashOffset = -this.roadLineOffset * 40;
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.5, horizon);
        this.ctx.lineTo(w * 0.5, h);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw Obstacles
        this.obstacles.forEach(o => {
            const scale = o.y;
            const ox = w * (0.5 + (o.x - 0.5) * scale * 4);
            const oy = horizon + (h - horizon) * o.y;

            this.ctx.fillStyle = '#dc2743';
            this.ctx.fillRect(ox - 20 * scale, oy - 15 * scale, 40 * scale, 30 * scale);
        });

        // Draw Player Car
        const px = w * (0.5 + (this.playerX - 0.5) * 0.9 * 4);
        const py = h * 0.85;

        // Simple car shape
        this.ctx.fillStyle = '#ffd700';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffd700';
        this.ctx.fillRect(px - 40, py - 20, 80, 50);
        // Windshield
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(px - 35, py - 10, 70, 15);
        this.ctx.shadowBlur = 0;
    }

    gameLoop() {
        if (!this.isActive) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.CarGame = CarGame;
