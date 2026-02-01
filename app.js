class ShakeDetector {
    constructor() {
        this.bell = document.getElementById('bell-container');
        this.overlay = document.getElementById('overlay');
        this.startBtn = document.getElementById('start-btn');
        this.debugEl = document.getElementById('debug');

        // Auto Ring Controls
        this.autoRingBtn = document.getElementById('auto-ring-btn');
        this.shareBtn = document.getElementById('share-btn');
        this.autoRingInterval = null;
        this.isAutoRinging = false;

        // Shake detection configuration
        this.threshold = 10; // Slightly more sensitive
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

        // Manual tap
        this.bell.addEventListener('click', () => this.triggerRing());

        // Auto Ring
        this.autoRingBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent clicks
            this.toggleAutoRing();
        });

        // Share Link
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareApp();
            });
        }
    }

    async shareApp() {
        const shareData = {
            title: 'Pooja Ghanti 🕉️',
            text: 'Turn your phone into a holy temple bell! Shake to ring and perform Aarti anywhere. 🔔✨',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback for desktop/unsupported browsers
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                const originalText = this.shareBtn.innerHTML;
                this.shareBtn.innerHTML = '<span class="icon">✅</span> Copied!';
                setTimeout(() => {
                    this.shareBtn.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                prompt('Copy this link to share:', shareData.url);
            }
        }
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

        // Master Gain Envelope
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(1.0, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + 3.0);

        masterGain.connect(this.audioCtx.destination);

        // Slightly higher pitch for continuous ringing to clear up mud
        const fundamental = 900;

        // Partials: ratio, relative amplitude, decay scalar
        // Brass bells have non-integer harmonics giving them their distinctive tone
        const partials = [
            { ratio: 1.0, amp: 1.0, decay: 1.0 },    // Hum
            { ratio: 2.0, amp: 0.6, decay: 0.9 },    // Prime
            { ratio: 3.0, amp: 0.4, decay: 0.8 },    // Tierce (approx)
            { ratio: 4.2, amp: 0.25, decay: 0.6 },   // Inharmonic upper partial
            { ratio: 5.4, amp: 0.15, decay: 0.5 }   // High metal ring
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
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0 * p.decay);

            osc.connect(oscGain);
            oscGain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 3.5);
        });
    }

    handleMotion(event) {
        if (this.isAutoRinging) return; // Ignore shake during auto-ring

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

    toggleAutoRing() {
        this.isAutoRinging = !this.isAutoRinging;

        if (this.isAutoRinging) {
            this.autoRingBtn.classList.add('active');
            this.autoRingBtn.innerHTML = '<span class="icon">⏹️</span> Stop Aarti';
            this.triggerRing(); // Start immediately
            this.autoRingInterval = setInterval(() => this.triggerRing(), 600); // Continuous rhythm
        } else {
            this.autoRingBtn.classList.remove('active');
            this.autoRingBtn.innerHTML = '<span class="icon">🔔</span> Auto Ring (Aarti)';
            clearInterval(this.autoRingInterval);
            this.autoRingInterval = null;
        }
    }

    triggerRing() {
        // Reduced debounce for manual shake to allow "continuous" feel if shaken hard
        if (this.isShaking && !this.isAutoRinging) return;

        this.isShaking = true;

        // Visuals
        this.bell.classList.remove('shake'); // Reset to replay animation
        void this.bell.offsetWidth; // Trigger reflow
        this.bell.classList.add('shake');
        this.bell.classList.add('ringing');

        // Audio
        this.playBellSound();

        // NO VIBRATION (Requested by user)

        // Reset state
        setTimeout(() => {
            if (!this.isAutoRinging) {
                this.bell.classList.remove('shake');
                this.bell.classList.remove('ringing');
            }
            this.isShaking = false;
        }, 150); // Very short debounce for responsiveness
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ShakeDetector();
});
