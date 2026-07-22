/**
 * 複合圖形面積挑戰 - Core Game Script
 *
 * 音效引擎、進度儲存、隨機抽題等共用能力由 ../shared/ 的模組提供。
 */

// 沿用原本的 SoundEffects 名稱指向共用引擎，呼叫端無須改寫。
// GeoAudio.enabled 是屬性存取器，指派時會自動寫入 localStorage。
const SoundEffects = GeoAudio;

// --- 進度儲存 ---
const GAME_ID = 'composite-area';

// 每關題庫有 4 題，每次隨機抽 3 題，兼顧重玩性與題目品質
const STAGES_PER_LEVEL = 3;

// 使用者若要求減少動態效果，就不播放煙火動畫
const prefersReducedMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// Database of levels and stages
const GAME_LEVELS = {
    1: {
        title: "加法拼接型",
        stages: [
            {
                title: "雙拼小屋",
                instruction: "將圖形拆解成一個三角形（頂部）與一個長方形（底部），分別計算面積後相加。",
                tip: "提示：下方的長方形也是平行四邊形的一種喔！它的底是 12，高是 8。上方的三角形底也是 12，高是 5。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "平行四邊形甲 (長方形)",
                        inputs: { base: 12, height: 8, area: 96 },
                        svgPoints: "100,240 340,240 340,120 100,120"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "三角形乙",
                        inputs: { base: 12, height: 5, area: 30 },
                        svgPoints: "100,120 340,120 220,50"
                    }
                ],
                totalFormula: ["A", "+", "B"],
                totalArea: 126,
                drawSvg(svg) {
                    // Base shape parts
                    svg.innerHTML = `
                        <!-- Part A (Rectangle) -->
                        <polygon points="100,240 340,240 340,120 100,120" class="svg-region parallelogram-fill" data-part="A" />
                        <!-- Part B (Triangle) -->
                        <polygon points="100,120 340,120 220,50" class="svg-region triangle-fill" data-part="B" />
                        
                        <!-- Part Labels -->
                        <text x="220" y="190" class="dimension-text" font-size="20">甲</text>
                        <text x="220" y="105" class="dimension-text" font-size="20">乙</text>
                        
                        <!-- Dimension Lines & Labels -->
                        <!-- Bottom base 12 -->
                        <line x1="100" y1="260" x2="340" y2="260" class="dimension-line" />
                        <line x1="100" y1="255" x2="100" y2="265" class="dimension-line" />
                        <line x1="340" y1="255" x2="340" y2="265" class="dimension-line" />
                        <text x="220" y="278" class="dimension-text">12 cm</text>
                        
                        <!-- Rectangle Height 8 -->
                        <line x1="80" y1="120" x2="80" y2="240" class="dimension-line" />
                        <line x1="75" y1="120" x2="85" y2="120" class="dimension-line" />
                        <line x1="75" y1="240" x2="85" y2="240" class="dimension-line" />
                        <text x="50" y="185" class="dimension-text">8 cm</text>
                        
                        <!-- Triangle height 5 dash -->
                        <line x1="220" y1="50" x2="220" y2="120" class="dimension-dash" />
                        <path d="M 220,110 L 230,110 L 230,120" fill="none" stroke="#94a3b8" />
                        <line x1="355" y1="50" x2="355" y2="120" class="dimension-line" />
                        <line x1="350" y1="50" x2="360" y2="50" class="dimension-line" />
                        <line x1="350" y1="120" x2="360" y2="120" class="dimension-line" />
                        <text x="385" y="90" class="dimension-text">5 cm</text>
                    `;
                }
            },
            {
                title: "梯伴三角形",
                instruction: "將圖形拆解成一個直角梯形（左側）與一個直角三角形（右側）相加。",
                tip: "提示：左側梯形上底是 6，下底是 10，高是 8。右側直角三角形底是 6，高是 8。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "trapezoid",
                        label: "梯形甲",
                        inputs: { upper: 6, lower: 10, height: 8, area: 64 },
                        svgPoints: "100,80 220,80 300,240 100,240"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "三角形乙",
                        inputs: { base: 6, height: 8, area: 24 },
                        svgPoints: "300,240 420,240 300,80" // Right angle at (300,240)
                    }
                ],
                totalFormula: ["A", "+", "B"],
                totalArea: 88,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A (Trapezoid) -->
                        <polygon points="100,80 220,80 300,240 100,240" class="svg-region trapezoid-fill" data-part="A" />
                        <!-- Part B (Triangle) -->
                        <polygon points="300,240 420,240 300,80" class="svg-region triangle-fill" data-part="B" />
                        
                        <!-- Intersect Line (height boundary) -->
                        <line x1="300" y1="80" x2="300" y2="240" class="dimension-dash" />
                        
                        <!-- Labels -->
                        <text x="180" y="170" class="dimension-text" font-size="20">甲</text>
                        <text x="340" y="180" class="dimension-text" font-size="20">乙</text>
                        
                        <!-- Dimensions -->
                        <!-- Trapezoid Upper Base 6 -->
                        <line x1="100" y1="60" x2="220" y2="60" class="dimension-line" />
                        <line x1="100" y1="55" x2="100" y2="65" class="dimension-line" />
                        <line x1="220" y1="55" x2="220" y2="65" class="dimension-line" />
                        <text x="160" y="50" class="dimension-text">6 cm</text>
                        
                        <!-- Trapezoid Lower Base 10 -->
                        <line x1="100" y1="260" x2="300" y2="260" class="dimension-line" />
                        <line x1="100" y1="255" x2="100" y2="265" class="dimension-line" />
                        <line x1="300" y1="255" x2="300" y2="265" class="dimension-line" />
                        <text x="200" y="278" class="dimension-text">10 cm</text>
                        
                        <!-- Triangle Base 6 -->
                        <line x1="300" y1="260" x2="420" y2="260" class="dimension-line" />
                        <line x1="300" y1="255" x2="300" y2="265" class="dimension-line" />
                        <line x1="420" y1="255" x2="420" y2="265" class="dimension-line" />
                        <text x="360" y="278" class="dimension-text">6 cm</text>
                        
                        <!-- Height 8 -->
                        <line x1="80" y1="80" x2="80" y2="240" class="dimension-line" />
                        <line x1="75" y1="80" x2="85" y2="80" class="dimension-line" />
                        <line x1="75" y1="240" x2="85" y2="240" class="dimension-line" />
                        <text x="50" y="165" class="dimension-text">8 cm</text>
                    `;
                }
            },
            {
                title: "階梯轉角",
                instruction: "這個 L 型可以切成上下兩個長方形。分別算出面積後相加，就是整個圖形的面積。",
                tip: "提示：下方長方形的底是 12、高是 6；上方長方形的底是 5、高是 8。長方形也是平行四邊形，用「底 × 高」即可。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "長方形甲 (下方)",
                        inputs: { base: 12, height: 6, area: 72 },
                        svgPoints: "120,280 300,280 300,190 120,190"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "parallelogram",
                        label: "長方形乙 (上方)",
                        inputs: { base: 5, height: 8, area: 40 },
                        svgPoints: "120,190 195,190 195,70 120,70"
                    }
                ],
                totalFormula: ["A", "+", "B"],
                totalArea: 112,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：下方長方形 12 x 6 -->
                        <polygon points="120,280 300,280 300,190 120,190" class="svg-region parallelogram-fill" data-part="A" />
                        <!-- Part B：上方長方形 5 x 8 -->
                        <polygon points="120,190 195,190 195,70 120,70" class="svg-region parallelogram-fill" data-part="B" style="fill: rgba(165, 180, 252, 0.18); stroke: #a5b4fc;" />

                        <!-- 兩塊之間的切割線 -->
                        <line x1="120" y1="190" x2="300" y2="190" class="dimension-dash" />

                        <!-- Labels -->
                        <text x="210" y="240" class="dimension-text" font-size="20">甲</text>
                        <text x="157" y="135" class="dimension-text" font-size="20">乙</text>

                        <!-- 甲的底 12 -->
                        <line x1="120" y1="300" x2="300" y2="300" class="dimension-line" />
                        <line x1="120" y1="295" x2="120" y2="305" class="dimension-line" />
                        <line x1="300" y1="295" x2="300" y2="305" class="dimension-line" />
                        <text x="210" y="318" class="dimension-text">12 cm</text>

                        <!-- 甲的高 6（畫在右側） -->
                        <line x1="320" y1="190" x2="320" y2="280" class="dimension-line" />
                        <line x1="315" y1="190" x2="325" y2="190" class="dimension-line" />
                        <line x1="315" y1="280" x2="325" y2="280" class="dimension-line" />
                        <text x="348" y="240" class="dimension-text">6 cm</text>

                        <!-- 乙的底 5 -->
                        <line x1="120" y1="55" x2="195" y2="55" class="dimension-line" />
                        <line x1="120" y1="50" x2="120" y2="60" class="dimension-line" />
                        <line x1="195" y1="50" x2="195" y2="60" class="dimension-line" />
                        <text x="157" y="42" class="dimension-text">5 cm</text>

                        <!-- 乙的高 8（畫在左側） -->
                        <line x1="100" y1="70" x2="100" y2="190" class="dimension-line" />
                        <line x1="95" y1="70" x2="105" y2="70" class="dimension-line" />
                        <line x1="95" y1="190" x2="105" y2="190" class="dimension-line" />
                        <text x="70" y="135" class="dimension-text">8 cm</text>
                    `;
                }
            },
            {
                title: "梯形戴帽",
                instruction: "上方是一個三角形，下方是一個梯形。分別求出面積後相加。",
                tip: "提示：梯形的上底 8、下底 14、高 6；三角形的底就是梯形的上底 8，高是 5。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "trapezoid",
                        label: "梯形甲 (下方)",
                        inputs: { upper: 8, lower: 14, height: 6, area: 66 },
                        svgPoints: "120,290 330,290 285,200 165,200"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "三角形乙 (上方)",
                        inputs: { base: 8, height: 5, area: 20 },
                        svgPoints: "165,200 285,200 225,125"
                    }
                ],
                totalFormula: ["A", "+", "B"],
                totalArea: 86,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：梯形，上底 8、下底 14、高 6 -->
                        <polygon points="120,290 330,290 285,200 165,200" class="svg-region trapezoid-fill" data-part="A" />
                        <!-- Part B：三角形，底 8、高 5 -->
                        <polygon points="165,200 285,200 225,125" class="svg-region triangle-fill" data-part="B" />

                        <!-- 兩塊之間的切割線 -->
                        <line x1="165" y1="200" x2="285" y2="200" class="dimension-dash" />

                        <!-- Labels -->
                        <text x="225" y="255" class="dimension-text" font-size="20">甲</text>
                        <text x="225" y="185" class="dimension-text" font-size="20">乙</text>

                        <!-- 梯形下底 14 -->
                        <line x1="120" y1="310" x2="330" y2="310" class="dimension-line" />
                        <line x1="120" y1="305" x2="120" y2="315" class="dimension-line" />
                        <line x1="330" y1="305" x2="330" y2="315" class="dimension-line" />
                        <text x="225" y="330" class="dimension-text">14 cm</text>

                        <!-- 共用的上底 / 三角形底 8 -->
                        <line x1="165" y1="215" x2="285" y2="215" class="dimension-line" />
                        <line x1="165" y1="210" x2="165" y2="220" class="dimension-line" />
                        <line x1="285" y1="210" x2="285" y2="220" class="dimension-line" />
                        <text x="225" y="234" class="dimension-text">8 cm</text>

                        <!-- 梯形高 6（左側） -->
                        <line x1="100" y1="200" x2="100" y2="290" class="dimension-line" />
                        <line x1="95" y1="200" x2="105" y2="200" class="dimension-line" />
                        <line x1="95" y1="290" x2="105" y2="290" class="dimension-line" />
                        <text x="70" y="250" class="dimension-text">6 cm</text>

                        <!-- 三角形高 5（右側），並以虛線標出高的位置 -->
                        <line x1="225" y1="125" x2="225" y2="200" class="dimension-dash" />
                        <path d="M 225,190 L 235,190 L 235,200" fill="none" stroke="#94a3b8" />
                        <line x1="350" y1="125" x2="350" y2="200" class="dimension-line" />
                        <line x1="345" y1="125" x2="355" y2="125" class="dimension-line" />
                        <line x1="345" y1="200" x2="355" y2="200" class="dimension-line" />
                        <text x="378" y="168" class="dimension-text">5 cm</text>
                    `;
                }
            }
        ]
    },
    2: {
        title: "減法挖空型",
        stages: [
            {
                title: "缺角大樓",
                instruction: "一個大長方形（底 15，高 10），其右上角被挖掉了一個直角三角形（底 4，高 5），求剩下面積。",
                tip: "提示：使用大長方形（甲）的面積減去挖空的三角形（乙）面積！",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "大長方形甲",
                        inputs: { base: 15, height: 10, area: 150 },
                        // Coordinates representing the bounding box for glow
                        svgPoints: "80,80 380,80 380,280 80,280"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "挖空三角形乙",
                        inputs: { base: 4, height: 5, area: 10 },
                        svgPoints: "300,80 380,80 380,180" // Triangle area: 4x5/2 -> (380-300)=80px scale -> base=4cm, height=5cm (80-180)=100px
                    }
                ],
                totalFormula: ["A", "-", "B"],
                totalArea: 140,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A (Outer block with cutout) -->
                        <polygon points="80,80 300,80 380,180 380,280 80,280" class="svg-region parallelogram-fill" data-part="A" />
                        
                        <!-- Part B (Cutout Triangle dashed representation) -->
                        <polygon points="300,80 380,80 380,180" class="svg-region triangle-fill" data-part="B" stroke-dasharray="4,4" fill-opacity="0.1" />
                        
                        <!-- Labels -->
                        <text x="210" y="190" class="dimension-text" font-size="20">甲 (主體)</text>
                        <text x="350" y="115" class="dimension-text" font-size="16" fill="#f43f5e">乙 (挖空)</text>
                        
                        <!-- Dimension Lines -->
                        <!-- Large bottom base 15 -->
                        <line x1="80" y1="300" x2="380" y2="300" class="dimension-line" />
                        <line x1="80" y1="295" x2="80" y2="305" class="dimension-line" />
                        <line x1="380" y1="295" x2="380" y2="305" class="dimension-line" />
                        <text x="230" y="318" class="dimension-text">15 cm</text>
                        
                        <!-- Large height 10 -->
                        <line x1="60" y1="80" x2="60" y2="280" class="dimension-line" />
                        <line x1="55" y1="80" x2="65" y2="80" class="dimension-line" />
                        <line x1="55" y1="280" x2="65" y2="280" class="dimension-line" />
                        <text x="30" y="185" class="dimension-text">10 cm</text>
                        
                        <!-- Cutout parts specs -->
                        <!-- Upper base remaining? Or cutout width 4 -->
                        <line x1="300" y1="60" x2="380" y2="60" class="dimension-line" stroke="#f43f5e" />
                        <line x1="300" y1="55" x2="300" y2="65" class="dimension-line" stroke="#f43f5e" />
                        <line x1="380" y1="55" x2="380" y2="65" class="dimension-line" stroke="#f43f5e" />
                        <text x="340" y="50" class="dimension-text" fill="#f472b6">4 cm</text>
                        
                        <!-- Cutout height 5 -->
                        <line x1="400" y1="80" x2="400" y2="180" class="dimension-line" stroke="#f43f5e" />
                        <line x1="395" y1="80" x2="405" y2="80" class="dimension-line" stroke="#f43f5e" />
                        <line x1="395" y1="180" x2="405" y2="180" class="dimension-line" stroke="#f43f5e" />
                        <text x="425" y="135" class="dimension-text" fill="#f472b6">5 cm</text>
                    `;
                }
            },
            {
                title: "池塘綠地",
                instruction: "一片直角梯形草地（上底 14，下底 20，高 12），中間有一個平行四邊形水池（底 5，高 6），求草地（挖空後）面積。",
                tip: "提示：梯形面積減去平行四邊形面積！水池的高為 6，底為 5。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "trapezoid",
                        label: "梯形草地甲",
                        inputs: { upper: 14, lower: 20, height: 12, area: 204 },
                        svgPoints: "100,70 380,70 500,310 100,310"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "parallelogram",
                        label: "平行四邊形水池乙",
                        inputs: { base: 5, height: 6, area: 30 },
                        svgPoints: "220,220 320,220 280,100 180,100"
                    }
                ],
                totalFormula: ["A", "-", "B"],
                totalArea: 174,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A (Outer Trapezoid) -->
                        <polygon points="100,70 380,70 500,310 100,310" class="svg-region trapezoid-fill" data-part="A" />
                        
                        <!-- Part B (Inner Parallelogram cutout) -->
                        <polygon points="220,220 320,220 280,100 180,100" class="svg-region parallelogram-fill" data-part="B" style="fill: #1e1b4b; fill-opacity: 0.8; stroke: #3b82f6;" />
                        
                        <!-- Labels -->
                        <text x="130" y="150" class="dimension-text" font-size="20">甲</text>
                        <text x="250" y="165" class="dimension-text" font-size="16" fill="#3b82f6">乙 (水池)</text>
                        
                        <!-- Dimensions -->
                        <!-- Upper base 14 -->
                        <line x1="100" y1="50" x2="380" y2="50" class="dimension-line" />
                        <line x1="100" y1="45" x2="100" y2="55" class="dimension-line" />
                        <line x1="380" y1="45" x2="380" y2="55" class="dimension-line" />
                        <text x="240" y="42" class="dimension-text">14 cm</text>
                        
                        <!-- Lower base 20 -->
                        <line x1="100" y1="330" x2="500" y2="330" class="dimension-line" />
                        <line x1="100" y1="325" x2="100" y2="335" class="dimension-line" />
                        <line x1="500" y1="325" x2="500" y2="335" class="dimension-line" />
                        <text x="300" y="348" class="dimension-text">20 cm</text>
                        
                        <!-- Trapezoid Height 12 -->
                        <line x1="75" y1="70" x2="75" y2="310" class="dimension-line" />
                        <line x1="70" y1="70" x2="80" y2="70" class="dimension-line" />
                        <line x1="70" y1="310" x2="80" y2="310" class="dimension-line" />
                        <text x="45" y="195" class="dimension-text">12 cm</text>
                        
                        <!-- Inner Parallelogram base 5 -->
                        <line x1="180" y1="85" x2="280" y2="85" class="dimension-line" stroke="#60a5fa" />
                        <line x1="180" y1="80" x2="180" y2="90" class="dimension-line" stroke="#60a5fa" />
                        <line x1="280" y1="80" x2="280" y2="90" class="dimension-line" stroke="#60a5fa" />
                        <text x="230" y="78" class="dimension-text" fill="#60a5fa">5 cm</text>
                        
                        <!-- Inner height 6 -->
                        <line x1="340" y1="100" x2="340" y2="220" class="dimension-dash" stroke="#60a5fa" />
                        <text x="355" y="165" class="dimension-text" fill="#60a5fa">6 cm</text>
                    `;
                }
            },
            {
                title: "畫框留白",
                instruction: "一塊大長方形木板（底 16、高 12），中間挖掉一個小長方形當作畫框的開口（底 8、高 6）。求剩下木板的面積。",
                tip: "提示：先算出整塊大長方形的面積，再減掉中間挖掉的小長方形面積。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "大長方形甲",
                        inputs: { base: 16, height: 12, area: 192 },
                        svgPoints: "110,290 366,290 366,98 110,98"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "parallelogram",
                        label: "挖空長方形乙",
                        inputs: { base: 8, height: 6, area: 48 },
                        svgPoints: "174,242 302,242 302,146 174,146"
                    }
                ],
                totalFormula: ["A", "-", "B"],
                totalArea: 144,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：外框大長方形 -->
                        <polygon points="110,290 366,290 366,98 110,98" class="svg-region parallelogram-fill" data-part="A" />
                        <!-- Part B：中央挖空，以虛線與低透明度表示「被拿掉」 -->
                        <polygon points="174,242 302,242 302,146 174,146" class="svg-region parallelogram-fill" data-part="B" stroke-dasharray="4,4" fill-opacity="0.1" style="stroke: #f43f5e;" />

                        <!-- Labels -->
                        <text x="238" y="125" class="dimension-text" font-size="20">甲 (主體)</text>
                        <text x="238" y="199" class="dimension-text" font-size="16" fill="#f43f5e">乙 (挖空)</text>

                        <!-- 大長方形底 16 -->
                        <line x1="110" y1="310" x2="366" y2="310" class="dimension-line" />
                        <line x1="110" y1="305" x2="110" y2="315" class="dimension-line" />
                        <line x1="366" y1="305" x2="366" y2="315" class="dimension-line" />
                        <text x="238" y="330" class="dimension-text">16 cm</text>

                        <!-- 大長方形高 12 -->
                        <line x1="88" y1="98" x2="88" y2="290" class="dimension-line" />
                        <line x1="83" y1="98" x2="93" y2="98" class="dimension-line" />
                        <line x1="83" y1="290" x2="93" y2="290" class="dimension-line" />
                        <text x="58" y="198" class="dimension-text">12 cm</text>

                        <!-- 挖空底 8 -->
                        <line x1="174" y1="262" x2="302" y2="262" class="dimension-line" stroke="#f43f5e" />
                        <line x1="174" y1="257" x2="174" y2="267" class="dimension-line" stroke="#f43f5e" />
                        <line x1="302" y1="257" x2="302" y2="267" class="dimension-line" stroke="#f43f5e" />
                        <text x="238" y="281" class="dimension-text" fill="#f472b6">8 cm</text>

                        <!-- 挖空高 6 -->
                        <line x1="388" y1="146" x2="388" y2="242" class="dimension-line" stroke="#f43f5e" />
                        <line x1="383" y1="146" x2="393" y2="146" class="dimension-line" stroke="#f43f5e" />
                        <line x1="383" y1="242" x2="393" y2="242" class="dimension-line" stroke="#f43f5e" />
                        <text x="416" y="199" class="dimension-text" fill="#f472b6">6 cm</text>
                    `;
                }
            },
            {
                title: "屋頂天窗",
                instruction: "一片三角形屋頂（底 16、高 10），下方挖了一個三角形的天窗（底 6、高 4）。求剩下屋瓦的面積。",
                tip: "提示：大三角形面積減去小三角形面積。兩個都要記得「÷ 2」喔！",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "triangle",
                        label: "大三角形甲",
                        inputs: { base: 16, height: 10, area: 80 },
                        svgPoints: "110,290 366,290 238,130"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "挖空三角形乙",
                        inputs: { base: 6, height: 4, area: 12 },
                        svgPoints: "190,290 286,290 238,226"
                    }
                ],
                totalFormula: ["A", "-", "B"],
                totalArea: 68,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：大三角形屋頂 -->
                        <polygon points="110,290 366,290 238,130" class="svg-region triangle-fill" data-part="A" />
                        <!-- Part B：天窗挖空 -->
                        <polygon points="190,290 286,290 238,226" class="svg-region triangle-fill" data-part="B" stroke-dasharray="4,4" fill-opacity="0.1" style="stroke: #f43f5e;" />

                        <!-- Labels -->
                        <text x="238" y="200" class="dimension-text" font-size="20">甲 (主體)</text>
                        <text x="238" y="278" class="dimension-text" font-size="15" fill="#f43f5e">乙</text>

                        <!-- 大三角形底 16 -->
                        <line x1="110" y1="310" x2="366" y2="310" class="dimension-line" />
                        <line x1="110" y1="305" x2="110" y2="315" class="dimension-line" />
                        <line x1="366" y1="305" x2="366" y2="315" class="dimension-line" />
                        <text x="238" y="330" class="dimension-text">16 cm</text>

                        <!-- 大三角形高 10（虛線標示高的位置 + 右側標註） -->
                        <line x1="238" y1="130" x2="238" y2="290" class="dimension-dash" />
                        <path d="M 238,280 L 248,280 L 248,290" fill="none" stroke="#94a3b8" />
                        <line x1="390" y1="130" x2="390" y2="290" class="dimension-line" />
                        <line x1="385" y1="130" x2="395" y2="130" class="dimension-line" />
                        <line x1="385" y1="290" x2="395" y2="290" class="dimension-line" />
                        <text x="420" y="215" class="dimension-text">10 cm</text>

                        <!-- 天窗底 6 -->
                        <line x1="190" y1="305" x2="286" y2="305" class="dimension-line" stroke="#f43f5e" />
                        <line x1="190" y1="300" x2="190" y2="310" class="dimension-line" stroke="#f43f5e" />
                        <line x1="286" y1="300" x2="286" y2="310" class="dimension-line" stroke="#f43f5e" />
                        <text x="238" y="352" class="dimension-text" fill="#f472b6">6 cm</text>

                        <!-- 天窗高 4 -->
                        <line x1="150" y1="226" x2="150" y2="290" class="dimension-line" stroke="#f43f5e" />
                        <line x1="145" y1="226" x2="155" y2="226" class="dimension-line" stroke="#f43f5e" />
                        <line x1="145" y1="290" x2="155" y2="290" class="dimension-line" stroke="#f43f5e" />
                        <text x="120" y="262" class="dimension-text" fill="#f472b6">4 cm</text>
                    `;
                }
            }
        ]
    },
    3: {
        title: "多重拆解與割補",
        stages: [
            {
                title: "小精靈飛鏢",
                instruction: "將圖形拆解成一個平行四邊形（中間）、一個右側三角形與一個上方三角形相加。",
                tip: "提示：中間平行四邊形底 10，高 7。右側三角形底 4，高 7。上方三角形底 10，高 4。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "平行四邊形甲",
                        inputs: { base: 10, height: 7, area: 70 },
                        svgPoints: "100,240 300,240 240,100 40,100"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "右側三角形乙",
                        inputs: { base: 4, height: 7, area: 14 },
                        svgPoints: "300,240 380,240 240,100"
                    },
                    {
                        id: "C",
                        name: "丙",
                        type: "triangle",
                        label: "上方三角形丙",
                        inputs: { base: 10, height: 4, area: 20 },
                        svgPoints: "40,100 240,100 140,20"
                    }
                ],
                totalFormula: ["A", "+", "B", "+", "C"],
                totalArea: 104,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A -->
                        <polygon points="100,240 300,240 240,100 40,100" class="svg-region parallelogram-fill" data-part="A" />
                        <!-- Part B -->
                        <polygon points="300,240 380,240 240,100" class="svg-region triangle-fill" data-part="B" />
                        <!-- Part C -->
                        <polygon points="40,100 240,100 140,20" class="svg-region triangle-fill" data-part="C" style="stroke: #a5b4fc; fill: rgba(165, 180, 252, 0.15);" />
                        
                        <!-- Internal boundaries -->
                        <line x1="240" y1="100" x2="300" y2="240" class="dimension-dash" />
                        <line x1="40" y1="100" x2="240" y2="100" class="dimension-dash" />
                        
                        <!-- Labels -->
                        <text x="170" y="170" class="dimension-text" font-size="20">甲</text>
                        <text x="280" y="190" class="dimension-text" font-size="20">乙</text>
                        <text x="140" y="70" class="dimension-text" font-size="20">丙</text>
                        
                        <!-- Dimensions -->
                        <!-- Parallelogram Base 10 -->
                        <line x1="100" y1="260" x2="300" y2="260" class="dimension-line" />
                        <line x1="100" y1="255" x2="100" y2="265" class="dimension-line" />
                        <line x1="300" y1="255" x2="300" y2="265" class="dimension-line" />
                        <text x="200" y="278" class="dimension-text">10 cm</text>
                        
                        <!-- Triangle B base 4 -->
                        <line x1="300" y1="260" x2="380" y2="260" class="dimension-line" />
                        <line x1="380" y1="255" x2="380" y2="265" class="dimension-line" />
                        <text x="340" y="278" class="dimension-text">4 cm</text>
                        
                        <!-- Main Height 7 -->
                        <line x1="25" y1="100" x2="25" y2="240" class="dimension-line" />
                        <line x1="20" y1="100" x2="30" y2="100" class="dimension-line" />
                        <line x1="20" y1="240" x2="30" y2="240" class="dimension-line" />
                        <text x="10" y="175" class="dimension-text">7 cm</text>
                        
                        <!-- Top triangle height 4 -->
                        <line x1="255" y1="20" x2="255" y2="100" class="dimension-line" />
                        <line x1="250" y1="20" x2="260" y2="20" class="dimension-line" />
                        <line x1="250" y1="100" x2="260" y2="100" class="dimension-line" />
                        <text x="270" y="65" class="dimension-text">4 cm</text>
                        
                        <!-- Top Triangle base line indicator -->
                        <line x1="140" y1="20" x2="140" y2="100" class="dimension-dash" />
                    `;
                }
            },
            {
                title: "城堡之塔",
                instruction: "此圖形可拆解為：一個梯形（底座），加上一個頂部三角形，扣除底部一個三角形缺口。",
                tip: "提示：計算梯形（甲，上底10，下底16，高10）＋ 三角形（乙，底10，高6）－ 三角形（丙，底4，高3）。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "trapezoid",
                        label: "梯形甲",
                        inputs: { upper: 10, lower: 16, height: 10, area: 130 },
                        svgPoints: "120,120 320,120 380,280 60,280"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "頂部三角形乙",
                        inputs: { base: 10, height: 6, area: 30 },
                        svgPoints: "120,120 320,120 220,30"
                    },
                    {
                        id: "C",
                        name: "丙",
                        type: "triangle",
                        label: "底部缺口三角形丙",
                        inputs: { base: 4, height: 3, area: 6 },
                        svgPoints: "180,280 260,280 220,230"
                    }
                ],
                totalFormula: ["A", "+", "B", "-", "C"],
                totalArea: 154,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Outer Shape with subtraction represented -->
                        <!-- Part A (Trapezoid with cutout) -->
                        <polygon points="120,120 320,120 380,280 260,280 220,230 180,280 60,280" class="svg-region trapezoid-fill" data-part="A" />
                        <!-- Part B (Top Triangle) -->
                        <polygon points="120,120 320,120 220,30" class="svg-region triangle-fill" data-part="B" />
                        <!-- Part C (Cutout Triangle) -->
                        <polygon points="180,280 260,280 220,230" class="svg-region triangle-fill" data-part="C" stroke-dasharray="3,3" fill="#1e1b4b" fill-opacity="0.85" stroke="#f43f5e" />
                        
                        <!-- Boundaries -->
                        <line x1="120" y1="120" x2="320" y2="120" class="dimension-dash" />
                        
                        <!-- Labels -->
                        <text x="220" y="190" class="dimension-text" font-size="20">甲</text>
                        <text x="220" y="90" class="dimension-text" font-size="20">乙</text>
                        <text x="220" y="260" class="dimension-text" font-size="14" fill="#f43f5e">丙</text>
                        
                        <!-- Dimensions -->
                        <!-- Top triangle base / trapezoid upper: 10 -->
                        <text x="220" y="135" class="dimension-text" font-size="12">10 cm</text>
                        
                        <!-- Bottom base 16 -->
                        <line x1="60" y1="305" x2="380" y2="305" class="dimension-line" />
                        <line x1="60" y1="300" x2="60" y2="310" class="dimension-line" />
                        <line x1="380" y1="300" x2="380" y2="310" class="dimension-line" />
                        <text x="220" y="322" class="dimension-text">16 cm</text>
                        
                        <!-- Trapezoid Height 10 -->
                        <line x1="40" y1="120" x2="40" y2="280" class="dimension-line" />
                        <line x1="35" y1="120" x2="45" y2="120" class="dimension-line" />
                        <line x1="35" y1="280" x2="45" y2="280" class="dimension-line" />
                        <text x="15" y="205" class="dimension-text">10 cm</text>
                        
                        <!-- Top triangle height 6 -->
                        <line x1="340" y1="30" x2="340" y2="120" class="dimension-line" />
                        <line x1="335" y1="30" x2="345" y2="30" class="dimension-line" />
                        <line x1="335" y1="120" x2="345" y2="120" class="dimension-line" />
                        <text x="360" y="80" class="dimension-text">6 cm</text>
                        <line x1="220" y1="30" x2="220" y2="120" class="dimension-dash" />
                        
                        <!-- Cutout Triangle Specs -->
                        <!-- Cutout base 4 -->
                        <line x1="180" y1="290" x2="260" y2="290" class="dimension-line" stroke="#f43f5e" />
                        <text x="220" y="287" class="dimension-text" font-size="11" fill="#f472b6">4 cm</text>
                        
                        <!-- Cutout height 3 -->
                        <line x1="220" y1="230" x2="220" y2="280" class="dimension-dash" stroke="#f43f5e" />
                        <text x="232" y="248" class="dimension-text" font-size="11" fill="#f472b6">3 cm</text>
                    `;
                }
            },
            {
                title: "三階石梯",
                instruction: "這是一座三階的石梯，可以由下而上切成三個長方形。分別算出面積後全部相加。",
                tip: "提示：三階的高都是 4，底由下往上分別是 12、8、4。長方形用「底 × 高」計算。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "parallelogram",
                        label: "長方形甲 (最下階)",
                        inputs: { base: 12, height: 4, area: 48 },
                        svgPoints: "100,300 292,300 292,236 100,236"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "parallelogram",
                        label: "長方形乙 (中間階)",
                        inputs: { base: 8, height: 4, area: 32 },
                        svgPoints: "100,236 228,236 228,172 100,172"
                    },
                    {
                        id: "C",
                        name: "丙",
                        type: "parallelogram",
                        label: "長方形丙 (最上階)",
                        inputs: { base: 4, height: 4, area: 16 },
                        svgPoints: "100,172 164,172 164,108 100,108"
                    }
                ],
                totalFormula: ["A", "+", "B", "+", "C"],
                totalArea: 96,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：最下階 12 x 4 -->
                        <polygon points="100,300 292,300 292,236 100,236" class="svg-region parallelogram-fill" data-part="A" />
                        <!-- Part B：中間階 8 x 4 -->
                        <polygon points="100,236 228,236 228,172 100,172" class="svg-region parallelogram-fill" data-part="B" style="fill: rgba(165, 180, 252, 0.18); stroke: #a5b4fc;" />
                        <!-- Part C：最上階 4 x 4 -->
                        <polygon points="100,172 164,172 164,108 100,108" class="svg-region parallelogram-fill" data-part="C" style="fill: rgba(94, 234, 212, 0.18); stroke: #5eead4;" />

                        <!-- 階與階之間的切割線 -->
                        <line x1="100" y1="236" x2="292" y2="236" class="dimension-dash" />
                        <line x1="100" y1="172" x2="228" y2="172" class="dimension-dash" />

                        <!-- Labels -->
                        <text x="196" y="275" class="dimension-text" font-size="20">甲</text>
                        <text x="164" y="211" class="dimension-text" font-size="20">乙</text>
                        <text x="132" y="147" class="dimension-text" font-size="20">丙</text>

                        <!-- 甲的底 12 -->
                        <line x1="100" y1="320" x2="292" y2="320" class="dimension-line" />
                        <line x1="100" y1="315" x2="100" y2="325" class="dimension-line" />
                        <line x1="292" y1="315" x2="292" y2="325" class="dimension-line" />
                        <text x="196" y="340" class="dimension-text">12 cm</text>

                        <!-- 乙的底 8 -->
                        <line x1="100" y1="222" x2="228" y2="222" class="dimension-line" stroke="#a5b4fc" />
                        <line x1="228" y1="217" x2="228" y2="227" class="dimension-line" stroke="#a5b4fc" />
                        <text x="164" y="216" class="dimension-text" fill="#a5b4fc">8 cm</text>

                        <!-- 丙的底 4 -->
                        <line x1="100" y1="94" x2="164" y2="94" class="dimension-line" stroke="#5eead4" />
                        <line x1="100" y1="89" x2="100" y2="99" class="dimension-line" stroke="#5eead4" />
                        <line x1="164" y1="89" x2="164" y2="99" class="dimension-line" stroke="#5eead4" />
                        <text x="132" y="82" class="dimension-text" fill="#5eead4">4 cm</text>

                        <!-- 每階都是高 4：以右側標註一次 -->
                        <line x1="312" y1="236" x2="312" y2="300" class="dimension-line" />
                        <line x1="307" y1="236" x2="317" y2="236" class="dimension-line" />
                        <line x1="307" y1="300" x2="317" y2="300" class="dimension-line" />
                        <text x="340" y="275" class="dimension-text">4 cm</text>

                        <line x1="248" y1="172" x2="248" y2="236" class="dimension-line" stroke="#a5b4fc" />
                        <line x1="243" y1="172" x2="253" y2="172" class="dimension-line" stroke="#a5b4fc" />
                        <line x1="243" y1="236" x2="253" y2="236" class="dimension-line" stroke="#a5b4fc" />
                        <text x="276" y="211" class="dimension-text" fill="#a5b4fc">4 cm</text>

                        <line x1="184" y1="108" x2="184" y2="172" class="dimension-line" stroke="#5eead4" />
                        <line x1="179" y1="108" x2="189" y2="108" class="dimension-line" stroke="#5eead4" />
                        <line x1="179" y1="172" x2="189" y2="172" class="dimension-line" stroke="#5eead4" />
                        <text x="212" y="147" class="dimension-text" fill="#5eead4">4 cm</text>
                    `;
                }
            },
            {
                title: "風箏塔",
                instruction: "梯形塔身加上尖頂三角形，再扣掉底部挖空的三角形門洞。這題同時用到加法與減法。",
                tip: "提示：梯形上底 6、下底 12、高 8；尖頂三角形底 6、高 5；門洞三角形底 6、高 4。別忘了門洞要用「減」的。",
                parts: [
                    {
                        id: "A",
                        name: "甲",
                        type: "trapezoid",
                        label: "梯形甲 (塔身)",
                        inputs: { upper: 6, lower: 12, height: 8, area: 72 },
                        svgPoints: "130,300 322,300 274,172 178,172"
                    },
                    {
                        id: "B",
                        name: "乙",
                        type: "triangle",
                        label: "三角形乙 (尖頂)",
                        inputs: { base: 6, height: 5, area: 15 },
                        svgPoints: "178,172 274,172 226,92"
                    },
                    {
                        id: "C",
                        name: "丙",
                        type: "triangle",
                        label: "三角形丙 (門洞挖空)",
                        inputs: { base: 6, height: 4, area: 12 },
                        svgPoints: "178,300 274,300 226,236"
                    }
                ],
                totalFormula: ["A", "+", "B", "-", "C"],
                totalArea: 75,
                drawSvg(svg) {
                    svg.innerHTML = `
                        <!-- Part A：梯形塔身 -->
                        <polygon points="130,300 322,300 274,172 178,172" class="svg-region trapezoid-fill" data-part="A" />
                        <!-- Part B：尖頂三角形 -->
                        <polygon points="178,172 274,172 226,92" class="svg-region triangle-fill" data-part="B" />
                        <!-- Part C：門洞挖空 -->
                        <polygon points="178,300 274,300 226,236" class="svg-region triangle-fill" data-part="C" stroke-dasharray="4,4" fill-opacity="0.1" style="stroke: #f43f5e;" />

                        <!-- 塔身與尖頂的交界 -->
                        <line x1="178" y1="172" x2="274" y2="172" class="dimension-dash" />

                        <!-- Labels -->
                        <text x="226" y="215" class="dimension-text" font-size="20">甲</text>
                        <text x="226" y="158" class="dimension-text" font-size="18">乙</text>
                        <text x="226" y="288" class="dimension-text" font-size="15" fill="#f43f5e">丙</text>

                        <!-- 梯形下底 12 -->
                        <line x1="130" y1="320" x2="322" y2="320" class="dimension-line" />
                        <line x1="130" y1="315" x2="130" y2="325" class="dimension-line" />
                        <line x1="322" y1="315" x2="322" y2="325" class="dimension-line" />
                        <text x="226" y="340" class="dimension-text">12 cm</text>

                        <!-- 梯形上底 6（同時是尖頂三角形的底） -->
                        <line x1="178" y1="186" x2="274" y2="186" class="dimension-line" />
                        <line x1="178" y1="181" x2="178" y2="191" class="dimension-line" />
                        <line x1="274" y1="181" x2="274" y2="191" class="dimension-line" />
                        <text x="226" y="180" class="dimension-text">6 cm</text>

                        <!-- 梯形高 8（左側） -->
                        <line x1="108" y1="172" x2="108" y2="300" class="dimension-line" />
                        <line x1="103" y1="172" x2="113" y2="172" class="dimension-line" />
                        <line x1="103" y1="300" x2="113" y2="300" class="dimension-line" />
                        <text x="78" y="240" class="dimension-text">8 cm</text>

                        <!-- 尖頂高 5（右側），並以虛線標出高 -->
                        <line x1="226" y1="92" x2="226" y2="172" class="dimension-dash" />
                        <path d="M 226,162 L 236,162 L 236,172" fill="none" stroke="#94a3b8" />
                        <line x1="344" y1="92" x2="344" y2="172" class="dimension-line" />
                        <line x1="339" y1="92" x2="349" y2="92" class="dimension-line" />
                        <line x1="339" y1="172" x2="349" y2="172" class="dimension-line" />
                        <text x="372" y="136" class="dimension-text">5 cm</text>

                        <!-- 門洞高 4 -->
                        <line x1="152" y1="236" x2="152" y2="300" class="dimension-line" stroke="#f43f5e" />
                        <line x1="147" y1="236" x2="157" y2="236" class="dimension-line" stroke="#f43f5e" />
                        <line x1="147" y1="300" x2="157" y2="300" class="dimension-line" stroke="#f43f5e" />
                        <text x="124" y="272" class="dimension-text" fill="#f472b6">4 cm</text>

                        <!-- 門洞底 6 -->
                        <line x1="178" y1="312" x2="274" y2="312" class="dimension-line" stroke="#f43f5e" />
                        <text x="226" y="358" class="dimension-text" fill="#f472b6">門洞底 6 cm</text>
                    `;
                }
            }
        ]
    }
};

