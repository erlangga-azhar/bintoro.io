let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
    try {
        const ctx = initAudio();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        // Audio might be blocked by browser policy until interaction
    }
};

export const playSound = {
    step: () => playTone(150, 'triangle', 0.05, 0.02),
    click: () => playTone(600, 'sine', 0.1, 0.05),
    action: () => playTone(440, 'square', 0.1, 0.03),
    success: () => {
        playTone(400, 'sine', 0.1, 0.05);
        setTimeout(() => playTone(600, 'sine', 0.2, 0.05), 100);
    },
    fail: () => {
        playTone(200, 'sawtooth', 0.3, 0.05);
        setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.05), 150);
    },
    victory: () => {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'square', 0.3, 0.05), i * 150);
        });
    },
    ambientIntervals: [] as any[],
    ambientWindNode: null as any,
    isPlayingAmbient: false,
    playAmbient: () => {
        if (playSound.isPlayingAmbient) return;
        playSound.isPlayingAmbient = true;

        try {
            const ctx = initAudio();
            const bufferSize = ctx.sampleRate * 2; 
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 300; 
            
            const gain = ctx.createGain();
            gain.gain.value = 0.015; 
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            noise.start();
            playSound.ambientWindNode = noise;
        } catch (e) {}

        playSound.ambientIntervals.push(setInterval(() => {
            if (!playSound.isPlayingAmbient) return;
            // distant birds
            if (Math.random() < 0.4) {
                const freq = 2000 + Math.random() * 1000;
                playTone(freq, 'sine', 0.1, 0.005);
                setTimeout(() => playTone(freq + 300, 'sine', 0.1, 0.004), 150);
            }
        }, 3000));
    },
    stopAmbient: () => {
        playSound.isPlayingAmbient = false;
        playSound.ambientIntervals.forEach(clearInterval);
        playSound.ambientIntervals = [];
        if (playSound.ambientWindNode) {
            try {
                playSound.ambientWindNode.stop();
                playSound.ambientWindNode.disconnect();
            } catch (e) {}
            playSound.ambientWindNode = null;
        }
    },
    bgmInterval: null as any,
    isPlayingBgm: false,
    playBGM: () => {
        if (playSound.isPlayingBgm) return;
        playSound.isPlayingBgm = true;
        
        // Javanese Slendro pentatonic scale approx (C, D, F, G, A)
        const slendro = [261.63, 293.66, 349.23, 392.00, 440.00];
        const pattern = [
            0, 1, 2, 1,
            3, 2, 1, 2,
            4, 3, 2, 1,
            2, 1, 0, 0
        ];
        
        let step = 0;
        playSound.bgmInterval = setInterval(() => {
            if (!playSound.isPlayingBgm) {
                clearInterval(playSound.bgmInterval);
                return;
            }
            
            // Main melody (Saron/Bonang feel)
            const noteIdx = pattern[step % pattern.length];
            playTone(slendro[noteIdx], 'sine', 0.4, 0.03);

            // Add Kempul/Gong on beats
            if (step % 4 === 0) {
                 const gongVol = step === 0 ? 0.0 : 0.05;
                 if (gongVol > 0) {
                     playTone(130.81, 'triangle', 1.0, gongVol); // Low C gong
                 }
            }

            step++;
        }, 400); // 400ms per note
    },
    stopBGM: () => {
        playSound.isPlayingBgm = false;
        if (playSound.bgmInterval) {
            clearInterval(playSound.bgmInterval);
            playSound.bgmInterval = null;
        }
    }
};
