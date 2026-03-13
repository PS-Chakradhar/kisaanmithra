/**
 * KisaanMitra - Speech Engine
 * Browser-native Web Speech API — completely FREE.
 */
const SpeechEngine = {
    recognition: null,
    isListening: false,

    init() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { console.warn('Speech Recognition not supported'); return false; }
        this.recognition = new SR();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        return true;
    },

    listen(langCode = 'hi-IN') {
        return new Promise((resolve, reject) => {
            if (!this.recognition) { reject(new Error('Speech recognition not available')); return; }
            this.recognition.lang = langCode;
            let finalTranscript = '';

            this.recognition.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) finalTranscript += transcript;
                    else interim += transcript;
                }
                if (interim) {
                    const el = document.getElementById('voice-status');
                    if (el) el.textContent = interim;
                }
            };

            this.recognition.onend = () => {
                this.isListening = false; this._updateUI(false);
                finalTranscript.trim() ? resolve(finalTranscript.trim()) : reject(new Error('no_speech'));
            };

            this.recognition.onerror = (event) => {
                this.isListening = false; this._updateUI(false);
                reject(new Error(event.error));
            };

            try { this.recognition.start(); this.isListening = true; this._updateUI(true); }
            catch (e) { reject(e); }
        });
    },

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop(); this.isListening = false; this._updateUI(false);
        }
    },

    speak(text, langCode = 'hi-IN') {
        return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode; utterance.rate = 0.9; utterance.pitch = 1; utterance.volume = 1;
            const voices = window.speechSynthesis.getVoices();
            const matched = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
            if (matched) utterance.voice = matched;
            utterance.onend = resolve; utterance.onerror = resolve;
            window.speechSynthesis.speak(utterance);
        });
    },

    _updateUI(listening) {
        const micBtn = document.getElementById('mic-button');
        const wave = document.getElementById('voice-wave');
        const status = document.getElementById('voice-status');
        if (listening) {
            micBtn?.classList.add('listening'); wave?.classList.remove('hidden');
            if (status) status.textContent = t('voice_listening');
        } else {
            micBtn?.classList.remove('listening'); wave?.classList.add('hidden');
            if (status) status.textContent = t('voice_tap');
        }
    }
};

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
