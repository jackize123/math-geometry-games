/**
 * 幾何互動教室 —— 共用音效引擎
 *
 * 以 Web Audio API 即時合成，不載入任何音檔，因此離線也能用。
 * 兩款遊戲原本各有一份實作（一個是 class、一個是物件字面量），
 * 這裡整併為單一模組，音色沿用原本的設計。
 *
 * enabled 設為屬性存取器：指派時會自動寫入 localStorage，
 * 因此遊戲端維持 `sound.enabled = !sound.enabled` 的寫法即可跨頁記憶。
 */
(function (global) {
    'use strict';

    var ctx = null;
    var enabled = global.GeoStorage ? global.GeoStorage.loadSoundEnabled() : true;

    function init() {
        if (!ctx) {
            var Ctor = global.AudioContext || global.webkitAudioContext;
            if (!Ctor) return null;
            ctx = new Ctor();
        }
        // 行動裝置瀏覽器會在使用者互動前把 AudioContext 掛起，需主動喚醒
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
            ctx.resume();
        }
        return ctx;
    }

    /** 所有發聲方法共用的前置檢查，回傳 null 代表不該發聲 */
    function begin() {
        if (!enabled) return null;
        return init();
    }

    var GeoAudio = {
        /** 按鈕點擊：短促的下滑音 */
        playClick: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var osc = c.createOscillator();
            var gain = c.createGain();
            osc.connect(gain);
            gain.connect(c.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.1);
        },

        /** 答對：C5-E5-G5-C6 上行琶音，雙振盪器疊出鈴聲感 */
        playCorrect: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var osc1 = c.createOscillator();
            var osc2 = c.createOscillator();
            var gain = c.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';
            var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach(function (freq, i) {
                osc1.frequency.setValueAtTime(freq, now + i * 0.08);
                osc2.frequency.setValueAtTime(freq, now + i * 0.08);
            });

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(c.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.6);
            osc2.stop(now + 0.6);
        },

        /** 單一部件算對：兩音短提示，比 playCorrect 輕，避免中途干擾 */
        playPartCorrect: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var osc = c.createOscillator();
            var gain = c.createGain();
            osc.connect(gain);
            gain.connect(c.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);      // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.start(now);
            osc.stop(now + 0.25);
        },

        /** 答錯：低頻鋸齒波經低通濾波，溫和不刺耳 */
        playIncorrect: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var osc = c.createOscillator();
            var gain = c.createGain();
            var filter = c.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(c.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        },

        /** 階段完成：雙聲部平行大三和弦上行 */
        playSuccess: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var osc1 = c.createOscillator();
            var osc2 = c.createOscillator();
            var gain = c.createGain();

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(c.destination);

            osc1.type = 'sine';
            osc2.type = 'triangle';

            var high = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
            var low = [261.63, 329.63, 392.00, 523.25];   // C4 E4 G4 C5
            high.forEach(function (freq, i) {
                osc1.frequency.setValueAtTime(freq, now + i * 0.1);
                osc2.frequency.setValueAtTime(low[i], now + i * 0.1);
            });

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.6);
            osc2.stop(now + 0.6);
        },

        /** 關卡通關：七音上行號角 */
        playLevelComplete: function () {
            var c = begin();
            if (!c) return;
            var now = c.currentTime;
            var notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

            notes.forEach(function (freq, idx) {
                var osc = c.createOscillator();
                var gain = c.createGain();
                var t = now + idx * 0.1;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

                osc.connect(gain);
                gain.connect(c.destination);

                osc.start(t);
                osc.stop(t + 0.4);
            });
        }
    };

    // playError 是 composite-area 沿用的名稱，指向同一個錯誤音
    GeoAudio.playError = GeoAudio.playIncorrect;

    Object.defineProperty(GeoAudio, 'enabled', {
        get: function () { return enabled; },
        set: function (value) {
            enabled = (value === true);
            if (global.GeoStorage) global.GeoStorage.saveSoundEnabled(enabled);
        }
    });

    global.GeoAudio = GeoAudio;
})(window);
