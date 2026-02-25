export class AudioManager {
    constructor() {
        this.bgm = null;
        this.bgmBuffer = null;
        this.bgmSource = null;
        this.bgmGain = null;
        this.bgmUrl = null;
        this.crashSfx = null;
        this.crashUrl = null;
        this.scoreSfx = null;
        this.scoreSfxUrl = null;
        this.bgmVolume = 0.4;
        this.sfxVolume = 0.6;
        this.isMuted = false;
        this._audioContext = null;
        this._initialized = false;
    }

    _initAudioContext() {
        if (this._initialized && this._audioContext) return;
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this._initialized = true;
            console.log('AudioContext created, state:', this._audioContext.state);
        } catch (e) {
            console.warn('AudioContext not supported:', e);
        }
    }

    _ensureAudioContext() {
        this._initAudioContext();
        if (this._audioContext) {
            const resumeAudio = async () => {
                if (this._audioContext.state === 'suspended') {
                    try {
                        await this._audioContext.resume();
                        console.log('AudioContext resumed');
                    } catch (e) {
                        console.warn('AudioContext resume failed:', e);
                    }
                }
            };
            resumeAudio();
        }
    }

    async init() {
        this._ensureAudioContext();
        await this._createDefaultSounds();
    }

    async _createDefaultSounds() {
        this.scoreSfx = this._createOscillatorSound(880, 'square', 0.1);

        const crashBuffer = this._createNoiseBuffer(0.3);
        this.crashSfx = crashBuffer;
    }

    _createOscillatorSound(frequency, type, duration) {
        if (!this._audioContext) return null;

        return {
            play: () => {
                if (this.isMuted || !this._audioContext) return;

                const osc = this._audioContext.createOscillator();
                const gain = this._audioContext.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(frequency, this._audioContext.currentTime);

                gain.gain.setValueAtTime(this.sfxVolume, this._audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this._audioContext.currentTime + duration);

                osc.connect(gain);
                gain.connect(this._audioContext.destination);

                osc.start();
                osc.stop(this._audioContext.currentTime + duration);
            }
        };
    }

    _createNoiseBuffer(duration) {
        if (!this._audioContext) return null;

        const sampleRate = this._audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this._audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return {
            buffer: buffer,
            play: () => {
                if (this.isMuted || !this._audioContext) return;

                const source = this._audioContext.createBufferSource();
                const gain = this._audioContext.createGain();

                source.buffer = buffer;
                gain.gain.setValueAtTime(this.sfxVolume, this._audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this._audioContext.currentTime + duration);

                source.connect(gain);
                gain.connect(this._audioContext.destination);

                source.start();
            }
        };
    }

    loadCustomAudio(type, file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
            if (!validTypes.includes(file.type) && !file.type.startsWith('audio/')) {
                reject(new Error('Invalid audio file type'));
                return;
            }

            const url = URL.createObjectURL(file);
            const audio = new Audio();

            audio.oncanplaythrough = () => {
                if (type === 'bgm') {
                    if (this.bgmUrl) URL.revokeObjectURL(this.bgmUrl);
                    this.bgmUrl = url;
                    this.bgm = audio;
                    this.bgm.loop = true;
                    resolve(audio);
                } else if (type === 'crash') {
                    if (this.crashUrl) URL.revokeObjectURL(this.crashUrl);
                    this.crashUrl = url;
                    this._ensureAudioContext();

                    fetch(url)
                        .then(res => res.arrayBuffer())
                        .then(arrayBuffer => {
                            if (this._audioContext) {
                                this._audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                                    this.crashSfx = {
                                        buffer: buffer,
                                        play: () => {
                                            if (this.isMuted || !this._audioContext) return;
                                            const source = this._audioContext.createBufferSource();
                                            const gain = this._audioContext.createGain();
                                            source.buffer = buffer;
                                            gain.gain.setValueAtTime(this.sfxVolume, this._audioContext.currentTime);
                                            source.connect(gain);
                                            gain.connect(this._audioContext.destination);
                                            source.start();
                                        }
                                    };
                                    resolve(this.crashSfx);
                                }, reject);
                            } else {
                                this.crashSfx = { play: () => audio.play() };
                                resolve(this.crashSfx);
                            }
                        })
                        .catch(reject);
                }
            };

            audio.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load audio'));
            };

            audio.src = url;
            audio.load();
        });
    }

    async loadAudioFromUrl(type, url) {
        if (type === 'bgm') {
            const audio = new Audio();
            if (url.startsWith('http')) {
                audio.crossOrigin = 'anonymous';
            }
            audio.src = url;
            audio.loop = true;
            audio.volume = this.bgmVolume;
            if (this.bgm) { this.bgm.pause(); }
            this.bgm = audio;
            console.log('BGM setup complete for:', url);
            return Promise.resolve(audio);
        }

        return new Promise((resolve, reject) => {
            const audio = new Audio();

            audio.oncanplay = () => {
                if (type === 'crash') {
                    this._ensureAudioContext();

                    fetch(url)
                        .then(res => res.arrayBuffer())
                        .then(arrayBuffer => {
                            if (this._audioContext) {
                                this._audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                                    this.crashSfx = {
                                        buffer: buffer,
                                        play: () => {
                                            if (this.isMuted || !this._audioContext) return;
                                            const source = this._audioContext.createBufferSource();
                                            const gain = this._audioContext.createGain();
                                            source.buffer = buffer;
                                            gain.gain.setValueAtTime(this.sfxVolume, this._audioContext.currentTime);
                                            source.connect(gain);
                                            gain.connect(this._audioContext.destination);
                                            source.start();
                                        }
                                    };
                                    resolve(this.crashSfx);
                                }, reject);
                            } else {
                                this.crashSfx = { play: () => { audio.currentTime = 0; audio.play(); } };
                                resolve(this.crashSfx);
                            }
                        })
                        .catch(reject);
                }
            };

            audio.onerror = () => {
                reject(new Error(`Failed to load audio: ${url}`));
            };

            if (url.startsWith('http')) {
                audio.crossOrigin = 'anonymous';
            }
            audio.src = url;
            audio.load();
        });
    }

    playBgm() {
        if (this.isMuted || !this.bgm) {
            console.log('BGM not playing: isMuted=', this.isMuted, 'bgm=', this.bgm);
            return;
        }

        this.bgm.currentTime = 0;

        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn('BGM play failed. Browser policy might be blocking autoplay:', e);
            });
        }
        console.log('BGM play action triggered');
    }

    isBgmPlaying() {
        return this.bgm && !this.bgm.paused;
    }

    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
            } catch (e) {}
            this.bgmSource = null;
        }
    }

    fadeOutBgm(duration = 0.5) {
        if (!this.bgm) return;

        const fadeInterval = 50;
        const fadeSteps = duration * 1000 / fadeInterval;
        const volumeStep = this.bgmVolume / fadeSteps;

        const fade = () => {
            if (this.bgm && this.bgm.volume > volumeStep) {
                this.bgm.volume = Math.max(0, this.bgm.volume - volumeStep);
                setTimeout(fade, fadeInterval);
            } else {
                this.stopBgm();
                if (this.bgm) this.bgm.volume = this.bgmVolume;
            }
        };

        fade();
    }

    playCrash() {
        if (this.crashSfx && this.crashSfx.play) {
            this.crashSfx.play();
        }
    }

    playScore() {
        if (this.scoreSfx && this.scoreSfx.play) {
            this.scoreSfx.play();
        }
    }

    setVolume(type, volume) {
        if (type === 'bgm') {
            this.bgmVolume = Math.max(0, Math.min(1, volume));
            if (this.bgm) this.bgm.volume = this.bgmVolume;
        } else if (type === 'sfx') {
            this.sfxVolume = Math.max(0, Math.min(1, volume));
        }
    }

    mute() {
        this.isMuted = true;
    }

    unmute() {
        this.isMuted = false;
    }
}
