/**
 * 幾何互動教室 —— 進度儲存模組
 *
 * 以 localStorage 保存關卡星等與設定。
 * 課堂平板可能停用儲存空間、或學生使用無痕視窗，
 * 因此所有存取都包在 try/catch 中：儲存失敗時遊戲照常運作，只是不記錄進度。
 */
(function (global) {
    'use strict';

    var PREFIX = 'geo-classroom:';
    var available = null;

    /** 偵測 localStorage 是否真的可寫入（Safari 無痕模式會在寫入時才丟例外） */
    function isAvailable() {
        if (available !== null) return available;
        try {
            var probe = PREFIX + '__probe__';
            global.localStorage.setItem(probe, '1');
            global.localStorage.removeItem(probe);
            available = true;
        } catch (e) {
            available = false;
        }
        return available;
    }

    function read(key, fallback) {
        if (!isAvailable()) return fallback;
        try {
            var raw = global.localStorage.getItem(PREFIX + key);
            if (raw === null) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        if (!isAvailable()) return false;
        try {
            global.localStorage.setItem(PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            // 配額用盡或其他錯誤：靜默失敗，不中斷遊戲
            return false;
        }
    }

    function remove(key) {
        if (!isAvailable()) return false;
        try {
            global.localStorage.removeItem(PREFIX + key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 讀取某款遊戲的關卡進度。
     * 回傳格式固定為 { 1: {stars, completed}, 2: {...}, 3: {...} }，
     * 即使儲存內容毀損也會回傳合法的預設結構，呼叫端不必再防禦。
     */
    function loadProgress(gameId) {
        var blank = { 1: { stars: 0, completed: false }, 2: { stars: 0, completed: false }, 3: { stars: 0, completed: false } };
        var saved = read(gameId + ':progress', null);
        if (!saved || typeof saved !== 'object') return blank;

        for (var lvl = 1; lvl <= 3; lvl++) {
            var entry = saved[lvl];
            if (entry && typeof entry === 'object') {
                var stars = parseInt(entry.stars, 10);
                blank[lvl].stars = (stars >= 0 && stars <= 3) ? stars : 0;
                blank[lvl].completed = entry.completed === true;
            }
        }
        return blank;
    }

    function saveProgress(gameId, progress) {
        return write(gameId + ':progress', progress);
    }

    function clearProgress(gameId) {
        return remove(gameId + ':progress');
    }

    /** 音效開關為跨遊戲共用設定，兩款遊戲共享同一個鍵 */
    function loadSoundEnabled() {
        var v = read('sound-enabled', true);
        return v !== false;
    }

    function saveSoundEnabled(enabled) {
        return write('sound-enabled', enabled === true);
    }

    global.GeoStorage = {
        isAvailable: isAvailable,
        loadProgress: loadProgress,
        saveProgress: saveProgress,
        clearProgress: clearProgress,
        loadSoundEnabled: loadSoundEnabled,
        saveSoundEnabled: saveSoundEnabled
    };
})(window);