// Game State
// 從 localStorage 還原上次的進度（讀不到時會拿到全 0 的預設結構）
const savedProgress = GeoStorage.loadProgress(GAME_ID);

let gameState = {
    currentLevel: 1,
    currentStageIndex: 0,
    score: 0,
    errorsThisLevel: 0,
    levelErrors: { 1: 0, 2: 0, 3: 0 },
    completedLevels: {
        1: savedProgress[1].completed,
        2: savedProgress[2].completed,
        3: savedProgress[3].completed
    },
    levelStars: {
        1: savedProgress[1].stars,
        2: savedProgress[2].stars,
        3: savedProgress[3].stars
    },
    // 本關實際要作答的題目快照（已抽題）。抽樣只在 startLevel 發生一次。
    activeStages: [],
    activePartsCalculated: {} // stores partId: area when correct
};

/** 把星等與通關狀態寫回 localStorage */
function persistProgress() {
    GeoStorage.saveProgress(GAME_ID, {
        1: { stars: gameState.levelStars[1], completed: gameState.completedLevels[1] },
        2: { stars: gameState.levelStars[2], completed: gameState.completedLevels[2] },
        3: { stars: gameState.levelStars[3], completed: gameState.completedLevels[3] }
    });
}

// DOM References
const welcomeScreen = document.getElementById("welcomeScreen");
const mapScreen = document.getElementById("mapScreen");
const gameScreen = document.getElementById("gameScreen");
const completeScreen = document.getElementById("completeScreen");
const feedbackOverlay = document.getElementById("feedbackOverlay");
const formulasList = document.getElementById("formulasList");
const totalSection = document.getElementById("totalSection");
const totalCalcExpression = document.getElementById("totalCalcExpression");
const submitTotalAreaBtn = document.getElementById("submitTotalAreaBtn");
const compositeGeometrySvg = document.getElementById("compositeGeometrySvg");
const fireworksCanvas = document.getElementById("fireworksCanvas");

