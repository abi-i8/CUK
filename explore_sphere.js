
class MemorySphere {
    constructor() {
        this.canvas = document.getElementById('memory-sphere-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connectionDistance = 150;
        this.radius = 250; // Sphere radius
        this.rotation = { x: 0, y: 0 };
        this.targetRotation = { x: 0.002, y: 0.002 }; // Auto-spin
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Tags/Words to display on nodes
        this.tags = ["Tourism", "Management", "Travel", "Culture", "Heritage", "Events", "Explore", "Connect", "Learn", "Grow", "Future", "MBA", "CUK", "India", "Global"];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create 3D Nodes
        for (let i = 0; i < 40; i++) {
            this.nodes.push(this.createNode(i));
        }

        // Interaction
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        window.addEventListener('mousemove', (e) => this.drag(e));
        window.addEventListener('mouseup', () => this.endDrag());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        window.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
        window.addEventListener('touchend', () => this.endDrag());

        this.animate();
    }

    createNode(index) {
        // Fibonacci Sphere Algorithm for even distribution
        const phi = Math.acos(-1 + (2 * index) / 40);
        const theta = Math.sqrt(40 * Math.PI) * phi;

        return {
            x: this.radius * Math.cos(theta) * Math.sin(phi),
            y: this.radius * Math.sin(theta) * Math.sin(phi),
            z: this.radius * Math.cos(phi),
            tag: this.tags[index % this.tags.length],
            color: Math.random() > 0.8 ? '#ffd700' : '#ffffff',
            size: Math.random() * 3 + 2
        };
    }

    resize() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.offsetWidth;
            this.canvas.height = this.canvas.parentElement.offsetHeight;
            this.cx = this.canvas.width / 2;
            this.cy = this.canvas.height / 2;
        }
    }

    rotate(angleX, angleY) {
        const sinX = Math.sin(angleX);
        const cosX = Math.cos(angleX);
        const sinY = Math.sin(angleY);
        const cosY = Math.cos(angleY);

        this.nodes.forEach(node => {
            // Rotation Y
            const x1 = node.x * cosY - node.z * sinY;
            const z1 = node.z * cosY + node.x * sinY;

            // Rotation X
            const y1 = node.y * cosX - z1 * sinX;
            const z2 = z1 * cosX + node.y * sinX;

            node.x = x1;
            node.y = y1;
            node.z = z2;
        });
    }

    startDrag(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.targetRotation = { x: 0, y: 0 }; // Stop auto-spin on interact
    }

    drag(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;

        this.rotation.y = dx * 0.005;
        this.rotation.x = -dy * 0.005;

        this.rotate(this.rotation.x, this.rotation.y);

        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    endDrag() {
        this.isDragging = false;
        // Resume slow spin with inertia could be added here
        this.targetRotation = { x: this.rotation.x * 0.95, y: this.rotation.y * 0.95 }; // Decay

        // Reset to default auto-spin if stopped
        setTimeout(() => {
            if (!this.isDragging) this.targetRotation = { x: 0.002, y: 0.002 };
        }, 2000);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Auto Rotation
        if (!this.isDragging) {
            this.rotate(this.targetRotation.x, this.targetRotation.y);
        }

        // Draw Connections (Background)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Z-Sort for "3D" effect (draw back nodes first)
        this.nodes.sort((a, b) => a.z - b.z);

        // Draw Lines
        // Optimization: Only neighbor checks if needed? Or just basic all-masks
        // Simple distance check
        for (let i = 0; i < this.nodes.length; i++) {
            const n1 = this.nodes[i];
            // Small optimization: only check forward
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n2 = this.nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const dz = n1.z - n2.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 100) {
                    const alpha = 1 - (dist / 100);
                    // Depth fade
                    const depthAlpha = (n1.z + this.radius) / (this.radius * 2);

                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15 * depthAlpha})`;
                    this.ctx.beginPath();
                    // Perspective project
                    const scale1 = 400 / (400 - n1.z); // FOV
                    const scale2 = 400 / (400 - n2.z);

                    this.ctx.moveTo(this.cx + n1.x * scale1, this.cy + n1.y * scale1);
                    this.ctx.lineTo(this.cx + n2.x * scale2, this.cy + n2.y * scale2);
                    this.ctx.stroke();
                }
            }
        }

        // Draw Nodes & Text
        this.nodes.forEach(node => {
            const scale = 400 / (400 - node.z);
            const x2d = this.cx + node.x * scale;
            const y2d = this.cy + node.y * scale;
            const alpha = (node.z + this.radius) / (this.radius * 2); // 0 to 1 based on depth

            // Draw Dot
            this.ctx.fillStyle = node.color;
            this.ctx.globalAlpha = Math.max(0.1, alpha); // Fade out back nodes
            this.ctx.beginPath();
            this.ctx.arc(x2d, y2d, node.size * scale, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw Tag (only if front-facing)
            if (node.z > -50) {
                this.ctx.font = `${10 * scale}px Inter`;
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(node.tag, x2d, y2d - 10 * scale);
            }
        });

        this.ctx.globalAlpha = 1; // Reset

        requestAnimationFrame(() => this.animate());
    }
}

// Init
window.MemorySphere = MemorySphere;
