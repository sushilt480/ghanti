class ShakeDetector {
    constructor() {
        this.bell = document.getElementById('bell-container');
        this.overlay = document.getElementById('overlay');
        this.startBtn = document.getElementById('start-btn');
        this.debugEl = document.getElementById('debug');
        
        // Shake detection configuration
        this.threshold = 15; // Sensitivity
        this.lastX = 0;
        this.lastY = 0;
        this.lastZ = 0;
        this.lastTime = 0;
        this.isShaking = false;
        
        // Audio Context
        this.audioCtx = null;
        
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.enableSensors());
        
        // Also allow manual ring on tap
        this.bell.addEventListener('click', () => this.triggerRing());
    }

    async enableSensors() {
        // Initialize Audio Context on user gesture
        this.initAudio();

        // Hide overlay
        this.overlay.classList.add('hidden');

        // Request DeviceMotion Permission (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const response = await DeviceMotionEvent.requestPermission();
                if (response === 'granted') {
                    window.addEventListener('devicemotion', (e) => this.handleMotion(e));
                } else {
                    alert('Permission needed to detect shake!');
                }
            } catch (e) {
                console.error(e);
                alert('Error requesting permission: ' + e);
            }
        } else {
            // Non-iOS 13+ devices
            window.addEventListener('devicemotion', (e) => this.handleMotion(e));
        }
    }

    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
    }

    playBellSound() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        
        // Create oscillators for a richer bell tone
        const fundamental = 500;
        const ratios = [1, 2, 3, 4.2, 5.4];
        const gainNode = this.audioCtx.createGain();
        
        // Master Gain Envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + 0.01); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5); // Decay
        
        gainNode.connect(this.audioCtx.destination);

        ratios.forEach(ratio => {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = fundamental * ratio;
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 2.0);
        });
    }

    handleMotion(event) {
        const current = event.accelerationIncludingGravity;
        if (!current) return;

        const currentTime = new Date().getTime();
        const timeDiff = currentTime - this.lastTime;

        if (timeDiff > 100) {
            const deltaX = Math.abs(current.x - this.lastX);
            const deltaY = Math.abs(current.y - this.lastY);
            const deltaZ = Math.abs(current.z - this.lastZ);

            if ((deltaX + deltaY + deltaZ) > this.threshold) {
                this.triggerRing();
            }

            this.lastX = current.x;
            this.lastY = current.y;
            this.lastZ = current.z;
            this.lastTime = currentTime;
        }
    }

    triggerRing() {
        if (this.isShaking) return; // Debounce
        
        this.isShaking = true;
        
        // Visuals
        this.bell.classList.add('shake');
        
        // Audio
        this.playBellSound();
        
        // Haptics
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Reset state after animation
        setTimeout(() => {
            this.bell.classList.remove('shake');
            this.isShaking = false;
        }, 500);
        
        // this.debugEl.innerText = "Ring! " + new Date().toLocaleTimeString();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ShakeDetector();
});
