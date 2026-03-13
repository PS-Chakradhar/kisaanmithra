/**
 * KisaanMitra - Main Application Logic
 */
window.currentLanguage = 'hi';
let currentSpeechCode = 'hi-IN';
let currentFeature = 'ask';
const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    SpeechEngine.init();

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.currentLanguage = btn.dataset.lang;
            currentSpeechCode = btn.dataset.speech;
            $('current-lang-flag').textContent = btn.querySelector('.lang-native').textContent.slice(0, 2);
            updatePageLanguage();
            showScreen('main-screen');
        });
    });

    $('mic-button').addEventListener('click', handleMicClick);
    document.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('click', () => switchFeature(card.dataset.feature));
    });
    $('lang-switch-btn').addEventListener('click', () => showScreen('splash-screen'));

    window.addEventListener('online', () => { $('online-status').className = 'status-dot online'; });
    window.addEventListener('offline', () => { $('online-status').className = 'status-dot offline'; });
    if (!navigator.onLine) $('online-status').className = 'status-dot offline';
});

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(screenId)?.classList.add('active');
}

function switchFeature(feature) {
    currentFeature = feature;
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-feature="${feature}"]`)?.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    switch (feature) {
        case 'ask':
            ($('response-section').children.length > 0 ? $('response-section') : $('welcome-section')).classList.add('active');
            break;
        case 'prices': $('prices-section').classList.add('active'); loadPrices(); break;
        case 'weather': $('weather-section').classList.add('active'); loadWeather(); break;
        case 'calendar': $('calendar-section').classList.add('active'); loadCalendar(); break;
    }
}

async function handleMicClick() {
    if (SpeechEngine.isListening) { SpeechEngine.stop(); return; }
    try {
        const transcript = await SpeechEngine.listen(currentSpeechCode);
        await processVoiceQuery(transcript);
    } catch (error) {
        showToast(t('error_no_speech'));
    }
}

async function processVoiceQuery(query) {
    switchFeature('ask');
    $('welcome-section').classList.remove('active');
    $('response-section').classList.add('active');
    addQueryBubble(query);
    showLoading(true);
    const result = await API.sendQuery(query, window.currentLanguage);
    showLoading(false);
    if (result && result.data) {
        addResponseCard(result.data);
        SpeechEngine.speak(result.data.text, currentSpeechCode);
    }
}

function addQueryBubble(text) {
    const div = document.createElement('div');
    div.className = 'query-echo';
    div.textContent = `🎤 "${text}"`;
    $('response-section').appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function addResponseCard(data) {
    const card = document.createElement('div');
    card.className = 'response-card';
    let stepsHTML = '';
    if (data.steps && data.steps.length > 0) {
        stepsHTML = `<p><strong>${t('steps_title')}</strong></p>
            <ul class="steps-list">${data.steps.map(s => `<li>${s}</li>`).join('')}</ul>`;
    }
    const safeText = (data.text || '').replace(/`/g, "'").replace(/\\/g, '\\\\');
    card.innerHTML = `
        <div class="response-emoji">${data.emoji || '🌾'}</div>
        <div class="response-text">${data.text}</div>
        ${data.type !== 'general' && data.type !== 'error' ? `<span class="response-type">${data.type}</span>` : ''}
        ${stepsHTML}
        <button class="speak-btn" onclick="SpeechEngine.speak('${safeText}', '${currentSpeechCode}')">${t('speak_again')}</button>`;
    $('response-section').appendChild(card);
    card.scrollIntoView({ behavior: 'smooth' });
}

async function loadPrices() {
    showLoading(true);
    const data = await API.getPrices(window.currentLanguage);
    showLoading(false);
    const container = $('prices-list');
    container.innerHTML = '';
    if (data.commodities && data.commodities.length > 0) {
        data.commodities.forEach(item => {
            const trendClass = item.trend === 'rising' ? 'trend-up' : item.trend === 'falling' ? 'trend-down' : 'trend-stable';
            const card = document.createElement('div');
            card.className = 'price-card';
            card.innerHTML = `
                <div class="crop-emoji">${item.emoji}</div>
                <div class="crop-info"><div class="crop-name">${item.name}</div><div class="crop-unit">${t('per')} ${item.unit}</div></div>
                <div><div class="crop-price">₹${item.price.toLocaleString()}</div><div class="${trendClass}">${t('trend_' + item.trend)}</div></div>`;
            container.appendChild(card);
        });
    }
}