// Fireworks Canvas setup
const fxCtx = fireworksCanvas.getContext("2d");
let particles = [];

function resizeFxCanvas() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeFxCanvas);
resizeFxCanvas();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }
    draw() {
        fxCtx.save();
        fxCtx.globalAlpha = this.alpha;
        fxCtx.beginPath();
        fxCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        fxCtx.fillStyle = this.color;
        fxCtx.fill();
        fxCtx.restore();
    }
    update() {
        this.velocity.y += 0.05; // gravity
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }
}

function spawnFireworks(x, y) {
    const colors = ['#6366f1', '#10b981', '#fbbf24', '#f43f5e', '#a5b4fc', '#60a5fa'];
    for (let i = 0; i < 40; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
    }
}

function animateFireworks() {
    if (particles.length === 0) return;
    requestAnimationFrame(animateFireworks);
    fxCtx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    fxCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function startCelebration() {
    // 尊重系統的「減少動態效果」設定，前庭敏感的使用者不會被滿畫面粒子影響
    if (prefersReducedMotion) return;

    particles = [];
    resizeFxCanvas();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Spawn multiple bursts
    spawnFireworks(centerX, centerY - 100);
    setTimeout(() => spawnFireworks(centerX - 150, centerY - 50), 200);
    setTimeout(() => spawnFireworks(centerX + 150, centerY - 50), 400);
    
    animateFireworks();
}

// Global Sound toggle hook（開關狀態由 localStorage 還原，跨頁與重整都記得）
const soundToggle = document.getElementById("soundToggle");

function renderSoundIcon() {
    soundToggle.innerHTML = SoundEffects.enabled
        ? `<i class="fa-solid fa-volume-high"></i>`
        : `<i class="fa-solid fa-volume-xmark"></i>`;
    soundToggle.setAttribute("aria-pressed", String(SoundEffects.enabled));
    soundToggle.setAttribute("aria-label", SoundEffects.enabled ? "關閉音效" : "開啟音效");
}
renderSoundIcon();

soundToggle.addEventListener("click", () => {
    SoundEffects.enabled = !SoundEffects.enabled;
    renderSoundIcon();
    SoundEffects.playClick();
});

// 重新開始：清除本機進度，供課堂平板換人使用
const resetProgressBtn = document.getElementById("resetProgressBtn");
if (resetProgressBtn) {
    resetProgressBtn.addEventListener("click", () => {
        if (!window.confirm("確定要清除這款遊戲的所有關卡進度嗎？此動作無法復原。")) return;
        GeoStorage.clearProgress(GAME_ID);
        gameState.completedLevels = { 1: false, 2: false, 3: false };
        gameState.levelStars = { 1: 0, 2: 0, 3: 0 };
        updateMapScreen();
        SoundEffects.playClick();
    });
}

// 若瀏覽器不允許儲存（無痕視窗等），先告知使用者進度不會被保留
const storageHint = document.getElementById("storageHint");
if (storageHint && !GeoStorage.isAvailable()) {
    storageHint.textContent = "提醒：目前的瀏覽器設定無法儲存進度，關閉分頁後紀錄不會保留。";
}

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
    SoundEffects.playClick();
    showScreen(mapScreen);
    updateMapScreen();
});

