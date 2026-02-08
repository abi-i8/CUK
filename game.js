
// Basic Hand/Face Tracking Logic (Simplified Motion Detection)
// We will use "Motion Detection" via pixel differencing to control a player paddle/cursor.
// Avoids heavy libraries like TensorFlow.js for performance, but creates a fun interactive effect.

class MotionGame {
    constructor() {
        this.video = document.getElementById('webcam-feed');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('start-webcam-game');
        this.overlay = document.getElementById('game-start-overlay');
        this.uiLayer = document.getElementById('game-ui-layer');
        this.scoreEl = document.getElementById('game-score');

        this.isActive = false;
        this.score = 0;
        this.playerX = 0; // 0 to 1 (screen width ratio)

        // Motion Detection Vars
        this.prevFrame = null;
        this.motionThreshold = 20;

        // Game Objects
        this.targets = [];
        this.lastSpawn = 0;

        this.init();
    }

    init() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }

        // Handle Resize
        window.addEventListener('resize', () => {
            if (this.isActive) {
                this.canvas.width = this.canvas.offsetWidth;
                this.canvas.height = this.canvas.offsetHeight;
            }
        });
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;

            // Wait for video to load
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.overlay.classList.add('hidden');
                this.uiLayer.classList.remove('hidden');
                this.video.classList.remove('hidden');

                this.isActive = true;
                this.canvas.width = this.canvas.offsetWidth;
                this.canvas.height = this.canvas.offsetHeight;

                // Initialize hidden canvas for motion processing
                this.procCanvas = document.createElement('canvas');
                this.procCtx = this.procCanvas.getContext('2d');
                this.procCanvas.width = 100; // Low res for performance
                this.procCanvas.height = 100 * (this.video.videoHeight / this.video.videoWidth);

                this.gameLoop();
            };
        } catch (err) {
            console.error("Camera denied:", err);
            alert("Camera access is required to play. Please allow access.");
        }
    }

    detectMotion() {
        // Draw video frame to small canvas
        this.procCtx.drawImage(this.video, 0, 0, this.procCanvas.width, this.procCanvas.height);
        const frame = this.procCtx.getImageData(0, 0, this.procCanvas.width, this.procCanvas.height);
        const data = frame.data;

        let motionXSum = 0;
        let motionCount = 0;

        if (this.prevFrame) {
            for (let i = 0; i < data.length; i += 4) {
                // Simple RGB difference
                const rDiff = Math.abs(data[i] - this.prevFrame[i]);
                const gDiff = Math.abs(data[i + 1] - this.prevFrame[i + 1]);
                const bDiff = Math.abs(data[i + 2] - this.prevFrame[i + 2]);

                if (rDiff + gDiff + bDiff > this.motionThreshold * 3) {
                    const x = (i / 4) % this.procCanvas.width;
                    motionXSum += x;
                    motionCount++;
                }
            }
        }

        // Store current frame for next loop
        this.prevFrame = new Uint8ClampedArray(data);

        // Calculate average motion X position
        if (motionCount > 10) {
            const avgMotionX = motionXSum / motionCount;
            // Smooth transition
            const targetX = 1 - (avgMotionX / this.procCanvas.width); // Mirror Flip
            this.playerX += (targetX - this.playerX) * 0.1;
        }
    }

    spawnTarget() {
        const type = Math.random() > 0.8 ? 'bonus' : 'normal';
        this.targets.push({
            x: Math.random() * this.canvas.width,
            y: -50,
            size: type === 'bonus' ? 20 : 30,
            speed: type === 'bonus' ? 7 : 4,
            type: type,
            color: type === 'bonus' ? '#ffd700' : '#dc2743'
        });
    }

    updateGame() {
        // Clear Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Player "Cursor"
        const pX = this.playerX * this.canvas.width;
        const pY = this.canvas.height - 50;

        // Draw high-tech cursor
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(pX, pY, 40, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner dot
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(pX, pY, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Spawn logic
        if (Date.now() - this.lastSpawn > 1000) {
            this.spawnTarget();
            this.lastSpawn = Date.now();
        }

        // Update Targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            let t = this.targets[i];
            t.y += t.speed;

            // Draw Target
            this.ctx.fillStyle = t.color;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = t.color;

            // Collision Detection
            const dx = t.x - pX;
            const dy = t.y - pY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 40 + t.size) {
                // Hit!
                this.score += (t.type === 'bonus' ? 50 : 10);
                this.scoreEl.textContent = this.score;
                this.targets.splice(i, 1);

                // Visual pop effect (simple circle)
                this.ctx.strokeStyle = t.color;
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(pX, pY, 60, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (t.y > this.canvas.height) {
                this.targets.splice(i, 1);
                // Lose life? (Optional)
            }
        }

        // Reset Shadow
        this.ctx.shadowBlur = 0;
    }

    gameLoop() {
        if (!this.isActive) return;

        this.detectMotion();
        this.updateGame();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize on Load
// We need to export or make strictly global if needed, but for now just run it.
window.MotionGame = MotionGame;
