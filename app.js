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
        const masterGain = this.audioCtx.createGain();

        // Master Gain Envelope - Long sustain for Ghanti
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(1.0, now + 0.02); // Sharp attack (metal strike)
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + 4.0); // Long decay (resonance)

        masterGain.connect(this.audioCtx.destination);

        // Hindu Bell Synthesis (Brass/Bronze alloy properties)
        // Fundamental frequency ~800-1000Hz for a hand bell
        const fundamental = 880;

        // Partials: ratio, relative amplitude, decay scalar
        // Brass bells have non-integer harmonics giving them their distinctive tone
        const partials = [
            { ratio: 1.0, amp: 1.0, decay: 1.0 },    // Hum
            { ratio: 2.0, amp: 0.6, decay: 0.9 },    // Prime
            { ratio: 3.0, amp: 0.4, decay: 0.8 },    // Tierce (approx)
            { ratio: 4.2, amp: 0.25, decay: 0.6 },   // Inharmonic upper partial
            { ratio: 5.4, amp: 0.15, decay: 0.5 },   // High metal ring
            { ratio: 6.8, amp: 0.1, decay: 0.3 }     // Shimmer
        ];

        partials.forEach(p => {
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.value = fundamental * p.ratio;

            // Randomize slight detuning for naturalness
            osc.detune.value = (Math.random() - 0.5) * 10;

            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(p.amp, now + 0.01);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0 * p.decay);

            osc.connect(oscGain);
            oscGain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 4.5);
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

            // Calculate total magnitude of change
            const totalDelta = deltaX + deltaY + deltaZ;

            if (totalDelta > this.threshold) {
                // Modulate volume/intensity based on shake vigor?
                // For now just trigger
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
        this.bell.classList.add('ringing'); // Add ripple effect

        // Audio
        this.playBellSound();

        // Haptics
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // Multi-pulse
        }

        // Reset state after animation
        setTimeout(() => {
            this.bell.classList.remove('shake');
            this.bell.classList.remove('ringing');
            this.isShaking = false;
        }, 500); // Allow re-ringing faaster

        // this.debugEl.innerText = "Ring! " + new Date().toLocaleTimeString();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ShakeDetector();
});