// Map back button
document.getElementById("mapBackToWelcome").addEventListener("click", () => {
    SoundEffects.playClick();
    showScreen(welcomeScreen);
});

// Game back button
document.getElementById("gameBackToMap").addEventListener("click", () => {
    SoundEffects.playClick();
    showScreen(mapScreen);
    updateMapScreen();
});

// Complete back button
document.getElementById("completeBackToMap").addEventListener("click", () => {
    SoundEffects.playClick();
    showScreen(mapScreen);
    updateMapScreen();
});

// Next level complete button
document.getElementById("completeNextLevel").addEventListener("click", () => {
    SoundEffects.playClick();
    if (gameState.currentLevel < 3) {
        startLevel(gameState.currentLevel + 1);
    } else {
        showScreen(mapScreen);
        updateMapScreen();
    }
});

// Screen switcher helper
function showScreen(screenEl) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    screenEl.classList.add("active");
}

// Map screen builder
function updateMapScreen() {
    for (let l = 1; l <= 3; l++) {
        const levelCard = document.getElementById(`level${l}Card`);
        const starsEl = document.getElementById(`level${l}Stars`);
        const statusEl = document.getElementById(`level${l}StatusText`);
        
        // Render stars
        starsEl.innerHTML = "";
        const starCount = gameState.levelStars[l];
        for (let s = 0; s < 3; s++) {
            if (s < starCount) {
                starsEl.innerHTML += `<i class="fa-solid fa-star star-active"></i>`;
            } else {
                starsEl.innerHTML += `<i class="fa-regular fa-star"></i>`;
            }
        }
        
        if (gameState.completedLevels[l]) {
            statusEl.textContent = "已通關";
            statusEl.style.color = "var(--success)";
        } else {
            statusEl.textContent = "未挑戰";
            statusEl.style.color = "var(--text-muted)";
        }
        
        // Rebind click listener
        const playBtn = levelCard.querySelector(".level-play-btn");
        playBtn.onclick = (e) => {
            e.stopPropagation();
            SoundEffects.playClick();
            startLevel(l);
        };
    }
}

