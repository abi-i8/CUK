document.addEventListener('DOMContentLoaded', () => {

    // --- Particle System ---
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');

    let particlesArray;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Mouse interaction
    let mouse = {
        x: null,
        y: null,
        radius: 100
    }

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    // Touch Support for Particles
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x, y) {
            this.x = x != null ? x : Math.random() * canvas.width;
            this.y = y != null ? y : Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.1; // Small particles
            this.speedX = Math.random() * 3 - 1.5; // Slightly faster burst
            this.speedY = Math.random() * 3 - 1.5;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse Interaction (Repel)
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * this.density;
                    const directionY = forceDirectionY * force * this.density;
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }

            // Wrap around screen
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Add Burst on Click
    window.addEventListener('click', (e) => {
        // Avoid spawning if clicking modal (simple check if modal is visible/target is in modal)
        // But user asked for click on background.
        // Let's spawn particles.
        for (let i = 0; i < 5; i++) {
            particlesArray.push(new Particle(e.x, e.y));
        }
        // Remove oldest if too many to keep performance
        if (particlesArray.length > 300) {
            particlesArray.splice(0, 5);
        }
    });

    // --- Particle System Optimization ---
    // Reduce particle count significantly for mobile/low-end devices
    function initParticles() {
        particlesArray = [];
        // Lower density: Divide by 15000 instead of 9000
        const densityDivisor = (window.innerWidth < 768) ? 20000 : 12000;
        const numberOfParticles = (canvas.width * canvas.height) / densityDivisor;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    // Check if particles are close enough to draw line
    // OPTIMIZED: Only check nearest neighbors or skip frames? 
    // Frame skipping is easier.
    function connect() {
        let opacityValue = 1;
        // Optimization: Reduce nested loop checks by limiting distance check quickly
        const maxDist = (canvas.width / 7) * (canvas.height / 7);

        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                // Quick bounding box check could go here, but JS math is fast enough if count is low.
                // Limiting count is the best optimization.

                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                    + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

                if (distance < maxDist && distance < 9000) {
                    opacityValue = 1 - (distance / 10000);
                    ctx.strokeStyle = 'rgba(255, 255, 255,' + (opacityValue * 0.2) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Frame Throttling Variables
    let lastTime = 0;
    const fpsInterval = 1000 / 40; // Limit to 40 FPS for background effects (saves GPU/CPU)

    function animateParticles(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;

        if (elapsed > fpsInterval) {
            lastTime = timestamp - (elapsed % fpsInterval);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            connect();
        }
        requestAnimationFrame(animateParticles);
    }

    // Resize handling
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
        initGlobes();
    });

    initParticles();
    animateParticles();
    // -----------------------

    // --- Bouncing Background Globes ---
    const globes = document.querySelectorAll('.globe');
    const globeData = [];

    function initGlobes() {
        globeData.length = 0;
        globes.forEach((globe, index) => {
            const size = globe.offsetWidth;
            // Force Separation: Globe 0 (Top-Left), Globe 1 (Bottom-Right)
            // Or just ensure they aren't in same quadrant
            let startX, startY;

            if (index === 0) {
                // Top-Left Quadrant
                startX = Math.random() * (window.innerWidth / 2 - size);
                startY = Math.random() * (window.innerHeight / 2 - size);
            } else {
                // Bottom-Right Quadrant
                startX = (window.innerWidth / 2) + Math.random() * (window.innerWidth / 2 - size);
                startY = (window.innerHeight / 2) + Math.random() * (window.innerHeight / 2 - size);
            }

            // Allow overlapping edges slightly for "visual" bounce
            // Safe fallback if logic creates NaN
            if (isNaN(startX)) startX = 0;
            if (isNaN(startY)) startY = 0;

            globeData.push({
                el: globe,
                x: startX,
                y: startY,
                vx: (Math.random() * 1.5 + 1) * (Math.random() < 0.5 ? 1 : -1),
                vy: (Math.random() * 1.5 + 1) * (Math.random() < 0.5 ? 1 : -1),
                size: size,
                halfSize: size / 2 // Cache for boundary check
            });
        });
    }

    function animateGlobes() {
        globeData.forEach(g => {
            g.x += g.vx;
            g.y += g.vy;

            // Updated Boundary Checks: Bounce when CENTER hits the edge
            // Center X = g.x + g.halfSize
            // Hit Left: Center < 0 -> g.x < -g.halfSize
            // Hit Right: Center > Width -> g.x > Width - g.halfSize

            const minX = -g.halfSize;
            const maxX = window.innerWidth - g.halfSize;
            const minY = -g.halfSize;
            const maxY = window.innerHeight - g.halfSize;

            if (g.x < minX) {
                g.x = minX;
                g.vx *= -1;
            } else if (g.x > maxX) {
                g.x = maxX;
                g.vx *= -1;
            }

            if (g.y < minY) {
                g.y = minY;
                g.vy *= -1;
            } else if (g.y > maxY) {
                g.y = maxY;
                g.vy *= -1;
            }

            g.el.style.transform = `translate(${g.x}px, ${g.y}px)`;
        });
        requestAnimationFrame(animateGlobes);
    }

    initGlobes();
    animateGlobes();
    // -----------------------

    // --- Animated Counter for Instagram Stats ---
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16); // 60fps
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + '+';
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Trigger counter animation on page load
    const counters = document.querySelectorAll('.count[data-target]');

    // Use Intersection Observer to trigger when visible
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
    // -----------------------

    // --- Populate Hero Grid ---
    function initHeroGrid() {
        const gridItems = document.querySelectorAll('.mock-img');
        // Wait until mainMedia is available (it's defined later, so we run this after load)
        setTimeout(() => {
            // Pick random images from mainMedia (defined at bottom)
            // If mainMedia isn't ready, use a fallback list or wait
            // Better to move this call to the bottom or use the array directly if it was hoisted (variables aren't).
            // But variables declared with const are not hoisted.
            // We can search mainMedia in the array list.

            // To be safe, we'll manually list a few proxied images here for the hero header
            const heroImages = [
                "Proxy/Highlights/Main/IMG_2588_proxy.jpg",
                "Proxy/Highlights/Main/IMG_7691_proxy.jpg",
                "Proxy/Highlights/Main/_A7_2665_proxy.JPG"
            ];

            gridItems.forEach((item, index) => {
                if (heroImages[index]) {
                    // Preload image to check for 404
                    const img = new Image();
                    img.onload = () => {
                        item.style.backgroundImage = `url('${heroImages[index]}')`;
                        item.style.backgroundSize = 'cover';
                        item.style.backgroundPosition = 'center';
                    };
                    img.onerror = () => {
                        console.error('Hero Grid Image Failed:', heroImages[index]);
                        item.style.background = '#333';
                        item.innerHTML = '<div style="color:white;font-size:10px;text-align:center;padding-top:40%">Image<br>Error</div>';
                    };
                    img.src = heroImages[index];
                }
            });
        }, 100);
    }
    initHeroGrid();

    // --- Back to Top Button ---
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top-btn';
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', () => {
        const activeSection = document.querySelector('.content-section.active');
        const modal = document.getElementById('memory-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden');

        const isValidSection = activeSection && (activeSection.id === 'section-2' || activeSection.id === 'timeline');

        if (window.scrollY > 300 && isValidSection && !isModalOpen) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    // --------------------------

    // ---------------------------------------------------------
    // ---------------------------------------------------------
    //  TIMELINE CONFIGURATION
    //  (This section is updated automatically by Update-Memories.ps1)
    // ---------------------------------------------------------
    const timelineData = [
        // AUTO-GENERATED-START
        ...[
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/1. The Beginning - 04 SEP 2023/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/1. The Beginning - 04 SEP 2023/2_proxy.jpg"
                },
                "displayTitle": "The Beginning",
                "folder": "1. The Beginning - 04 SEP 2023",
                "desc": "",
                "date": "04 SEP 2023",
                "title": "The Beginning",
                "media": ["1.jpg", "2.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/10. Convocation - 11 NOV 2025/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/10. Convocation - 11 NOV 2025/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/10. Convocation - 11 NOV 2025/3_proxy.jpg"
                },
                "displayTitle": "Convocation",
                "folder": "10. Convocation - 11 NOV 2025",
                "desc": "",
                "date": "11 NOV 2025",
                "title": "Convocation",
                "media": ["1.jpg", "2.jpg", "3.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/3_proxy.jpg",
                    "4.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/4_proxy.jpg",
                    "5.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/5_proxy.jpg",
                    "6.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/6_proxy.jpg",
                    "7.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/7_proxy.jpg",
                    "8.JPG": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/8_proxy.JPG",
                    "9.jpg": "Proxy/Events/2. Freshers Day - OCT 2023 - INTROX 23/9_proxy.jpg"
                },
                "displayTitle": "Freshers Day",
                "folder": "2. Freshers Day - OCT 2023 - INTROX 23",
                "desc": "INTROX 23",
                "date": "OCT 2023",
                "title": "Freshers Day",
                "media": ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.JPG", "9.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/3. Kerala Piravi - NOV 2023/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/3. Kerala Piravi - NOV 2023/2_proxy.jpg",
                    "3.JPG": "Proxy/Events/3. Kerala Piravi - NOV 2023/3_proxy.JPG"
                },
                "displayTitle": "Kerala Piravi",
                "folder": "3. Kerala Piravi - NOV 2023",
                "desc": "",
                "date": "NOV 2023",
                "title": "Kerala Piravi",
                "media": ["1.jpg", "2.jpg", "3.JPG"]
            },
            {
                "proxies": {
                    "1.mp4": "Proxy/Events/4. Destination Visit I - DEC 2023/1_proxy.mp4",
                    "2.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/3_proxy.jpg",
                    "4.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/4_proxy.JPG",
                    "5.mp4": "Proxy/Events/4. Destination Visit I - DEC 2023/5_proxy.mp4",
                    "6.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/6_proxy.jpg",
                    "7.mp4": "Proxy/Events/4. Destination Visit I - DEC 2023/7_proxy.mp4",
                    "8.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/8_proxy.jpg",
                    "9.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/9_proxy.jpg",
                    "10.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/10_proxy.JPG",
                    "11.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/11_proxy.JPG",
                    "12.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/12_proxy.JPG",
                    "13.mp4": "Proxy/Events/4. Destination Visit I - DEC 2023/13_proxy.mp4",
                    "14.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/14_proxy.JPG",
                    "15.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/15_proxy.jpg",
                    "16.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/16_proxy.jpg",
                    "17.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/17_proxy.jpg",
                    "18.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/18_proxy.jpg",
                    "19.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/19_proxy.JPG",
                    "20.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/20_proxy.jpg",
                    "21.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/21_proxy.JPG",
                    "22.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/22_proxy.JPG",
                    "23.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/23_proxy.jpg",
                    "24.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/24_proxy.jpg",
                    "25.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/25_proxy.JPG",
                    "26.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/26_proxy.JPG",
                    "27.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/27_proxy.JPG",
                    "28.mp4": "Proxy/Events/4. Destination Visit I - DEC 2023/28_proxy.mp4",
                    "29.JPG": "Proxy/Events/4. Destination Visit I - DEC 2023/29_proxy.JPG",
                    "30.jpeg": "Proxy/Events/4. Destination Visit I - DEC 2023/30_proxy.jpeg",
                    "31.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/31_proxy.jpg",
                    "32.jpg": "Proxy/Events/4. Destination Visit I - DEC 2023/32_proxy.jpg"
                },
                "displayTitle": "Destination Visit I",
                "folder": "4. Destination Visit I - DEC 2023",
                "desc": "",
                "date": "DEC 2023",
                "title": "Destination Visit I",
                "media": ["1.mp4", "2.jpg", "3.jpg", "4.JPG", "5.mp4", "6.jpg", "7.mp4", "8.jpg", "9.jpg", "10.JPG", "11.JPG", "12.JPG", "13.mp4", "14.JPG", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.JPG", "20.jpg", "21.JPG", "22.JPG", "23.jpg", "24.jpg", "25.JPG", "26.JPG", "27.JPG", "28.mp4", "29.JPG", "30.jpeg", "31.jpg", "32.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/5. Onam - SEP 2024/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/5. Onam - SEP 2024/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/5. Onam - SEP 2024/3_proxy.jpg",
                    "4.jpg": "Proxy/Events/5. Onam - SEP 2024/4_proxy.jpg",
                    "5.JPG": "Proxy/Events/5. Onam - SEP 2024/5_proxy.JPG",
                    "6.JPG": "Proxy/Events/5. Onam - SEP 2024/6_proxy.JPG",
                    "7.JPG": "Proxy/Events/5. Onam - SEP 2024/7_proxy.JPG",
                    "8.JPG": "Proxy/Events/5. Onam - SEP 2024/8_proxy.JPG"
                },
                "displayTitle": "Onam",
                "folder": "5. Onam - SEP 2024",
                "desc": "",
                "date": "SEP 2024",
                "title": "Onam",
                "media": ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.JPG", "6.JPG", "7.JPG", "8.JPG"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/6. The Big Day - 04 SEP 2024 - IYKYK/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/6. The Big Day - 04 SEP 2024 - IYKYK/2_proxy.jpg"
                },
                "displayTitle": "The Big Day",
                "folder": "6. The Big Day - 04 SEP 2024 - IYKYK",
                "desc": "IYKYK",
                "date": "04 SEP 2024",
                "title": "The Big Day",
                "media": ["1.jpg", "2.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/7. Trip - OCT 2024/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/7. Trip - OCT 2024/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/7. Trip - OCT 2024/3_proxy.jpg",
                    "4.jpg": "Proxy/Events/7. Trip - OCT 2024/4_proxy.jpg",
                    "5.jpg": "Proxy/Events/7. Trip - OCT 2024/5_proxy.jpg",
                    "6.jpg": "Proxy/Events/7. Trip - OCT 2024/6_proxy.jpg"
                },
                "displayTitle": "Trip",
                "folder": "7. Trip - OCT 2024",
                "desc": "",
                "date": "OCT 2024",
                "title": "Trip",
                "media": ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"]
            },
            {
                "proxies": {
                    "1.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/1_proxy.jpg",
                    "2.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/2_proxy.jpg",
                    "3.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/3_proxy.jpg",
                    "4.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/4_proxy.jpg",
                    "5.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/5_proxy.jpg",
                    "6.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/6_proxy.jpg",
                    "7.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/7_proxy.JPG",
                    "8.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/8_proxy.JPG",
                    "9.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/9_proxy.jpg",
                    "10.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/10_proxy.jpg",
                    "11.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/11_proxy.jpg",
                    "12.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/12_proxy.jpg",
                    "13.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/13_proxy.JPG",
                    "14.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/14_proxy.jpg",
                    "15.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/15_proxy.jpg",
                    "16.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/16_proxy.JPG",
                    "17.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/17_proxy.jpg",
                    "18.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/18_proxy.jpg",
                    "19.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/19_proxy.jpg",
                    "20.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/20_proxy.jpg",
                    "21.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/21_proxy.JPG",
                    "22.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/22_proxy.JPG",
                    "23.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/23_proxy.JPG",
                    "24.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/24_proxy.jpg",
                    "25.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/25_proxy.jpg",
                    "26.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/26_proxy.jpg",
                    "27.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/27_proxy.jpg",
                    "28.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/28_proxy.jpg",
                    "29.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/29_proxy.jpg",
                    "30.JPG": "Proxy/Events/8. Destination Visit II - NOV 2024/30_proxy.JPG",
                    "31.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/31_proxy.jpg",
                    "32.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/32_proxy.jpg",
                    "33.jpg": "Proxy/Events/8. Destination Visit II - NOV 2024/33_proxy.jpg"
                },
                "displayTitle": "Destination Visit II",
                "folder": "8. Destination Visit II - NOV 2024",
                "desc": "",
                "date": "NOV 2024",
                "title": "Destination Visit II",
                "media": ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.JPG", "8.JPG", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.JPG", "14.jpg", "15.jpg", "16.JPG", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.JPG", "22.JPG", "23.JPG", "24.jpg", "25.jpg", "26.jpg", "27.jpg", "28.jpg", "29.jpg", "30.JPG", "31.jpg", "32.jpg", "33.jpg"]
            },
            {
                "proxies": {
                    "1.JPG": "Proxy/Events/9. Farewell - 26 APR 2025/1_proxy.JPG",
                    "2.JPG": "Proxy/Events/9. Farewell - 26 APR 2025/2_proxy.JPG",
                    "3.JPG": "Proxy/Events/9. Farewell - 26 APR 2025/3_proxy.JPG",
                    "4.JPG": "Proxy/Events/9. Farewell - 26 APR 2025/4_proxy.JPG",
                    "5.JPG": "Proxy/Events/9. Farewell - 26 APR 2025/5_proxy.JPG",
                    "6.jpg": "Proxy/Events/9. Farewell - 26 APR 2025/6_proxy.jpg",
                    "7.jpg": "Proxy/Events/9. Farewell - 26 APR 2025/7_proxy.jpg"
                },
                "displayTitle": "Farewell",
                "folder": "9. Farewell - 26 APR 2025",
                "desc": "",
                "date": "26 APR 2025",
                "title": "Farewell",
                "media": ["1.JPG", "2.JPG", "3.JPG", "4.JPG", "5.JPG", "6.jpg", "7.jpg"]
            }
        ]
        // AUTO-GENERATED-END
    ];

    // --- LOGIC (Do not edit below unless needed) ---

    function getMediaList(folder, itemConfig) {
        // If 'media' array is provided, use it (allows videos/custom names)
        if (itemConfig.media) {
            return itemConfig.media.map(file => {
                const original = `Orginal/Events/${folder}/${file}`;
                const proxyFile = itemConfig.proxies ? itemConfig.proxies[file] : null;
                const proxy = proxyFile ? proxyFile : original;
                return { original, proxy };
            });

        }
        // Otherwise use 'count' for 1.jpg, 2.jpg...
        const files = [];
        for (let i = 1; i <= (itemConfig.count || 0); i++) {
            files.push(`Orginal/Events/${folder}/${i}.jpg`);
        }
        return files;
    }

    function generateMemories(data) {
        // 1. Sort folders by number (1. Folder, 2. Folder)
        data.sort((a, b) => {
            const numA = parseInt(a.folder.match(/^\d+/) || 999);
            const numB = parseInt(b.folder.match(/^\d+/) || 999);
            return numA - numB;
        });

        // 2. Process into memory objects
        return data.map((item, index) => {
            const mediaList = getMediaList(item.folder, item);
            return {
                id: index,
                title: item.displayTitle || item.title || item.folder.replace(/^\d+\.\s*/, ''),
                date: item.date,
                media: mediaList,
                cover: mediaList[0] ? mediaList[0].proxy : '',
                desc: item.desc
            };
        });
    }

    const memories = generateMemories(timelineData);

    const timelineContainer = document.getElementById('timeline');
    const modal = document.getElementById('memory-modal');
    const closeModal = document.querySelector('.close-modal');
    const navTabs = document.querySelectorAll('.nav-tab');
    const navIndicator = document.querySelector('.nav-indicator');

    // Section Switching & Liquid Indicator
    function updateNavIndicator(activeTab) {
        if (!navIndicator) return;
        const rect = activeTab.getBoundingClientRect();
        const parentRect = activeTab.parentElement.getBoundingClientRect();

        navIndicator.style.width = `${rect.width}px`;
        navIndicator.style.left = `${rect.left - parentRect.left}px`;

        // Make visible after positioning to prevent initial glitch
        navIndicator.style.opacity = '1';
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            navTabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');

            // Move indicator
            updateNavIndicator(tab);

            // Handle section switching
            const targetId = tab.getAttribute('data-target');

            // RESET TUNNEL STATE ON EXIT
            // If we are leaving section-2 (or clicking any other tab), wipe the state.
            if (targetId !== 'section-2') {
                resetTunnelState();
            }

            document.querySelectorAll('.content-section').forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                    section.classList.add('active');
                    // Trigger re-render or re-observe if needed? 
                    // Render is already done, just invisible.
                } else {
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            });

            // Trigger scroll check for Back to Top button visibility
            window.dispatchEvent(new Event('scroll'));
        });
    });

    // Initialize indicator on load
    window.addEventListener('load', () => {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) updateNavIndicator(activeTab);
    });

    // Also update on resize to keep aligned
    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) updateNavIndicator(activeTab);
    });

    // Function to render memories
    function renderMemories() {
        timelineContainer.innerHTML = '';
        const filteredMemories = memories;

        filteredMemories.forEach(memory => {
            const item = document.createElement('div');
            item.classList.add('timeline-item');

            let mediaContent = '';

            // Generate HTML for each media item
            const generateMediaHTML = (mediaItem, index) => {
                if (!mediaItem) return '';
                const src = mediaItem.proxy; // Use proxy for timeline
                const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.mov');
                const visibilityClass = index === 0 ? 'visible' : '';
                if (isVideo) {
                    return `<video src="${src}" class="gallery-item ${visibilityClass}" muted loop playsinline autoplay></video>`;
                } else {
                    return `<img src="${src}" class="gallery-item ${visibilityClass}" alt="${memory.title}" loading="lazy">`;
                }
            };

            if (memory.media && memory.media.length > 0) {
                // Stacked Slideshow
                const itemsHTML = memory.media.map((item, idx) => generateMediaHTML(item, idx)).join('');
                mediaContent = `<div class="slideshow-container" id="slideshow-${memory.id}">${itemsHTML}</div>`;
            } else if (memory.cover) {
                // Single Item
                const dummyItem = { proxy: memory.cover };
                mediaContent = `<div class="slideshow-container">
                                    ${generateMediaHTML(dummyItem, 0)}
                                </div>`;
            } else {
                mediaContent = `<div class="error-msg">No Media Found</div>`;
            }

            item.innerHTML = `
                <div class="timeline-content">
                    <div class="memory-card" data-id="${memory.id}">
                        ${mediaContent}
                        <div class="card-details">
                            <span class="card-date">${memory.date}</span>
                            <h3 class="card-title">${memory.title}</h3>
                        </div>
                    </div>
                </div>
            `;
            timelineContainer.appendChild(item);
        });

        observeItems();
        addCardListeners();
        startSlideshows();
        updateHeroPreview();
    }

    function startSlideshows() {
        document.querySelectorAll('.slideshow-container').forEach(container => {
            const items = container.querySelectorAll('.gallery-item');
            if (items.length > 1) {
                let index = 0;
                setInterval(() => {
                    const prevItem = items[index];
                    if (prevItem.tagName === 'VIDEO') prevItem.pause();

                    prevItem.classList.remove('visible');
                    index = (index + 1) % items.length;

                    const nextItem = items[index];
                    nextItem.classList.add('visible');

                    // Play only if the card itself is on-screen
                    if (nextItem.tagName === 'VIDEO' && container.closest('.timeline-item').classList.contains('visible')) {
                        nextItem.play().catch(() => { });
                    }
                }, 5000); // 5s Fade Interval
            }
        });
    }

    function updateHeroPreview() {
        const mockImgs = document.querySelectorAll('.mock-img');
        let imgCount = 0;

        // Flatten all media from all memories to find first 3 images
        for (const memory of memories) {
            if (memory.media) {
                for (const mediaItem of memory.media) {
                    if (imgCount >= 3) break;
                    const src = mediaItem.proxy;
                    // Skip videos for preview
                    if (!src.toLowerCase().endsWith('.mp4') && !src.toLowerCase().endsWith('.mov')) {
                        mockImgs[imgCount].style.backgroundImage = `url('${src}')`;
                        imgCount++;
                    }
                }
            }
            if (imgCount >= 3) break;
        }
    }

    // Intersection Observer for Scroll Animation
    function observeItems() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const videos = entry.target.querySelectorAll('video');
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Find active slide video and play it
                    const activeVideo = entry.target.querySelector('video.visible');
                    if (activeVideo) activeVideo.play().catch(() => { });
                } else {
                    // entry.target.classList.remove('visible'); // Optional: keep fade in? User likes it.
                    // Pause videos when not visible to save resources
                    videos.forEach(v => v.pause());
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });
    }

    // --- Modal / Carousel Logic ---
    function openModal(memory, initialIndex = 0) {
        const contentContainer = document.getElementById('gallery-content');
        const container = document.getElementById('modal-media-container');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');

        // Prepare Media List - Use Proxies for modal!
        let sourceList = (memory.media && memory.media.length > 0)
            ? memory.media.map(m => m.proxy)
            : [memory.cover];
        sourceList = sourceList.filter(item => item); // Filter existing

        // Optimization for Symmetry: If only 2 items, duplicate them to [A, B, A, B]
        // This ensures the 3D tunnel always has a left and right preview, avoiding "empty sides".
        if (sourceList.length === 2) {
            sourceList = [...sourceList, ...sourceList];
        }

        if (sourceList.length === 0) {
            contentContainer.innerHTML = '<div style="color:white;text-align:center;">No media available</div>';
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            contentContainer.innerHTML = ''; // Clear previous

            // Generate Carousel Elements
            const mediaElements = sourceList.map(src => {
                const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.mov');
                let el;
                if (isVideo) {
                    el = document.createElement('video');
                    el.src = src;
                    el.controls = true;
                    el.muted = true;
                    el.playsInline = true;
                    el.autoplay = true; // Added autoplay for modal too
                } else {
                    el = document.createElement('img');
                    el.src = src;
                    el.onerror = () => {
                        el.style.display = 'none';
                        const err = document.createElement('div');
                        err.innerHTML = `âš ï¸ Image not found:<br><small>${src}</small>`;
                        err.style.color = 'red';
                        err.style.textAlign = 'center';
                        contentContainer.appendChild(err);
                    };
                }
                el.className = 'modal-media-item';
                contentContainer.appendChild(el);
                return el;
            });

            // Carousel State
            let currentIndex = initialIndex;

            const updateCarousel = () => {
                const total = mediaElements.length;
                mediaElements.forEach((el, index) => {
                    el.className = 'modal-media-item'; // Reset

                    if (index === currentIndex) {
                        el.classList.add('active');
                        if (el.tagName === 'VIDEO') el.play().catch(() => { });
                    } else {
                        if (el.tagName === 'VIDEO') el.pause();

                        // Circular indexing for visual preview classes
                        const prevIdx = (currentIndex - 1 + total) % total;
                        const nextIdx = (currentIndex + 1) % total;

                        if (index === prevIdx) el.classList.add('prev');
                        else if (index === nextIdx) el.classList.add('next');
                        else el.classList.add('hidden-slide');
                    }
                });

                // Buttons always visible in loop mode
                prevBtn.style.opacity = '1';
                prevBtn.style.pointerEvents = 'auto';
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            };

            // Button Listeners
            const newPrev = prevBtn.cloneNode(true);
            const newNext = nextBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrev, prevBtn);
            nextBtn.parentNode.replaceChild(newNext, nextBtn);

            newPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex - 1 + mediaElements.length) % mediaElements.length;
                updateCarousel();
            });

            newNext.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex + 1) % mediaElements.length;
                updateCarousel();
            });

            // Keyboard Nav support
            document.onkeydown = (e) => {
                if (!modal.classList.contains('hidden')) {
                    if (e.key === 'ArrowLeft') {
                        currentIndex = (currentIndex - 1 + mediaElements.length) % mediaElements.length;
                        updateCarousel();
                    } else if (e.key === 'ArrowRight') {
                        currentIndex = (currentIndex + 1) % mediaElements.length;
                        updateCarousel();
                    } else if (e.key === 'Escape') {
                        closeModal.click();
                    }
                }
            };

            // Initial State
            updateCarousel();
        }

        // Set Text
        document.getElementById('modal-title').innerText = memory.title;
        document.getElementById('modal-desc').innerText = memory.desc || '';
        document.getElementById('modal-date').innerText = memory.date;

        // Show Modal
        const modal = document.getElementById('memory-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('visible'), 10);
        window.dispatchEvent(new Event('scroll'));
    }

    // Modal Interactions
    function addCardListeners() {
        document.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const memory = memories.find(m => m.id == id);
                if (memory) {
                    // Find which item is currently visible in the card's slideshow
                    const visibleItem = card.querySelector('.gallery-item.visible');
                    let idx = 0;
                    if (visibleItem) {
                        const allItems = Array.from(card.querySelectorAll('.gallery-item'));
                        idx = allItems.indexOf(visibleItem);
                    }
                    openModal(memory, idx);
                }
            });
        });
    }

    // Close Modal
    closeModal.addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
            window.dispatchEvent(new Event('scroll'));
        }, 300);
        // Pause any playing videos
        document.querySelectorAll('video').forEach(v => v.pause());
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.classList.add('hidden');
                window.dispatchEvent(new Event('scroll'));
            }, 300);
            document.querySelectorAll('video').forEach(v => v.pause());
        }
    });

    // --- Main Tunnel Logic ---
    const mainMedia = [
        // MAIN-GENERATED-START
        ...[
            "Proxy/Highlights/Main/IMG-20240222-WA0003_proxy.jpg",
            "Proxy/Highlights/Main/IMG_2588_proxy.jpg",
            "Proxy/Highlights/Main/IMG_2610_proxy.jpg",
            "Proxy/Highlights/Main/IMG_5794_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7691_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7692_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7695_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7697_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7717_proxy.jpg",
            "Proxy/Highlights/Main/IMG_7874_proxy.jpg",
            "Proxy/Highlights/Main/_A7_2665_proxy.JPG",
            "Proxy/Highlights/Main/_A7_2686_proxy.JPG",
            "Proxy/Highlights/Main/_A7_2688_proxy.JPG",
            "Proxy/Highlights/Main/_A7_5281_proxy.jpg",
            "Proxy/Highlights/Main/_MG_0821_proxy.jpg"
        ]
        // MAIN-GENERATED-END
    ];

    const secretMedia = [
        // SECRET-GENERATED-START
        ...[
            "Proxy/Highlights/Secret/IMG20230918125004_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20230927132701_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20230927132741_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20230927133122_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20231009225944_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20231120160511_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20231120162341_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20231221151104_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20231221165641_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20240105135711_proxy.jpg",
            "Proxy/Highlights/Secret/IMG20240227154634_proxy.jpg",
            "Proxy/Highlights/Secret/IMG_20240209_180815_proxy.jpg",
            "Proxy/Highlights/Secret/IMG_20240214_141835_proxy.jpg",
            "Proxy/Highlights/Secret/IMG_9048_proxy.JPG",
            "Proxy/Highlights/Secret/IMG_9067_proxy.JPG",
            "Proxy/Highlights/Secret/VID-20230930-WA0061_proxy.mp4",
            "Proxy/Highlights/Secret/VID20230916172844~2_proxy.mp4",
            "Proxy/Highlights/Secret/VID20231009215857_proxy.mp4",
            "Proxy/Highlights/Secret/VID20231115150956~2_proxy.mp4",
            "Proxy/Highlights/Secret/VID20231201135643~2_proxy.mp4",
            "Proxy/Highlights/Secret/video_20240214_151129_proxy.mp4",
            "Proxy/Highlights/Secret/VN20240228_233049_proxy.mp4"
        ]
        // SECRET-GENERATED-END
    ];


    let currentZ = 0;
    let maxScroll = 0;
    let isInterventionMode = false;
    let autoScrollZ = 0;
    let lastInterventionTime = 0;
    let isSecretMode = false; // Track if in Secret Tunnel

    // Relative Progress Tracking
    let forwardScrollStart = 0; // Z position when user started scrolling forward
    let forwardScrollDistance = 0; // Total distance scrolled forward from start
    let isScrollingForward = false; // Direction tracking
    const TOTAL_MEDIA_DEPTH = mainMedia.length * 800; // Total depth to cover all media

    // --- Shuffle Utility ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Randomize initial media order
    shuffleArray(mainMedia);
    shuffleArray(secretMedia);

    function initMainTunnel() {
        const tunnel = document.getElementById('main-tunnel');
        if (!tunnel) return;

        tunnel.innerHTML = '';

        // Add depth indicator
        const indicator = document.createElement('div');
        indicator.className = 'tunnel-depth-indicator';
        indicator.innerText = 'Scroll to explore';
        tunnel.parentNode.appendChild(indicator);

        mainMedia.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'tunnel-item';

            // Position in 3D - Added starting offset of -800
            const z = (index * -800) - 800;
            // Spread out randomly in X/Y to form a hollow tunnel
            const angle = Math.random() * Math.PI * 2;
            const radius = 250 + Math.random() * 200;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            item.style.transform = "translate(-50%, -50%) translate3d(" + x + "px, " + y + "px, " + z + "px)";
            item.setAttribute('data-z', z);
            item.setAttribute('data-x', x);
            item.setAttribute('data-y', y);

            const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.mov');
            let mediaEl;

            if (isVideo) {
                mediaEl = document.createElement('video');
                mediaEl.src = src;
                mediaEl.muted = true;
                mediaEl.autoplay = true;
                mediaEl.loop = true;
                mediaEl.playsInline = true;
            } else {
                mediaEl = document.createElement('img');
                mediaEl.src = src;
                mediaEl.loading = 'lazy';
                mediaEl.onerror = () => {
                    console.error('Tunnel Media Failed:', src);
                    item.innerHTML = '<div style="color:white;font-size:12px;text-align:center;">Media Not Found<br>' + src.split('/').pop() + '</div>';
                    item.style.border = '1px solid red';
                };
            }

            item.appendChild(mediaEl);
            tunnel.appendChild(item);
        });

        // maxScroll account for start offset and immediate exit
        maxScroll = (mainMedia.length - 1) * 800 + 1600;

        window.updateTunnel = (scrollZ, forceContainer = null) => {
            const hTunnel = document.getElementById('main-tunnel');
            const sTunnel = document.getElementById('secret-tunnel');

            let activeTunnel;
            if (forceContainer) {
                activeTunnel = forceContainer;
            } else {
                activeTunnel = isSecretMode ? sTunnel : hTunnel;
            }

            if (!activeTunnel) return;
            const items = activeTunnel.querySelectorAll('.tunnel-item');

            const totalItems = items.length;
            const itemSpacing = 800;
            const totalDepth = totalItems * itemSpacing;
            const fov = 800;

            items.forEach(item => {
                const baseZ = parseFloat(item.getAttribute('data-z'));
                const x = item.getAttribute('data-x');
                const y = item.getAttribute('data-y');

                let newZ = baseZ + scrollZ;

                // TRULY INFINITE CIRCULAR VISUALS
                if (totalDepth > 0) {
                    const centerOffset = 800;
                    newZ = ((newZ - centerOffset) % totalDepth);
                    if (newZ > 0) newZ -= totalDepth;
                    newZ += centerOffset;
                }

                // UNIFIED OPACITY & ZOOM
                let opacity = 1;
                if (newZ > 800) {
                    opacity = 0; // Behind camera
                } else if (newZ > 0) {
                    opacity = 1 - (newZ / 800); // Fade out as it passes camera
                } else {
                    // Fade into distance (Standardized to 6000px)
                    opacity = 1 - (Math.abs(newZ) / 6000);
                }

                if (opacity <= 0) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'block';
                    item.style.opacity = opacity;
                    item.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${newZ}px)`;
                    item.style.pointerEvents = (newZ > -200 && newZ < 200) ? 'auto' : 'none';
                }
            });
        };

        // Initial State Calculation
        updateTunnel(0);

        // Initial Render Depth Calculation
        window.renderTunnel = updateTunnel;





        // Auto-Scroll Animation Loop
        let lastAutoTime = performance.now();
        const animateAutoScroll = (time) => {
            const dt = time - lastAutoTime;
            lastAutoTime = time;

            // AUTO-RESUME CHECK: 0.25 seconds of silence
            if (isInterventionMode && (Date.now() - lastInterventionTime > 250)) {
                // ALWAYS Resume for both (Infinite forward auto-scroll)
                isInterventionMode = false;
                autoScrollZ = currentZ;
            }

            if (!isInterventionMode) {
                // Auto-scroll speed (Consistent for both)
                autoScrollZ += (dt * 0.1);



                window.updateTunnel(autoScrollZ);
            }
            requestAnimationFrame(animateAutoScroll);
        };
        requestAnimationFrame(animateAutoScroll);

        // --- UNIFIED SCROLL HANDLER (Mouse, Trackpad, Touch) ---
        function handleScrollInput(deltaY) {
            // Check if we are in the active section
            const tunnelWrapper = document.getElementById('main-tunnel-wrapper');
            if (!tunnelWrapper || !tunnelWrapper.closest('.content-section').classList.contains('active')) return false;

            // IS AT BOTTOM CHECK (Only needed if NOT already in tunnel)
            const isAtBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 10);
            const isInTunnel = (currentZ > 0) || isInterventionMode;

            // STRICT SEPARATION:
            // 1. If NOT at bottom AND NOT in tunnel -> Allow Page Scroll (Do nothing)
            // 2. If AT bottom OR Already In Tunnel -> Lock Page, Scroll Tunnel (return true to preventDefault)

            if (!isAtBottom && !isInTunnel) {
                return false;
            }

            // Exit Condition: If at start of tunnel and scrolling UP (negative delta)
            if (currentZ <= 0 && deltaY < 0) {
                // Allow page to scroll up naturally
                isInterventionMode = false;
                forwardScrollDistance = 0;
                return false;
            }

            // ENGAGE TUNNEL MODE
            // If we are here, we are either at bottom scrolling down, or locked in tunnel.
            lastInterventionTime = Date.now();

            if (!isInterventionMode) {
                isInterventionMode = true;
                currentZ = Math.max(0, autoScrollZ); // Sync
                forwardScrollStart = currentZ; // Fixed: Set start point ONCE
            }

            // SCROLL LOGIC
            if (deltaY > 0) {
                // Scrolling Down (Forward)
                if (!isScrollingForward) {
                    isScrollingForward = true;
                    // Removed reset of forwardScrollStart to allow accumulation
                }

                // Trackpad Sensitivity Boost: Small deltas (< 20) get a multiplier
                // This helps trackpads reach the threshold faster
                let effectiveDelta = deltaY;
                if (deltaY < 20) effectiveDelta *= 4.5; // Increased sensitivity

                currentZ += effectiveDelta * 4.0;
                forwardScrollDistance = currentZ - forwardScrollStart;

                // Security Protocol Trigger Logic
                const TRANSITION_ZONE = 2000;
                const transitionStart = TOTAL_MEDIA_DEPTH - TRANSITION_ZONE;
                const isSecurityActive = !document.getElementById('security-trigger-container').classList.contains('hidden');

                if (forwardScrollDistance >= transitionStart && !securityState.passwordAccepted) {
                    const tunnel = document.getElementById('main-tunnel');

                    if (forwardScrollDistance < TOTAL_MEDIA_DEPTH && !isSecurityActive) {
                        // Fade Step - ONLY if security is NOT yet active
                        const fadeProgress = Math.min(1, (forwardScrollDistance - transitionStart) / TRANSITION_ZONE);
                        if (tunnel) tunnel.style.opacity = (1 - fadeProgress * 0.7).toString();
                    } else {
                        // Trigger Step
                        if (tunnel) tunnel.style.opacity = '0';

                        showSecurityTrigger();

                        // Pass momentum to security scroll
                        const scrollLimit = SECURITY_CONFIG.HOLD_SCROLL;
                        securityState.targetScroll = Math.min(scrollLimit, securityState.targetScroll + effectiveDelta);

                        if (!securityState.isAnimating) {
                            securityState.isAnimating = true;
                            requestAnimationFrame(processSecurityAutoScroll);
                        }
                    }
                }

            } else {
                // Scrolling Up (Backward)
                if (isScrollingForward) isScrollingForward = false;

                const isSecurityActive = !document.getElementById('security-trigger-container').classList.contains('hidden');

                if (isSecurityActive && !securityState.passwordAccepted) {
                    // Security Retreat
                    const limit = SECURITY_CONFIG.LOGO_SCROLL;
                    securityState.targetScroll = Math.max(limit, securityState.targetScroll + deltaY);

                    if (!securityState.isAnimating) {
                        securityState.isAnimating = true;
                        requestAnimationFrame(processSecurityAutoScroll);
                    }
                } else {
                    // Normal Retreat
                    currentZ += deltaY * 4.0;
                    if (currentZ < 0) currentZ = 0; // Clamp start
                }
            }

            if (isInterventionMode) {
                window.updateTunnel(currentZ);
            }

            return true; // Input Handled
        }

        // Mouse Wheel Listener
        window.addEventListener('wheel', (e) => {
            if (handleScrollInput(e.deltaY)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Touch Listeners
        let touchStartY = 0;
        let lastTouchY = 0;
        let isTouchActive = false;

        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            lastTouchY = touchStartY;
            isTouchActive = true;
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isTouchActive) return;

            const currentY = e.touches[0].clientY;
            const diff = lastTouchY - currentY; // Drag up = Positive Delta (Forward)
            lastTouchY = currentY;

            // Touch Sensitivity Multiplier (Touch drags are often smaller pixels than wheel)
            const touchMultiplier = 3.0;

            if (handleScrollInput(diff * touchMultiplier)) {
                e.preventDefault(); // Stop Pull-to-Refresh / Native Scroll
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            isTouchActive = false;
        });
    }

    // Initial Render

    // --- Dynamic Instagram Grid (Hero Section) ---
    function initInstaGrid() {
        const mockImgs = document.querySelectorAll('.mock-img');
        if (mockImgs.length === 0) return;

        // Use mainMedia as the pool
        const pool = mainMedia;
        if (pool.length === 0) return;

        let available = [...pool];

        function rotateGrid() {
            // Shuffle to get unique random selection
            for (let i = available.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [available[i], available[j]] = [available[j], available[i]];
            }

            const selection = available.slice(0, Math.min(mockImgs.length, available.length));

            mockImgs.forEach((img, idx) => {
                if (selection[idx]) {
                    // Staggered update for a more dynamic feel
                    setTimeout(() => {
                        img.style.backgroundImage = 'url(\'' + selection[idx] + '\')';
                    }, idx * 150);
                }
            });
        }

        rotateGrid();
        setInterval(rotateGrid, 5000);
    }

    renderMemories();
    initMainTunnel();
    initInstaGrid();

    // --- SCROLL-DRIVEN SECURITY LOGIC ---
    const SECURITY_CONFIG = {
        LOGO_SCROLL: 1200,    // Phase 1: Logo forms
        HOLD_SCROLL: 2000,    // Phase 2: Hold for hover interaction
        MAX_SCROLL: 3200,     // Phase 3: Zoom and Fly-Past
        MOUSE_RADIUS: 100,    // Optimized radius for natural interaction
        MOUSE_FORCE: 2.0,     // Slightly stronger force for better repulsion
        SPRING_K: 0.1,
        FRICTION: 0.8,
        MAX_DISPLACEMENT: 25,
        PARTICLE_SIZE: 2,
        GAP: 5 // Reverted to 5 for higher density
    };

    let securityState = {
        scrollProgress: 0,
        targetScroll: 0,
        isAnimating: false,
        particles: [],
        mouse: { x: null, y: null },
        isShattering: false,
        shatterStartTime: 0,
        isZooming: false,  // Password-triggered zoom animation
        isCentering: false, // Logo moving to center
        centeringProgress: 0,
        passwordAccepted: false // Lock to prevent security screen from reappearing
    };

    // Mouse Tracking for Repulsion & Glow
    window.addEventListener('mousemove', (e) => {
        const canvas = document.getElementById('logo-particles');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            securityState.mouse.x = e.clientX - rect.left;
            securityState.mouse.y = e.clientY - rect.top;
        } else {
            securityState.mouse.x = e.clientX;
            securityState.mouse.y = e.clientY;
        }

        const glow = document.getElementById('security-cursor-glow');
        if (glow) {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        }
    });

    window.addEventListener('mouseout', () => {
        securityState.mouse.x = null;
        securityState.mouse.y = null;
    });

    function showSecurityTrigger() {
        const container = document.getElementById('security-trigger-container');
        if (!container || !container.classList.contains('hidden')) return;

        // Hide Tunnel Visuals temporarily to prevent bleed-through
        const tunnel = document.getElementById('main-tunnel');
        if (tunnel) tunnel.style.opacity = '0';

        container.classList.remove('hidden');
        container.style.opacity = '1';

        if (securityState.particles.length === 0) {
            // Defer to next frame to avoid UI freeze
            requestAnimationFrame(() => initLogoParticles());
        }

        if (!securityState.isAnimating) {
            securityState.isAnimating = true;
            securityState.targetScroll = SECURITY_CONFIG.LOGO_SCROLL;
            requestAnimationFrame(processSecurityAutoScroll);
        }


    }

    function processSecurityAutoScroll() {
        // Dynamic Speed: 2x Faster (0.04) for Zoom
        const lerp = securityState.isZooming ? 0.04 : 0.04;
        const diff = securityState.targetScroll - securityState.scrollProgress;

        if (Math.abs(diff) > 0.5) {
            securityState.scrollProgress += diff * lerp;
        } else {
            securityState.scrollProgress = securityState.targetScroll;
        }

        renderLogoFrame();

        if (Math.abs(diff) > 0.5 || securityState.isAnimating) {
            if (securityState.scrollProgress <= 0.1 && Math.abs(diff) < 2) {
                securityState.isAnimating = false;
                securityState.scrollProgress = 0; // Force to 0 for logic checks

                // IMMEDIATE CLEANUP

                // Restore Tunnel Visuals if cancelled
                const tunnel = document.getElementById('main-tunnel');
                if (tunnel) tunnel.style.opacity = '1';

                const container = document.getElementById('security-trigger-container');
                if (container) {
                    container.classList.add('hidden');
                    container.style.opacity = '0';
                }

                const pwd = document.getElementById('password-container');
                if (pwd) {
                    pwd.classList.add('hidden');
                    pwd.style.opacity = '0';
                    pwd.style.pointerEvents = 'none';
                }

                const canvas = document.getElementById('logo-particles');
                if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            } else {
                requestAnimationFrame(processSecurityAutoScroll);
            }
        } else {
            securityState.isAnimating = false;
        }
    }

    function initLogoParticles() {
        const canvas = document.getElementById('logo-particles');
        if (!canvas) return;
        canvas.style.display = 'block'; // Ensure it is visible if previously hidden
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        securityState.particles = [];

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Responsive logo sizing
        // Mobile (<=768px): Bigger and Denser
        let sizeMultiplier, startGap, startSize;

        if (window.innerWidth <= 768) {
            sizeMultiplier = 0.65; // Bigger on mobile (was 0.45)
            startGap = 6;          // Proportional Ratio (1.25x Diameter)
            startSize = 2.4;       // 20% Larger than Desktop (2.0)
        } else if (window.innerWidth <= 1024) {
            sizeMultiplier = 0.55;
            startGap = SECURITY_CONFIG.GAP;
            startSize = SECURITY_CONFIG.PARTICLE_SIZE;
        } else {
            sizeMultiplier = 0.65;
            startGap = SECURITY_CONFIG.GAP;
            startSize = SECURITY_CONFIG.PARTICLE_SIZE;
        }

        const shapeSize = Math.floor(Math.min(canvas.width, canvas.height) * sizeMultiplier);

        tempCanvas.width = shapeSize;
        tempCanvas.height = shapeSize;

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.clearRect(0, 0, shapeSize, shapeSize);

        const cx = shapeSize / 2;
        const cy = shapeSize / 2;

        // HAT
        tempCtx.beginPath();
        const crownTopW = shapeSize * 0.3;
        const crownBotW = shapeSize * 0.45;
        const crownH = shapeSize * 0.25;
        const hatY = cy - shapeSize * 0.15;
        tempCtx.moveTo(cx - crownTopW / 2, hatY - crownH);
        tempCtx.lineTo(cx + crownTopW / 2, hatY - crownH);
        tempCtx.lineTo(cx + crownBotW / 2, hatY);
        tempCtx.lineTo(cx - crownBotW / 2, hatY);
        tempCtx.fill();

        const brimW = shapeSize * 0.65;
        const brimH = shapeSize * 0.04;
        tempCtx.fillRect(cx - brimW / 2, hatY, brimW, brimH);

        // GLASSES
        const glassesY = cy + shapeSize * 0.1;
        const lensRadius = shapeSize * 0.14;
        const lensOffset = shapeSize * 0.18;
        const bridgeW = shapeSize * 0.08;
        const bridgeH = shapeSize * 0.04;

        tempCtx.beginPath();
        tempCtx.arc(cx - lensOffset, glassesY, lensRadius, 0, Math.PI * 2);
        tempCtx.fill();
        tempCtx.beginPath();
        tempCtx.arc(cx + lensOffset, glassesY, lensRadius, 0, Math.PI * 2);
        tempCtx.fill();
        tempCtx.fillRect(cx - bridgeW / 2, glassesY - bridgeH, bridgeW, bridgeH * 2);

        const imageData = tempCtx.getImageData(0, 0, shapeSize, shapeSize);
        const data = imageData.data;
        const width = imageData.width;

        const boxW = 400;
        const boxH = 120;

        for (let y = 0; y < shapeSize; y += startGap) {
            for (let dx = startGap / 2; dx < shapeSize / 2; dx += startGap) {
                const sampleX = Math.floor((shapeSize / 2) - dx);
                if (sampleX < 0) continue;

                const index = (y * width + sampleX) * 4;
                if (data[index + 3] > 200) {
                    const offsetY = y - (shapeSize / 2);
                    const targetY1 = (canvas.height / 2) + offsetY;

                    const p1 = createGridParticle((canvas.width / 2) - dx, targetY1);
                    const p2 = createGridParticle((canvas.width / 2) + dx, targetY1);

                    // Apply dynamic size
                    p1.size = startSize;
                    p2.size = startSize;

                    [p1, p2].forEach(p => {
                        const side = Math.random();
                        if (side < 0.25) { // Top
                            p.relX2 = (Math.random() - 0.5) * boxW;
                            p.relY2 = -boxH / 2 + (Math.random() - 0.5) * 10;
                        } else if (side < 0.5) { // Bottom
                            p.relX2 = (Math.random() - 0.5) * boxW;
                            p.relY2 = boxH / 2 + (Math.random() - 0.5) * 10;
                        } else if (side < 0.75) { // Left
                            p.relX2 = -boxW / 2 + (Math.random() - 0.5) * 10;
                            p.relY2 = (Math.random() - 0.5) * boxH;
                        } else { // Right
                            p.relX2 = boxW / 2 + (Math.random() - 0.5) * 10;
                            p.relY2 = (Math.random() - 0.5) * boxH;
                        }
                    });
                }
            }
        }
        renderLogoFrame();
    }

    function createGridParticle(tx, ty) {
        const p = {
            relX1: tx - (window.innerWidth / 2),
            relY1: ty - (window.innerHeight / 2),
            relX2: 0, relY2: 0,
            startX: (Math.random() - 0.5) * window.innerWidth * 3,
            startY: (Math.random() - 0.5) * window.innerHeight * 3,
            startZ: 500 + Math.random() * 2000,
            targetZ: 0,
            vx: 0, vy: 0,
            dx: 0, dy: 0,
            size: SECURITY_CONFIG.PARTICLE_SIZE,
            shatterVX: (Math.random() - 0.5) * 40,
            shatterVY: (Math.random() - 0.5) * 40
        };
        securityState.particles.push(p);
        return p;
    }

    function renderLogoFrame() {
        const canvas = document.getElementById('logo-particles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scroll = securityState.scrollProgress;
        const p1Limit = SECURITY_CONFIG.LOGO_SCROLL;
        const p2Limit = SECURITY_CONFIG.HOLD_SCROLL;
        const p3Limit = SECURITY_CONFIG.MAX_SCROLL;

        // Phase 1: Logo Formation [0 -> 1200]
        const prog1 = Math.max(0, Math.min(1, scroll / p1Limit));
        // Phase 2: Hold for Interaction [1200 -> 2000]
        const prog2 = Math.max(0, Math.min(1, (scroll - p1Limit) / (p2Limit - p1Limit)));
        // Phase 3: Zoom / Fly-Past [2000 -> 3200]
        const prog3 = Math.max(0, Math.min(1, (scroll - p2Limit) / (p3Limit - p2Limit)));

        const baseOpacity = securityState.isShattering ? 1 : Math.min(1, 0.4 + (prog1 * 0.6));
        const flyPastOpacity = 1 - Math.pow(prog3, 2);
        const finalOpacity = baseOpacity * flyPastOpacity;

        // Interaction enabled during Hold phase and tail end of formation
        const canInteract = (prog1 >= 0.95 && prog3 < 0.1 && !securityState.isShattering);
        const fov = 300;

        // Auto-Snap: DISABLED - Zoom only triggers on correct password entry
        // if (prog3 > 0.7 && securityState.targetScroll < p3Limit && !securityState.isShattering) {
        //     securityState.targetScroll = p3Limit;
        // }

        if (securityState.isShattering) {
            const timeSinceShatter = Date.now() - securityState.shatterStartTime;
            ctx.globalAlpha = Math.max(0, 1 - (timeSinceShatter / 1000));
            if (ctx.globalAlpha <= 0) {
                securityState.isShattering = false;
                const container = document.getElementById('security-trigger-container');
                if (container) container.classList.add('hidden');
                return;
            }
        } else {
            ctx.globalAlpha = Math.max(0, finalOpacity);
        }

        // Standard White - No Glow
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

        let mouseIsNearField = false;

        securityState.particles.forEach(p => {
            const ease1 = 1 - Math.pow(1 - prog1, 3);
            const ease3 = Math.pow(prog3, 4); // Aggressive Zoom

            // Static Logo Point
            let tx = p.relX1;
            let ty = p.relY1;

            // No Jitter, just clean 3D movement

            let tz = 0;

            // Apply Phase 3 Zoom (Fly towards and past camera)
            if (prog3 > 0) {
                tz = -fov * 2 * ease3;
            }

            // Responsive Offset with smooth transitions
            // Mobile (<=768px): Center (50%)
            // Tablet (769-1024px): Slightly left (42%)
            // Desktop (>1024px): Left Offset (35%)
            let targetCenterX, targetCenterY;

            if (window.innerWidth <= 768) {
                targetCenterX = canvas.width * 0.5;
                targetCenterY = canvas.height * 0.33; // Shifted DOWN to 33% (was 25%) to balance vertical space
            } else {
                targetCenterX = canvas.width * 0.5;
                targetCenterY = canvas.height * 0.38; // Balanced for desktop
            }

            // If centering (Password Success), move to absolute center
            if (securityState.isCentering) {
                // Lerp towards center based on centeringProgress (0 to 1)
                const easeCenter = securityState.centeringProgress; // Linear or ease

                targetCenterX = targetCenterX + (canvas.width * 0.5 - targetCenterX) * easeCenter;
                targetCenterY = targetCenterY + (canvas.height * 0.5 - targetCenterY) * easeCenter;
            }

            let cx = (targetCenterX + p.startX) + (tx - p.startX) * ease1;
            let cy = (targetCenterY + p.startY) + (ty - p.startY) * ease1;
            const cz = p.startZ + (tz - p.startZ) * ease1;

            const scale = fov / (fov + cz);
            const bx = (cx - canvas.width / 2) * scale + canvas.width / 2;
            const by = (cy - canvas.height / 2) * scale + canvas.height / 2;

            let fX = 0, fY = 0;

            if (securityState.isShattering) {
                p.dx += p.shatterVX;
                p.dy += p.shatterVY;
            } else if (canInteract && securityState.mouse.x !== null && prog1 > 0.99) {
                const mdx = bx - securityState.mouse.x;
                const mdy = by - securityState.mouse.y;
                const dist = Math.sqrt(mdx * mdx + mdy * mdy);

                if (dist < SECURITY_CONFIG.MOUSE_RADIUS) {
                    mouseIsNearField = true;
                    const power = (SECURITY_CONFIG.MOUSE_RADIUS - dist) / SECURITY_CONFIG.MOUSE_RADIUS;
                    // Apply easing for smoother edge falloff (quadratic ease-out)
                    const easedPower = power * power;
                    const angle = Math.atan2(mdy, mdx);
                    fX += Math.cos(angle) * easedPower * SECURITY_CONFIG.MOUSE_FORCE;
                    fY += Math.sin(angle) * easedPower * SECURITY_CONFIG.MOUSE_FORCE;
                }
            }

            if (!securityState.isShattering) {
                fX -= p.dx * SECURITY_CONFIG.SPRING_K;
                fY -= p.dy * SECURITY_CONFIG.SPRING_K;
                p.vx = (p.vx + fX) * SECURITY_CONFIG.FRICTION;
                p.vy = (p.vy + fY) * SECURITY_CONFIG.FRICTION;
                p.dx += p.vx;
                p.dy += p.vy;

                const dSq = p.dx * p.dx + p.dy * p.dy;
                if (dSq > SECURITY_CONFIG.MAX_DISPLACEMENT * SECURITY_CONFIG.MAX_DISPLACEMENT) {
                    const r = SECURITY_CONFIG.MAX_DISPLACEMENT / Math.sqrt(dSq);
                    p.dx *= r; p.dy *= r;
                }
            }

            const x2d = bx + p.dx;
            const y2d = by + p.dy;

            // Draw if within visible range and not passed camera too far
            if (cz > -fov && scale > 0 && finalOpacity > 0.01) {
                ctx.beginPath();
                ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1.0;
        const glow = document.getElementById('security-cursor-glow');
        if (glow) {
            glow.classList.toggle('active', mouseIsNearField && canInteract);
        }

        const pwd = document.getElementById('password-container');
        if (pwd) {
            // Show password field as logo forms (Phase 1)
            // Fade in during the last 50% of formation (prog1 > 0.5)
            // If retreating (targetScroll <= 0), FORCE FADE OUT faster
            if (prog1 > 0.5 && securityState.targetScroll > 10 && !securityState.isShattering) {
                pwd.classList.remove('hidden');
                // Opacity scales from 0 to 1 as prog1 goes from 0.5 to 1.0
                const fadeIn = (prog1 - 0.5) * 2;

                pwd.style.opacity = fadeIn;
                // Gentle scale in
                pwd.style.transform = "translate(-50%, -50%) scale(" + (0.9 + 0.1 * prog1) + ")";
                // CRITICAL: Only active when fully visible
                const isActive = (fadeIn >= 0.99);
                pwd.style.pointerEvents = isActive ? 'auto' : 'none';

                const inputField = document.getElementById('security-password');
                const submitBtn = document.getElementById('security-submit');

                if (inputField) {
                    inputField.disabled = !isActive;
                    if (!isActive) inputField.blur(); // Ensure focus is lost
                }
                if (submitBtn) submitBtn.disabled = !isActive;
            } else {
                // Rapid fade out
                pwd.classList.add('hidden');
                pwd.style.opacity = 0;
                pwd.style.pointerEvents = 'none';

                const inputField = document.getElementById('security-password');
                if (inputField) inputField.disabled = true;
                const submitBtn = document.getElementById('security-submit');
                if (submitBtn) submitBtn.disabled = true;
            }
        }
    }

    window.updateSecurityParticles = renderLogoFrame;

    // Password Logic
    const pwdInput = document.getElementById('security-password');
    const pwdSubmit = document.getElementById('security-submit');
    const pwdMsg = document.getElementById('password-message');
    const glassWrapper = document.querySelector('.glass-input-wrapper');

    function checkPassword() {
        if (!pwdInput) return;
        const val = pwdInput.value.toLowerCase();

        if (val === 'admin') {
            if (glassWrapper) {
                glassWrapper.classList.remove('error');
                glassWrapper.classList.add('success');
            }
            pwdMsg.innerText = 'ACCESS GRANTED';
            pwdMsg.className = 'access-granted';
            pwdInput.disabled = true;

            // DRAMATIC SEQUENCE: DISPERSE LOGO ON CORRECT PASSWORD
            // Step 1: Hide password container
            const pwd = document.getElementById('password-container');
            if (pwd) {
                pwd.classList.add('force-hidden');
                pwd.style.opacity = '0';
                pwd.style.pointerEvents = 'none';
            }

            // Step 2: Trigger Shatter/Dispersion
            // PRELOAD SECRET TUNNEL NOW (while animation plays)
            if (buildSecretTunnelDOM) buildSecretTunnelDOM();

            securityState.isShattering = true;
            securityState.shatterStartTime = Date.now();
            securityState.passwordAccepted = true; // LOCK: Never show security screen again

            // Ensure animation loop is running to show the explosion
            if (!securityState.isAnimating) {
                securityState.isAnimating = true;
                requestAnimationFrame(processSecurityAutoScroll);
            }

            // Step 3: Cleanup and transition to Secret Tunnel
            // Step 3: Cleanup and transition to Secret Tunnel
            setTimeout(() => {
                // Switch to Secret Tunnel
                switchToSecretTunnel();

                const container = document.getElementById('security-trigger-container');
                if (container) {
                    container.classList.add('hidden');
                    container.style.opacity = '0';
                }

                // STOP LOGO ANIMATION COMPLETELY
                securityState.isShattering = false;
                securityState.isAnimating = false;
                securityState.targetScroll = 0;
                securityState.scrollProgress = 0;

                // Clear Canvas
                const canvas = document.getElementById('logo-particles');
                if (canvas) {
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    canvas.style.display = 'none';
                }

                // NUKE PARTICLES
                securityState.particles = [];
            }, 1000);
        } else {
            if (glassWrapper) {
                glassWrapper.classList.add('error');
                setTimeout(() => glassWrapper.classList.remove('error'), 1000);
            }
            pwdMsg.innerText = 'ACCESS DENIED';
            pwdMsg.className = 'access-denied';
            pwdInput.value = '';
        }
    }

    if (pwdInput) {
        pwdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }
    if (pwdSubmit) {
        pwdSubmit.addEventListener('click', checkPassword);
    }



    // Optimized Secret Tunnel Launch
    function buildSecretTunnelDOM() {
        const sTunnel = document.getElementById('secret-tunnel');
        if (!sTunnel) return;

        // Check if already built to avoid double-build
        if (sTunnel.children.length > 0) return;

        // Shuffle right before build
        shuffleArray(secretMedia);

        sTunnel.innerHTML = ''; // Ensure clear

        secretMedia.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'tunnel-item';

            // Same 3D positioning as Main Tunnel
            const z = (index * -800) - 800;
            const angle = Math.random() * Math.PI * 2;
            const radius = 250 + Math.random() * 200;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            item.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`;
            item.setAttribute('data-z', z);
            item.setAttribute('data-x', x);
            item.setAttribute('data-y', y);

            const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.mov');
            let mediaEl;

            if (isVideo) {
                mediaEl = document.createElement('video');
                mediaEl.src = src;
                mediaEl.muted = true;
                mediaEl.autoplay = true;
                mediaEl.loop = true;
                mediaEl.playsInline = true;
                // Preload metadata to reduce jank
                mediaEl.preload = 'metadata';
            } else {
                mediaEl = document.createElement('img');
                mediaEl.src = src;
                mediaEl.loading = 'eager'; // Load immediately since we are about to show it
            }

            // Error Handling
            mediaEl.onerror = () => {
                console.error('Secret Tunnel Media Failed:', src);
                item.innerHTML = '<div style="color:red;font-size:10px;">Media Error<br>' + src.split('/').pop() + '</div>';
                item.style.border = '1px solid red';
            };

            item.appendChild(mediaEl);
            sTunnel.appendChild(item);
        });
    }

    function switchToSecretTunnel() {
        isSecretMode = true;
        isInterventionMode = false;
        currentZ = 0;
        autoScrollZ = 0;

        // Reset tracking state
        forwardScrollStart = 0;
        forwardScrollDistance = 0;
        isScrollingForward = false;

        const sTunnel = document.getElementById('secret-tunnel');
        const hTunnel = document.getElementById('main-tunnel');

        // Hide main tunnel
        if (hTunnel) {
            hTunnel.classList.add('hidden');
            hTunnel.style.opacity = '0';
        }

        // Show secret tunnel (which was pre-built)
        if (sTunnel) {
            sTunnel.classList.remove('hidden');
            // Force reflow
            void sTunnel.offsetWidth;
            sTunnel.style.opacity = '1';
        }

        // --- ANIMATED ENTRY ---
        // Start "deep" in the tunnel (negative Z is forward, positive is backward in our logic)
        // Actually, our logic: currentZ decreases to move forward.
        // So start at a HIGHER Z (e.g., 5000) and move to 0?
        // Wait, standard view is at 0. Items are at -800, -1600...
        // To fly IN, we should start at a positive Z (camera behind items) or just animate standard autoScroll.

        // Let's set a starting "fly-in" state
        currentZ = 5000; // Start far back
        const targetZ = 0;

        function animateEntry() {
            // Speed of entry - Variable step for smoother ease-out feel
            const diff = targetZ - currentZ;

            // Simple ease-out: move 10% of remaining distance
            // But ensure minimum step to avoid infinite tail
            let step = diff * 0.1;
            if (Math.abs(step) < 50) step = (diff > 0) ? 50 : -50;

            currentZ += step;

            // Snap to target if close
            if (Math.abs(currentZ - targetZ) < 60) currentZ = targetZ;

            if (currentZ != targetZ) {
                if (window.updateTunnel) window.updateTunnel(currentZ);
                requestAnimationFrame(animateEntry);
            } else {
                currentZ = targetZ;
                if (window.updateTunnel) window.updateTunnel(currentZ);
            }
        }
        requestAnimationFrame(animateEntry);
    }

    function resetTunnelState() {
        console.log("Resetting Tunnel State...");
        isSecretMode = false;

        // Reset Scroll/Intervention Vars
        isInterventionMode = false;
        currentZ = 0;
        autoScrollZ = 0;
        forwardScrollStart = 0;
        forwardScrollDistance = 0;
        isScrollingForward = false;

        // Reset Security State
        securityState.passwordAccepted = false;
        securityState.isShattering = false;
        securityState.isAnimating = false;
        securityState.targetScroll = 0;
        securityState.scrollProgress = 0;
        securityState.particles = [];

        // DOM Resets
        const hTunnel = document.getElementById('main-tunnel');
        const sTunnel = document.getElementById('secret-tunnel');
        const securityContainer = document.getElementById('security-trigger-container');
        const pwdContainer = document.getElementById('password-container');
        const pwdInput = document.getElementById('security-password');
        const logoCanvas = document.getElementById('logo-particles');
        const pwdMsg = document.getElementById('password-message');
        const glassWrapper = document.querySelector('.glass-input-wrapper');

        if (hTunnel) {
            hTunnel.classList.remove('hidden');
            hTunnel.style.opacity = '1';
        }
        if (sTunnel) {
            sTunnel.classList.add('hidden');
            sTunnel.style.opacity = '0';
        }
        if (securityContainer) {
            securityContainer.classList.add('hidden');
            securityContainer.style.opacity = '0';
        }
        if (pwdContainer) {
            pwdContainer.classList.add('hidden');
            pwdContainer.classList.remove('force-hidden');
            pwdContainer.style.opacity = '0';
            pwdContainer.style.pointerEvents = 'none';
        }
        if (pwdInput) {
            pwdInput.value = '';
            pwdInput.disabled = false;
        }
        if (pwdMsg) {
            pwdMsg.innerText = '';
            pwdMsg.className = '';
        }
        if (glassWrapper) {
            glassWrapper.classList.remove('success', 'error');
        }
        if (logoCanvas) {
            const ctx = logoCanvas.getContext('2d');
            ctx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
            logoCanvas.style.display = 'block';
        }

        // Force initial render of main tunnel
        if (window.updateTunnel) window.updateTunnel(0);
    }

});