async function loadWeather() {
    showLoading(true);
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const data = await API.getWeather(pos.coords.latitude, pos.coords.longitude, window.currentLanguage);
        showLoading(false); renderWeather(data);
    } catch (e) {
        const data = await API.getWeather(12.97, 77.59, window.currentLanguage);
        showLoading(false); renderWeather(data);
    }
}

function renderWeather(data) {
    const container = $('weather-content');
    if (!data.success && !data.current) {
        container.innerHTML = `<div class="welcome-card"><p>${t('error_network')}</p></div>`; return;
    }
    const c = data.current;
    let adviceHTML = '';
    if (data.farming_advice && data.farming_advice.length > 0) {
        adviceHTML = `<div class="farming-advice">${data.farming_advice.map(a => `<p>${a}</p>`).join('')}</div>`;
    }
    container.innerHTML = `
        <div class="weather-card">
            <div class="weather-main"><div><div class="weather-temp">${c.temperature}°C</div>
                <div class="weather-desc">${c.description}</div><div class="weather-city">📍 ${c.city}</div></div></div>
            <div class="weather-details">
                <div class="weather-detail-item"><div class="label">${t('humidity')}</div><div class="value">${c.humidity}%</div></div>
                <div class="weather-detail-item"><div class="label">${t('wind')}</div><div class="value">${c.wind_speed || '--'} km/h</div></div>
            </div>
            ${adviceHTML}
        </div>`;
}

function loadCalendar() {
    const seasons = {
        kharif: { crops: [
            { emoji: '🌾', en: 'Rice', hi: 'धान', sow: 'Jun-Jul', harv: 'Oct-Nov' },
            { emoji: '☁️', en: 'Cotton', hi: 'कपास', sow: 'May-Jun', harv: 'Nov-Jan' },
            { emoji: '🌽', en: 'Maize', hi: 'मक्का', sow: 'Jun-Jul', harv: 'Sep-Oct' },
            { emoji: '🥜', en: 'Groundnut', hi: 'मूंगफली', sow: 'Jun-Jul', harv: 'Oct-Nov' }
        ]},
        rabi: { crops: [
            { emoji: '🌾', en: 'Wheat', hi: 'गेहूँ', sow: 'Oct-Nov', harv: 'Mar-Apr' },
            { emoji: '🥔', en: 'Potato', hi: 'आलू', sow: 'Oct-Nov', harv: 'Jan-Mar' },
            { emoji: '🧅', en: 'Onion', hi: 'प्याज', sow: 'Nov-Dec', harv: 'Apr-May' },
            { emoji: '🌼', en: 'Mustard', hi: 'सरसों', sow: 'Oct-Nov', harv: 'Feb-Mar' }
        ]},
        zaid: { crops: [
            { emoji: '🍉', en: 'Watermelon', hi: 'तरबूज़', sow: 'Feb-Mar', harv: 'May-Jun' },
            { emoji: '🥒', en: 'Cucumber', hi: 'खीरा', sow: 'Feb-Mar', harv: 'Apr-Jun' }
        ]}
    };
    const container = $('calendar-content');
    const lang = window.currentLanguage;
    container.innerHTML = '';
    Object.entries(seasons).forEach(([key, season]) => {
        let html = `<div class="section-header"><h2>🌱 ${t('season_' + key)}</h2></div>`;
        season.crops.forEach(crop => {
            const name = lang === 'hi' ? crop.hi : crop.en;
            html += `<div class="price-card"><div class="crop-emoji">${crop.emoji}</div>
                <div class="crop-info"><div class="crop-name">${name}</div><div class="crop-unit">${t('sowing')}: ${crop.sow}</div></div>
                <div><div class="crop-price" style="font-size:0.85rem">${t('harvest')}</div>
                <div style="color:var(--text-muted);font-size:0.8rem">${crop.harv}</div></div></div>`;
        });
        container.innerHTML += html;
    });
}

function showLoading(show) { $('loading-overlay')?.classList.toggle('hidden', !show); }
function showToast(message) {
    const el = $('voice-status');
    if (el) { el.textContent = message; setTimeout(() => { el.textContent = t('voice_tap'); }, 3000); }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW failed:', err));
    });
}