// Start Level
function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    gameState.currentStageIndex = 0;
    gameState.errorsThisLevel = 0;

    // 從該關的 4 道題目中隨機抽 3 題，重玩時題組不同
    gameState.activeStages = GeoRandom.sample(
        GAME_LEVELS[levelNum].stages,
        STAGES_PER_LEVEL
    );

    startStage();
}

// Get current stage metadata（讀本關快照，而非原始題庫）
function getCurrentStage() {
    return gameState.activeStages[gameState.currentStageIndex];
}

/** 更新圖形的文字描述，讓螢幕閱讀器使用者也知道這題要拆解成哪些部件 */
function updateSvgDescription(stage) {
    const desc = document.getElementById("svgDesc");
    if (!desc) return;
    const partList = stage.parts
        .map(p => `${p.name}是${getShapeChineseName(p.type)}`)
        .join("、");
    desc.textContent = `${stage.title}：${stage.instruction} 圖形可拆解為 ${stage.parts.length} 個部分，${partList}。`;
}

// Initialize the stage
function startStage() {
    const stage = getCurrentStage();
    gameState.activePartsCalculated = {};
    updateSvgDescription(stage);

    // Update Header Status
    document.getElementById("gameStageTitle").textContent = `關卡 0${gameState.currentLevel}：${GAME_LEVELS[gameState.currentLevel].title}`;
    const totalStages = gameState.activeStages.length;
    document.getElementById("progressText").textContent = `第 ${gameState.currentStageIndex + 1} / ${totalStages} 題`;
    document.getElementById("progressBarFill").style.width = `${((gameState.currentStageIndex + 1) / totalStages) * 100}%`;
    document.getElementById("currentScore").textContent = `得分：${gameState.score}`;
    
    // Draw SVG
    stage.drawSvg(compositeGeometrySvg);
    
    // Bind hover effect for SVG shapes
    const svgRegions = compositeGeometrySvg.querySelectorAll(".svg-region");
    svgRegions.forEach(reg => {
        reg.addEventListener("mouseenter", () => {
            const partId = reg.getAttribute("data-part");
            highlightSvgPart(partId, true);
            highlightFormulaCard(partId, true);
        });
        reg.addEventListener("mouseleave", () => {
            const partId = reg.getAttribute("data-part");
            highlightSvgPart(partId, false);
            highlightFormulaCard(partId, false);
        });
    });
    
    // Build initial formulas empty workspace state
    renderFormulasList();
    
    // Reset Step 3 Total Section
    totalSection.classList.add("locked");
    document.getElementById("submitTotalAreaBtn").disabled = true;
    totalCalcExpression.innerHTML = `<span>請先完成步驟 2 的部分面積計算</span>`;
    
    showScreen(gameScreen);
    
    // Setup shape buttons
    const selectButtons = document.querySelectorAll(".shape-select-btn");
    selectButtons.forEach(btn => {
        btn.onclick = () => {
            SoundEffects.playClick();
            const shapeType = btn.getAttribute("data-shape");
            addFormulaCard(shapeType);
        };
    });
}

