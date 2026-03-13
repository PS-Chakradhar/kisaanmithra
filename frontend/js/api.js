/**
 * KisaanMitra - Smart API Communication Layer
 * Tries LOCAL backend first (for demo), falls back to cloud.
 * Prices & Calendar are now 100% offline via app.js — no API needed.
 */
const API = {
    LOCAL_URL: 'http://localhost:5001/api',
    CLOUD_URL: 'https://PSC03.pythonanywhere.com/api',
    _activeUrl: null, // Will be auto-detected

    // Auto-detect: try local first, fall back to cloud
    async _getBaseUrl() {
        if (this._activeUrl) return this._activeUrl;
        try {
            const res = await fetch(`${this.LOCAL_URL}/health`, { signal: AbortSignal.timeout(1500) });
            if (res.ok) { this._activeUrl = this.LOCAL_URL; console.log('🟢 Using LOCAL backend'); return this.LOCAL_URL; }
        } catch (e) { /* local not available */ }
        this._activeUrl = this.CLOUD_URL;
        console.log('☁️ Using CLOUD backend');
        return this.CLOUD_URL;
    },

    async sendQuery(query, language = 'hi') {
        try {
            const base = await this._getBaseUrl();
            const response = await fetch(`${base}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, language })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            // If cloud returned an error (Gemini blocked), retry on local
            if (!result.success && base === this.CLOUD_URL) {
                try {
                    const localRes = await fetch(`${this.LOCAL_URL}/query`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query, language }),
                        signal: AbortSignal.timeout(15000)
                    });
                    if (localRes.ok) {
                        const localResult = await localRes.json();
                        if (localResult.success) return localResult;
                    }
                } catch (e) { /* local also not available */ }
            }
            return result;
        } catch (error) {
            console.error('Query API Error:', error);
            return { success: false, data: { text: t('error_network'), type: 'error', emoji: '⚠️', steps: [] }, language };
        }
    },

    async getWeather(lat, lon, language = 'hi') {
        try {
            const base = await this._getBaseUrl();
            const response = await fetch(`${base}/weather?lat=${lat}&lon=${lon}&language=${language}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            localStorage.setItem('cached_weather', JSON.stringify(data));
            return data;
        } catch (error) {
            const cached = localStorage.getItem('cached_weather');
            return cached ? JSON.parse(cached) : { success: false };
        }
    }
};
