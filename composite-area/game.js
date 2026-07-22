// Web Audio API Sound Synthesizer (Offline-friendly, premium micro-sounds)
const SoundEffects = {
    ctx: null,
    enabled: true,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playClick() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },
    playPartCorrect() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.start();
        osc.stop(now + 0.25);
    },
    playSuccess() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        
        osc2.frequency.setValueAtTime(261.63, now); // C4
        osc2.frequency.setValueAtTime(329.63, now + 0.1); // E4
        osc2.frequency.setValueAtTime(392.00, now + 0.2); // G4
        osc2.frequency.setValueAtTime(523.25, now + 0.3); // C5

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    },
    playError() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.25);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.start();
        osc.stop(now + 0.25);
    }
};

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
            }
        ]
    }
};

// Game State
let gameState = {
    currentLevel: 1,
    currentStageIndex: 0,
    score: 0,
    errorsThisLevel: 0,
    levelErrors: { 1: 0, 2: 0, 3: 0 },
    completedLevels: { 1: false, 2: false, 3: false },
    levelStars: { 1: 0, 2: 0, 3: 0 },
    activePartsCalculated: {} // stores partId: area when correct
};

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

// Global Sound toggle hook
const soundToggle = document.getElementById("soundToggle");
soundToggle.addEventListener("click", () => {
    SoundEffects.enabled = !SoundEffects.enabled;
    soundToggle.innerHTML = SoundEffects.enabled ? 
        `<i class="fa-solid fa-volume-high"></i>` : 
        `<i class="fa-solid fa-volume-xmark"></i>`;
    SoundEffects.playClick();
});

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
    startStage();
}

// Get current stage metadata
function getCurrentStage() {
    return GAME_LEVELS[gameState.currentLevel].stages[gameState.currentStageIndex];
}

// Initialize the stage
function startStage() {
    const stage = getCurrentStage();
    gameState.activePartsCalculated = {};
    
    // Update Header Status
    document.getElementById("gameStageTitle").textContent = `關卡 0${gameState.currentLevel}：${GAME_LEVELS[gameState.currentLevel].title}`;
    const totalStages = GAME_LEVELS[gameState.currentLevel].stages.length;
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
    
    // Find if there is an uncalculated part in the stage matching this shape type
    const matchingPart = stage.parts.find(p => p.type === shapeType && !gameState.activePartsCalculated[p.id]);
    
    if (!matchingPart) {
        // If all parts of this shape type are already calculated, notify user
        alert(`此題目中所有【${getShapeChineseName(shapeType)}】區塊皆已完成計算！`);
        return;
    }
    
    // Check if card for this part is already added to workspace
    const existingCard = document.querySelector(`.formula-card[data-part-id="${matchingPart.id}"]`);
    if (existingCard) {
        // Scroll or focus it
        existingCard.scrollIntoView({ behavior: 'smooth' });
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
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
}
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
.animate-shake {
    animation: shake 0.4s ease;
}
`, styleSheet.cssRules.length);

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
    
    stage.totalFormula.forEach((token, index) => {
        if (token === "+" || token === "-") {
            const selectEl = document.getElementById(`op_${index}`);
            expressionString += ` ${selectEl.value} `;
        } else {
            expressionString += gameState.activePartsCalculated[token];
        }
    });
    
    // Evaluate operations
    const calculatedMathResult = eval(expressionString);
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
    const totalStages = GAME_LEVELS[gameState.currentLevel].stages.length;
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
    
    document.getElementById("summaryCorrect").textContent = `${GAME_LEVELS[gameState.currentLevel].stages.length} / ${GAME_LEVELS[gameState.currentLevel].stages.length}`;
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