function highlightSvgPart(partId, active) {
    const el = compositeGeometrySvg.querySelector(`[data-part="${partId}"]`);
    if (el) {
        if (active) {
            el.classList.add("hovered");
        } else {
            el.classList.remove("hovered");
        }
    }
}

function highlightFormulaCard(partId, active) {
    const card = document.querySelector(`.formula-card[data-part-id="${partId}"]`);
    if (card) {
        if (active) {
            card.style.borderColor = "var(--primary)";
            card.style.transform = "scale(1.02)";
        } else {
            card.style.borderColor = "";
            card.style.transform = "";
        }
    }
}

// Add formula card based on shape click
function addFormulaCard(shapeType) {
    const stage = getCurrentStage();
    
    // 找出這個形狀中「尚未驗算完成」且「尚未加入工作區」的部件。
    // 原本只排除 activePartsCalculated，所以同一題若有兩個相同形狀的部件
    // （例如「階梯轉角」的兩個長方形），第二次點擊會再次選中第一個部件，
    // 撞上下方的重複檢查而只捲動、加不進新卡片。
    const matchingPart = stage.parts.find(p =>
        p.type === shapeType
        && !gameState.activePartsCalculated[p.id]
        && !document.querySelector(`.formula-card[data-part-id="${p.id}"]`)
    );

    if (!matchingPart) {
        // 還有同形狀的卡片攤在工作區、只是尚未算完 → 帶使用者過去，而不是誤報「全部完成」
        const pendingCard = document.querySelector(`.formula-card[data-shape-type="${shapeType}"]`);
        if (pendingCard) {
            pendingCard.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        alert(`此題目中所有【${getShapeChineseName(shapeType)}】區塊皆已完成計算！`);
        return;
    }

    // Add to workspace
    const cardEl = document.createElement("div");
    cardEl.className = `formula-card ${shapeType}-theme`;
    cardEl.setAttribute("data-part-id", matchingPart.id);
    cardEl.setAttribute("data-shape-type", shapeType);
    
    // SVG hover bindings for card
    cardEl.addEventListener("mouseenter", () => highlightSvgPart(matchingPart.id, true));
    cardEl.addEventListener("mouseleave", () => highlightSvgPart(matchingPart.id, false));
    
    let formulaHtml = "";
    if (shapeType === "parallelogram") {
        formulaHtml = `
            <div class="formula-card-header">
                <span class="formula-card-title"><i class="fa-solid fa-square-envelope"></i> 區塊 ${matchingPart.name} (${matchingPart.label})</span>
                <button class="delete-formula-btn" title="刪除此計算"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="formula-expression">平行四邊形面積 = 底 × 高</div>
            <div class="formula-inputs">
                <input type="number" class="val-base" placeholder="底" min="1">
                <span>×</span>
                <input type="number" class="val-height" placeholder="高" min="1">
                <span>=</span>
                <input type="number" class="result-input val-area" placeholder="面積" min="1">
                <button class="verify-part-btn">驗證</button>
            </div>
        `;
    } else if (shapeType === "triangle") {
        formulaHtml = `
            <div class="formula-card-header">
                <span class="formula-card-title"><i class="fa-solid fa-play fa-rotate-270"></i> 區塊 ${matchingPart.name} (${matchingPart.label})</span>
                <button class="delete-formula-btn" title="刪除此計算"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="formula-expression">三角形面積 = 底 × 高 ÷ 2</div>
            <div class="formula-inputs">
                <input type="number" class="val-base" placeholder="底" min="1">
                <span>×</span>
                <input type="number" class="val-height" placeholder="高" min="1">
                <span>÷ 2 =</span>
                <input type="number" class="result-input val-area" placeholder="面積" min="1">
                <button class="verify-part-btn">驗證</button>
            </div>
        `;
    } else if (shapeType === "trapezoid") {
        formulaHtml = `
            <div class="formula-card-header">
                <span class="formula-card-title">
                    <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:3; margin-right:4px; vertical-align:middle;"><polygon points="6,6 18,6 22,18 2,18" /></svg>
                    區塊 ${matchingPart.name} (${matchingPart.label})
                </span>
                <button class="delete-formula-btn" title="刪除此計算"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="formula-expression">梯形面積 = (上底 + 下底) × 高 ÷ 2</div>
            <div class="formula-inputs">
                <span>(</span>
                <input type="number" class="val-upper" placeholder="上底" min="1">
                <span>+</span>
                <input type="number" class="val-lower" placeholder="下底" min="1">
                <span>) ×</span>
                <input type="number" class="val-height" placeholder="高" min="1">
                <span>÷ 2 =</span>
                <input type="number" class="result-input val-area" placeholder="面積" min="1">
                <button class="verify-part-btn">驗證</button>
            </div>
        `;
    }
    
    cardEl.innerHTML = formulaHtml;
    
    // Remove empty state if present
    const emptyState = formulasList.querySelector(".empty-state");
    if (emptyState) emptyState.remove();
    
    formulasList.appendChild(cardEl);
    
    // Wire delete button
    cardEl.querySelector(".delete-formula-btn").onclick = () => {
        SoundEffects.playClick();
        cardEl.remove();
        if (formulasList.children.length === 0) {
            renderFormulasList(); // show empty state again
        }
    };
    
    // Wire verify button
    cardEl.querySelector(".verify-part-btn").onclick = () => {
        verifyPartCalculation(cardEl, matchingPart);
    };
}

function getShapeChineseName(shapeType) {
    if (shapeType === "parallelogram") return "平行四邊形";
    if (shapeType === "triangle") return "三角形";
    if (shapeType === "trapezoid") return "梯形";
    return "";
}

function renderFormulasList() {
    formulasList.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-diagram-predecessor"></i>
            <p>尚未新增拆解圖形。請點擊上方按鈕開始拆解！</p>
        </div>
    `;
}

// Verify a single shape part calculation card
function verifyPartCalculation(cardEl, partData) {
    const type = partData.type;
    let isCorrect = false;
    
    if (type === "parallelogram") {
        const base = parseInt(cardEl.querySelector(".val-base").value);
        const height = parseInt(cardEl.querySelector(".val-height").value);
        const area = parseInt(cardEl.querySelector(".val-area").value);
        
        if (base === partData.inputs.base && height === partData.inputs.height && area === partData.inputs.area) {
            isCorrect = true;
        }
    } else if (type === "triangle") {
        const base = parseInt(cardEl.querySelector(".val-base").value);
        const height = parseInt(cardEl.querySelector(".val-height").value);
        const area = parseInt(cardEl.querySelector(".val-area").value);
        
        if (base === partData.inputs.base && height === partData.inputs.height && area === partData.inputs.area) {
            isCorrect = true;
        }
    } else if (type === "trapezoid") {
        const upper = parseInt(cardEl.querySelector(".val-upper").value);
        const lower = parseInt(cardEl.querySelector(".val-lower").value);
        const height = parseInt(cardEl.querySelector(".val-height").value);
        const area = parseInt(cardEl.querySelector(".val-area").value);
        
        if (upper === partData.inputs.upper && lower === partData.inputs.lower && height === partData.inputs.height && area === partData.inputs.area) {
            isCorrect = true;
        }
    }
    
    if (isCorrect) {
        SoundEffects.playPartCorrect();
        
        // Save correct calculation
        gameState.activePartsCalculated[partData.id] = partData.inputs.area;
        
        // Highlight part on SVG persistently
        const svgEl = compositeGeometrySvg.querySelector(`[data-part="${partData.id}"]`);
        if (svgEl) {
            svgEl.classList.add("selected-part");
        }
        
        // Transition card to locked/correct state
        cardEl.className = "formula-card correct";
        cardEl.innerHTML = `
            <div class="formula-card-header">
                <span class="formula-card-title" style="color:var(--success)"><i class="fa-solid fa-circle-check"></i> 區塊 ${partData.name} (${partData.label}) 算對了！</span>
                <span class="check-badge"><i class="fa-solid fa-check"></i></span>
            </div>
            <div class="formula-inputs">
                <span>面積 = <strong>${partData.inputs.area}</strong> cm²</span>
            </div>
        `;
        
        // Check if all parts of the stage are now calculated
        const stage = getCurrentStage();
        const allCalculated = stage.parts.every(p => gameState.activePartsCalculated[p.id] !== undefined);
        
        if (allCalculated) {
            enableTotalAreaCalculation();
        }
    } else {
        SoundEffects.playError();
        gameState.errorsThisLevel++;
        gameState.levelErrors[gameState.currentLevel]++;
        
        // Shake animation
        cardEl.classList.add("animate-shake");
        setTimeout(() => cardEl.classList.remove("animate-shake"), 500);
        
        alert("數字或算式面積有誤，請再仔細觀察圖形的標示尺寸喔！");
    }
}

// Add shake animation helper in CSS
// 注入自有的 <style> 元素，而非改寫 document.styleSheets[0]。
// 第一個樣式表是 Google Fonts CDN，屬跨來源資源，讀取其 cssRules 會觸發 SecurityError。
const shakeStyleEl = document.createElement("style");
shakeStyleEl.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
}
.animate-shake {
    animation: shake 0.4s ease;
}
`;
document.head.appendChild(shakeStyleEl);

// Unlock Step 3 and setup inputs
function enableTotalAreaCalculation() {
    const stage = getCurrentStage();
    totalSection.classList.remove("locked");
    submitTotalAreaBtn.disabled = false;
    
    // Construct equation dynamic layout based on totalFormula template
    // e.g. ["A", "+", "B"] or ["A", "+", "B", "-", "C"]
    totalCalcExpression.innerHTML = "";
    
    stage.totalFormula.forEach((token, index) => {
        if (token === "+" || token === "-") {
            // Dropdown selection to let user think whether it is add or subtract
            const selectEl = document.createElement("select");
            selectEl.className = "select-op";
            selectEl.id = `op_${index}`;
            selectEl.innerHTML = `
                <option value="+">+</option>
                <option value="-">-</option>
            `;
            totalCalcExpression.appendChild(selectEl);
        } else {
            // It's a shape part token (A, B, C)
            const part = stage.parts.find(p => p.id === token);
            const badgeEl = document.createElement("span");
            badgeEl.className = `total-part-badge ${part.type}-theme`;
            
            // Set style inline dynamically based on shape colors
            let color = "var(--color-parallelogram)";
            if (part.type === "triangle") color = "var(--color-triangle)";
            if (part.type === "trapezoid") color = "var(--color-trapezoid)";
            badgeEl.style.background = color;
            
            badgeEl.innerHTML = `區塊 ${part.name} (<strong>${gameState.activePartsCalculated[part.id]}</strong>)`;
            totalCalcExpression.appendChild(badgeEl);
        }
    });
    
    // Add equal sign and total input
    const equalSpan = document.createElement("span");
    equalSpan.textContent = "=";
    totalCalcExpression.appendChild(equalSpan);
    
    const finalInput = document.createElement("input");
    finalInput.type = "number";
    finalInput.className = "result-input-large";
    finalInput.id = "finalTotalInput";
    finalInput.placeholder = "總面積";
    totalCalcExpression.appendChild(finalInput);
    
    // Wire submit button
    submitTotalAreaBtn.onclick = () => {
        verifyTotalArea();
    };
}

// Verify step 3 equation
function verifyTotalArea() {
    const stage = getCurrentStage();
    
    // Check if operations are correct
    let mathValid = true;
    let expressionString = "";

    // 逐項累加求值。運算式只會出現 + 與 -，同優先級由左至右計算即可，
    // 因此不需要 eval——少一個執行任意字串的入口，也省下解析成本。
    let calculatedMathResult = 0;
    let pendingOp = "+";

    stage.totalFormula.forEach((token, index) => {
        if (token === "+" || token === "-") {
            const selectEl = document.getElementById(`op_${index}`);
            pendingOp = selectEl.value;
            expressionString += ` ${pendingOp} `;
        } else {
            const partArea = gameState.activePartsCalculated[token];
            expressionString += partArea;
            calculatedMathResult = (pendingOp === "+")
                ? calculatedMathResult + partArea
                : calculatedMathResult - partArea;
        }
    });
    const userFinalInput = parseInt(document.getElementById("finalTotalInput").value);
    
    // User must also select correct operations that lead to the final correct answer
    if (calculatedMathResult === stage.totalArea && userFinalInput === stage.totalArea) {
        // Solved stage!
        SoundEffects.playSuccess();
        startCelebration();
        showFeedback(true);
    } else {
        SoundEffects.playError();
        gameState.errorsThisLevel++;
        gameState.levelErrors[gameState.currentLevel]++;
        
        // Shake final area container
        const totalContainer = document.querySelector(".total-calc-container");
        totalContainer.classList.add("animate-shake");
        setTimeout(() => totalContainer.classList.remove("animate-shake"), 500);
        
        alert("運算符號選擇錯誤，或是最後的加減計算有誤喔！請再確認一次。");
    }
}

// Modal Feedback
function showFeedback(isSuccess) {
    feedbackOverlay.classList.add("active");
    const iconEl = document.getElementById("feedbackIcon");
    const titleEl = document.getElementById("feedbackResultTitle");
    const descEl = document.getElementById("feedbackExplanation");
    const tryBtn = document.getElementById("tryAgainBtn");
    const nextBtn = document.getElementById("nextQuestionBtn");
    
    if (isSuccess) {
        iconEl.className = "feedback-icon success-icon";
        iconEl.innerHTML = `<i class="fa-solid fa-trophy animate-bounce"></i>`;
        titleEl.textContent = "答對了！太棒了！";
        
        const stage = getCurrentStage();
        descEl.textContent = `答對了！複合圖形總面積確實是 ${stage.totalArea} cm²。你對複合圖形的拆解非常熟練！`;
        
        tryBtn.style.display = "none";
        nextBtn.style.display = "inline-flex";
        
        nextBtn.onclick = () => {
            feedbackOverlay.classList.remove("active");
            nextStage();
        };
    }
}

// Load next stage
function nextStage() {
    const totalStages = gameState.activeStages.length;
    if (gameState.currentStageIndex < totalStages - 1) {
        gameState.currentStageIndex++;
        gameState.score += 100;
        startStage();
    } else {
        // Finished Level
        gameState.score += 100;
        gameState.completedLevels[gameState.currentLevel] = true;
        
        // Calculate stars
        let stars = 3;
        if (gameState.errorsThisLevel >= 4) stars = 1;
        else if (gameState.errorsThisLevel >= 2) stars = 2;
        
        gameState.levelStars[gameState.currentLevel] = Math.max(stars, gameState.levelStars[gameState.currentLevel]);
        persistProgress(); // 寫入 localStorage，重整或關掉分頁後進度仍在

        showLevelComplete();
    }
}

// Complete Screen Display
function showLevelComplete() {
    showScreen(completeScreen);
    
    document.getElementById("completeTitle").textContent = `關卡 0${gameState.currentLevel} 挑戰成功！`;
    document.getElementById("completeSubtitle").textContent = `你已經順利完成了【${GAME_LEVELS[gameState.currentLevel].title}】的所有挑戰！`;
    
    const finalStars = document.getElementById("finalStars");
    finalStars.innerHTML = "";
    const starsEarned = gameState.levelStars[gameState.currentLevel];
    for (let s = 0; s < 3; s++) {
        if (s < starsEarned) {
            finalStars.innerHTML += `<i class="fa-solid fa-star animate-bounce" style="animation-delay:${s * 0.15}s"></i>`;
        } else {
            finalStars.innerHTML += `<i class="fa-regular fa-star"></i>`;
        }
    }
    
    const answeredCount = gameState.activeStages.length;
    document.getElementById("summaryCorrect").textContent = `${answeredCount} / ${answeredCount}`;
    document.getElementById("summaryErrors").textContent = gameState.errorsThisLevel;
    
    let starText = "完美三星級！無懈可擊！";
    if (starsEarned === 2) starText = "卓越二星級！非常棒！";
    if (starsEarned === 1) starText = "一星闖關成功！繼續加油！";
    document.getElementById("summaryStarsText").textContent = starText;
    
    const nextLvlBtn = document.getElementById("completeNextLevel");
    if (gameState.currentLevel < 3) {
        nextLvlBtn.style.display = "inline-flex";
        nextLvlBtn.querySelector("span").textContent = "挑戰下一關";
    } else {
        nextLvlBtn.style.display = "none";
    }
}
