/**
 * 幾何互動教室 —— 隨機工具
 *
 * 提供題目抽樣與選項洗牌，讓學生重玩時不會靠「背答案位置」通關。
 */
(function (global) {
    'use strict';

    /** Fisher-Yates 洗牌，回傳新陣列，不修改原始題庫 */
    function shuffle(arr) {
        var out = arr.slice();
        for (var i = out.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    /**
     * 從陣列隨機抽出 n 個元素。
     * 若 n 大於陣列長度，則回傳全部（洗牌後），避免題庫不足時出現 undefined。
     */
    function sample(arr, n) {
        var shuffled = shuffle(arr);
        return shuffled.slice(0, Math.min(n, shuffled.length));
    }

    global.GeoRandom = {
        shuffle: shuffle,
        sample: sample
    };
})(window);
