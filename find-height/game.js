/**
 * 找高大作戰 - Core Game Script
 */

// --- Audio Synthesizer (Web Audio API) ---
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playCorrect() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Sweet bell/chime sound
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(523.25, now);
        osc2.frequency.setValueAtTime(659.25, now + 0.08);
        osc2.frequency.setValueAtTime(783.99, now + 0.16);
        osc2.frequency.setValueAtTime(1046.50, now + 0.24);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    }

    playIncorrect() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Gentle "boing" or low error sound
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        // Lowpass filter to make it warmer / softer
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playLevelComplete() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Cheerful fanfare
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            
            gainNode.gain.setValueAtTime(0, now + idx * 0.1);
            gainNode.gain.linearRampToValueAtTime(0.1, now + idx * 0.1 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
            
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.4);
        });
    }
}

const sound = new SoundEffects();

// --- Questions Database ---
// Coordinate Space: 500 x 380 (center approximately 250, 190)
const questionsData = {
    1: [ // Level 1: 平行四邊形 (指定底，求對應的高)
        {
            id: "l1_q1",
            shapeType: "parallelogram",
            shapePoints: [[100, 260], [380, 260], [430, 100], [150, 100]], // A, B, C, D (clockwise-ish)
            // Base is bottom side AB: from (100,260) to (380,260)
            basePoints: [[100, 260], [380, 260]],
            baseLabel: "底邊",
            // Candidates lines
            candidates: [
                {
                    // Correct: vertical from D(150,100) down to AB at (150,260)
                    line: [[150, 100], [150, 260]],
                    isCorrect: true,
                    label: "紅色線段 (甲)",
                    explanation: "正確！紅色線段從對邊頂點垂直到指定的底邊，並且有直角記號，代表這就是底邊相對應的「高」。",
                    rightAngle: [[150, 250], [160, 250], [160, 260]] // square corner
                },
                {
                    // Slanted side DA (150,100) to (100,260)
                    line: [[150, 100], [100, 260]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是平行四邊形的「斜邊」，它跟指定的底邊不垂直，所以不是高。"
                },
                {
                    // Incorrect: vertical from C(430,100) to some random point inside? Or wait, let's make it slanted line
                    line: [[380, 260], [430, 100]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是平行四邊形的另一條「斜邊」，與底邊不垂直。"
                },
                {
                    // Perpendicular to the slanted side AD, starting from B(380,260)
                    line: [[380, 260], [280, 228]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段垂直於斜邊，它是以斜邊為「底」時的對應高，而不是以底部粗線為底的高。"
                }
            ]
        },
        {
            id: "l1_q2",
            shapeType: "parallelogram",
            // Slanted vertical-ish parallelogram
            shapePoints: [[150, 300], [250, 300], [350, 80], [250, 80]],
            // Base is the slanted side AD (150,300) to (250,80)
            basePoints: [[150, 300], [250, 80]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted bottom side
                    line: [[150, 300], [250, 300]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是平行四邊形的底邊之一（與另一底邊不垂直）。"
                },
                {
                    // Perpendicular to base AD. Let's calculate: base vector is (100, -220). Normal vector is (220, 100).
                    // Correct: starts from C(350,80) and goes perpendicular to AD. 
                    // Let's place a visual perpendicular line: from (250,300) to (350,80)? No, that's BC.
                    // Correct line: from C(350,80) perpendicular to AD line.
                    // Visually: from (350,80) to (190, 212) or similar. Let's design coordinates cleanly:
                    // Base AD line: AD is slanted. Let's make base be BC (250,80) to (350,80)?
                    // Ah, let's make the base be the top side BC: (250,80) to (350,80).
                    // Then the height is vertical: from bottom side line up to top side line.
                    line: [[300, 80], [300, 300]],
                    isCorrect: true,
                    label: "藍色線段 (乙)",
                    explanation: "正確！藍色線段垂直於平行的上下兩底邊，連接了底邊與其對邊，是相對應的「高」。",
                    rightAngle: [[300, 90], [310, 90], [310, 80]]
                },
                {
                    // A slanted height line
                    line: [[250, 80], [150, 300]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是平行四邊形的側邊，與底邊並不垂直。"
                },
                {
                    // Perpendicular to AD but starting from B?
                    line: [[250, 300], [320, 150]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段與底邊不垂直，且方向不正確。"
                }
            ]
        },
        {
            id: "l1_q3",
            shapeType: "parallelogram",
            // Oriented with left/right sides as parallel bases!
            // Vertices: A(160, 280), B(160, 100), C(360, 140), D(360, 320)
            // Left edge is AB: from (160, 100) to (160, 280) - strictly vertical!
            // Right edge is CD: from (360, 140) to (360, 320) - strictly vertical!
            shapePoints: [[160, 280], [160, 100], [360, 140], [360, 320]],
            basePoints: [[160, 100], [160, 280]], // Left vertical side is base!
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted line connecting them
                    line: [[160, 100], [360, 140]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是平行四邊形的上方斜邊，它與左側垂直的底邊並不垂直。"
                },
                {
                    // Slanted line inside
                    line: [[160, 200], [360, 240]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段與左邊垂直的「底」有傾斜，並非垂直關係。"
                },
                {
                    // Correct height: strictly horizontal! From (160, 200) to (360, 200)
                    line: [[160, 200], [360, 200]],
                    isCorrect: true,
                    label: "橘色線段 (丙)",
                    explanation: "正確！因為底邊是左邊垂直的線段，與它相對應的「高」必須與它垂直，也就是水平方向的橘色線段。",
                    rightAngle: [[170, 200], [170, 210], [160, 210]]
                },
                {
                    // Diagonal
                    line: [[160, 280], [360, 140]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是對角線，並不與底邊垂直。"
                }
            ]
        },
        {
            id: "l1_q4",
            shapeType: "parallelogram",
            // A fat and wide parallelogram
            shapePoints: [[80, 240], [380, 240], [420, 140], [120, 140]],
            basePoints: [[120, 140], [420, 140]], // Top side is base
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted edge
                    line: [[120, 140], [80, 240]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是側邊（斜邊），不與上方的底邊垂直。"
                },
                {
                    // Slanted line
                    line: [[220, 140], [180, 240]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是傾斜的，不是垂直的高度。"
                },
                {
                    // Perpendicular to slanted side
                    line: [[380, 240], [348, 142]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段不是與上方指定底邊垂直的高。"
                },
                {
                    // Correct: vertical from bottom to top base
                    line: [[250, 140], [250, 240]],
                    isCorrect: true,
                    label: "綠色線段 (丁)",
                    explanation: "正確！綠色線段垂直於上方的底邊，且連接到對邊，這就是對應的「高」。",
                    rightAngle: [[250, 150], [260, 150], [260, 140]]
                }
            ]
        },
        {
            id: "l1_q5",
            shapeType: "parallelogram",
            // Vertically oriented parallel sides (rotated)
            // Left edge is CD, right edge is AB. Parallel bases are left and right.
            // Vertices: A(320, 80), B(320, 260), C(180, 300), D(180, 120)
            shapePoints: [[180, 300], [180, 120], [320, 80], [320, 260]],
            basePoints: [[320, 80], [320, 260]], // Right side is base
            baseLabel: "底邊",
            candidates: [
                {
                    // Correct: horizontal line from (180, 180) to (320, 180)
                    line: [[180, 180], [320, 180]],
                    isCorrect: true,
                    label: "紅色線段 (甲)",
                    explanation: "正確！底邊在右側垂直邊，因此對應的高必須是與其垂直的水平線段（紅色線段）。",
                    rightAngle: [[310, 180], [310, 190], [320, 190]]
                },
                {
                    // Top slanted side
                    line: [[180, 120], [320, 80]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是上方的斜邊，不是垂直於底邊的高。"
                },
                {
                    // Slanted cross-section
                    line: [[180, 240], [320, 200]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是傾斜的，它跟右側的底邊沒有垂直關係。"
                },
                {
                    // Bottom slanted side
                    line: [[180, 300], [320, 260]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是下方的斜邊，不能作為指定底邊的高。"
                }
            ]
        }
    ],
    2: [ // Level 2: 三角形 (正、等腰、直角、鈍角)
        {
            id: "l2_q1", // 正三角形
            shapeType: "triangle",
            shapePoints: [[150, 270], [350, 270], [250, 96.8]], // Equilateral: base 200, height ~173.2
            basePoints: [[150, 270], [350, 270]], // Bottom is base
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted left side
                    line: [[150, 270], [250, 96.8]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是正三角形的斜邊，跟底邊不垂直。"
                },
                {
                    // Correct: vertical height from top vertex to base center
                    line: [[250, 96.8], [250, 270]],
                    isCorrect: true,
                    label: "藍色線段 (乙)",
                    explanation: "正確！正三角形從頂點垂降到對面底邊的垂直線段就是對應的「高」。",
                    rightAngle: [[250, 260], [260, 260], [260, 270]]
                },
                {
                    // Slanted line
                    line: [[250, 96.8], [200, 270]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段雖然從頂點出發，但沒有與底邊垂直。"
                },
                {
                    // A line from bottom corner to opposite side perpendicularly
                    // That is the height for the slanted side base!
                    line: [[150, 270], [300, 183.4]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段雖然與右邊垂直，但那是「右邊為底」時的高，目前指定的底是「底部的黑線」喔！"
                }
            ]
        },
        {
            id: "l2_q2", // 等腰三角形 (底在斜邊)
            shapeType: "triangle",
            // Vertices: A(150, 250), B(350, 250), C(250, 100) (Isosceles, AB is 200, apex is C)
            // But let's designate base as slanted side AC: from (150, 250) to (250, 100)
            shapePoints: [[150, 250], [350, 250], [250, 100]],
            basePoints: [[150, 250], [250, 100]], // Slanted side AC is base
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted side BC
                    line: [[350, 250], [250, 100]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是另外一條斜邊，不是指定底邊的高。"
                },
                {
                    // Vertical line from C to AB (not perpendicular to AC)
                    line: [[250, 100], [250, 250]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是以底邊 AB 為底時的高，現在指定的底是左邊的斜邊。"
                },
                {
                    // Correct: perpendicular from opposite vertex B(350,250) to base AC
                    // Visually let's place it at: from (350, 250) to (212, 158)
                    line: [[350, 250], [202, 172]],
                    isCorrect: true,
                    label: "橘色線段 (丙)",
                    explanation: "正確！橘色線段從對角頂點出發，垂直地連接到指定的斜底邊，這就是相對應的「高」。",
                    rightAngle: [[208, 163], [217, 169], [211, 178]]
                },
                {
                    // Line from B to AC but not perpendicular (slanted)
                    line: [[350, 250], [180, 205]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段雖然連到指定的底邊，但是與其不垂直。"
                }
            ]
        },
        {
            id: "l2_q3", // 直角三角形
            shapeType: "triangle",
            // Right triangle: A(150,260), B(350,260), C(150,100). Right angle at A.
            // Base is bottom leg AB: from (150,260) to (350,260)
            shapePoints: [[150, 260], [350, 260], [150, 100]],
            basePoints: [[150, 260], [350, 260]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Correct: The vertical leg AC itself! It goes from (150,260) to (150,100)
                    line: [[150, 260], [150, 100]],
                    isCorrect: true,
                    label: "紅色線段 (甲)",
                    explanation: "正確！直角三角形非常特殊，當一條直角邊為「底」時，另一條直角邊（紅色線段）就是它的「高」。",
                    rightAngle: [[150, 250], [160, 250], [160, 260]]
                },
                {
                    // Hypotenuse BC
                    line: [[350, 260], [150, 100]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是直角三角形的「斜邊」，它跟指定的底邊並不垂直。"
                },
                {
                    // Height perpendicular to hypotenuse
                    line: [[150, 260], [212, 210]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是「斜邊為底」時的對應高，不是以底部直角邊為底的高。"
                },
                {
                    // Slanted line inside
                    line: [[150, 100], [250, 260]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段從頂點出發到斜邊中點，但它並不與底邊垂直。"
                }
            ]
        },
        {
            id: "l2_q4", // 鈍角三角形 (高在外部)
            shapeType: "triangle",
            // Vertices: A(220, 260), B(380, 260), C(150, 120)
            // Obtuse angle is at A (angle CAB > 90 deg). 
            // Specified Base is AB: from (220,260) to (380,260).
            // The top vertex C(150,120) is to the left of A(220,260).
            // Thus, we draw base extension from A(220,260) to the left: to (150,260).
            // Correct height drops from C(150,120) vertically down to the extension at (150,260).
            shapePoints: [[220, 260], [380, 260], [150, 120]],
            basePoints: [[220, 260], [380, 260]],
            baseLabel: "底邊",
            extensionLine: [[220, 260], [140, 260]], // leftward extension
            candidates: [
                {
                    // Slanted side CA
                    line: [[150, 120], [220, 260]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是鈍角三角形的側邊，它不與底邊垂直。"
                },
                {
                    // Slanted side CB
                    line: [[150, 120], [380, 260]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是長斜邊，跟底邊不垂直。"
                },
                {
                    // Incorrect height inside (not perpendicular to base)
                    line: [[150, 120], [280, 260]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段雖然畫在三角形內部，但它與底邊傾斜，不是垂直的高。"
                },
                {
                    // Correct: vertical line outside to extension line
                    line: [[150, 120], [150, 260]],
                    isCorrect: true,
                    label: "綠色線段 (丁)",
                    explanation: "正確！這是鈍角三角形的經典題目。當底邊是底部短邊時，高會在「外部」，必須畫延長線，並從頂點向下作垂直線（綠色線段）。",
                    rightAngle: [[150, 250], [160, 250], [160, 260]]
                }
            ]
        },
        {
            id: "l2_q5", // 鈍角三角形 (指定長邊為底，高在內部)
            shapeType: "triangle",
            // Vertices: A(120, 220), B(400, 220), C(180, 180) -> Obtuse angle at C.
            // Let's design: A(100, 280), B(400, 280), C(200, 240) - obtuse triangle.
            // Wait, let's make it: Base is the longest side AB (100, 280) to (400, 280).
            // Apex is C(220, 120). (Angle ACB is obtuse, e.g. C is at (220, 200)? No, let's make C(220, 200) and bases at (100,280) and (400,280).
            // Then the height is inside, from C(220,200) vertically down to AB at (220,280).
            shapePoints: [[100, 280], [400, 280], [220, 200]],
            basePoints: [[100, 280], [400, 280]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Correct: from C(220,200) to (220,280)
                    line: [[220, 200], [220, 280]],
                    isCorrect: true,
                    label: "紅色線段 (甲)",
                    explanation: "正確！雖然這是一個鈍角三角形，但因為指定的底是長邊，對角頂點垂降下來的高（紅色線段）仍然會落在三角形的內部。",
                    rightAngle: [[220, 270], [230, 270], [230, 280]]
                },
                {
                    // Slanted edge CA
                    line: [[220, 200], [100, 280]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是側邊，跟底邊不垂直。"
                },
                {
                    // Slanted edge CB
                    line: [[220, 200], [400, 280]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是另一條側邊，不是垂直的高。"
                },
                {
                    // Slanted line
                    line: [[220, 200], [300, 280]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段不是垂直的垂線。"
                }
            ]
        }
    ],
    3: [ // Level 3: 梯形 (等腰、直角、左右平行)
        {
            id: "l3_q1", // 等腰梯形 (下底為指定底)
            shapeType: "trapezoid",
            // Vertices: A(100, 280), B(400, 280), C(320, 120), D(180, 120)
            shapePoints: [[100, 280], [400, 280], [320, 120], [180, 120]],
            basePoints: [[100, 280], [400, 280]], // Lower base AB is specified
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted leg DA
                    line: [[180, 120], [100, 280]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是等腰梯形的斜側邊，與底邊不垂直。"
                },
                {
                    // Correct: vertical from D(180,120) to base AB at (180,280)
                    line: [[180, 120], [180, 280]],
                    isCorrect: true,
                    label: "藍色線段 (乙)",
                    explanation: "正確！藍色線段是連接上下平行底邊的垂直距離，這就是梯形的「高」。",
                    rightAngle: [[180, 270], [190, 270], [190, 280]]
                },
                {
                    // Slanted line inside
                    line: [[180, 120], [230, 280]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是傾斜的，不符合垂直的要求。"
                },
                {
                    // Diagonal
                    line: [[180, 120], [400, 280]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是梯形的對角線，不是高。"
                }
            ]
        },
        {
            id: "l3_q2", // 直角梯形 (下底為指定底)
            shapeType: "trapezoid",
            // Vertices: A(150, 280), B(380, 280), C(320, 120), D(150, 120) -> Right angles at A and D
            shapePoints: [[150, 280], [380, 280], [320, 120], [150, 120]],
            basePoints: [[150, 280], [380, 280]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted leg CB
                    line: [[320, 120], [380, 280]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是右邊的斜側邊，不與底邊垂直。"
                },
                {
                    // Slanted internal line
                    line: [[320, 120], [250, 280]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是傾斜的線段。"
                },
                {
                    // Correct: vertical leg DA itself (150,120) to (150,280)
                    line: [[150, 120], [150, 280]],
                    isCorrect: true,
                    label: "橘色線段 (丙)",
                    explanation: "正確！直角梯形本身就有一條與上下底垂直的側邊，這條直角邊（橘色線段）就是這個直角梯形的高。",
                    rightAngle: [[150, 270], [160, 270], [160, 280]]
                },
                {
                    // Upper base CD
                    line: [[150, 120], [320, 120]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是梯形的上底，不是垂直的高。"
                }
            ]
        },
        {
            id: "l3_q3", // 左右平行的梯形 (平行邊在左右)
            shapeType: "trapezoid",
            // Left edge is CD (vertical-ish), right edge is AB (vertical-ish)
            // Let's make: C(180, 100), D(180, 300) -> Left side is strictly vertical (length 200)
            // A(360, 260), B(360, 140) -> Right side is strictly vertical (length 120)
            // Upper/lower slanted sides are AC: (360,260) to (180,300), and BD: (360,140) to (180,100)
            // Specified base is left side CD: (180, 100) to (180, 300)
            shapePoints: [[180, 100], [180, 300], [360, 260], [360, 140]],
            basePoints: [[180, 100], [180, 300]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted top side BC
                    line: [[360, 140], [180, 100]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是梯形的上方側邊，不與底邊垂直。"
                },
                {
                    // Slanted inside
                    line: [[360, 200], [180, 240]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是傾斜的，不與垂直底邊垂直。"
                },
                {
                    // Slanted bottom side DA
                    line: [[180, 300], [360, 260]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是下方側邊，不是高。"
                },
                {
                    // Correct: horizontal line connecting left and right parallel bases!
                    // e.g. from (360, 200) to (180, 200)
                    line: [[360, 200], [180, 200]],
                    isCorrect: true,
                    label: "綠色線段 (丁)",
                    explanation: "正確！當梯形的平行底邊位於左右兩側時，它的高必須是水平方向的垂直線段（綠色線段），代表左右兩平行底邊的距離。",
                    rightAngle: [[190, 200], [190, 210], [180, 210]]
                }
            ]
        },
        {
            id: "l3_q4", // 左右平行的梯形 (右側為指定底)
            shapeType: "trapezoid",
            // Vertices: C(160, 120), D(160, 280) -> Left vertical (length 160)
            // A(340, 240), B(340, 160) -> Right vertical (length 80)
            // Base is the right vertical side AB: from (340, 160) to (340, 240)
            shapePoints: [[160, 120], [160, 280], [340, 240], [340, 160]],
            basePoints: [[340, 160], [340, 240]],
            baseLabel: "底邊",
            candidates: [
                {
                    // Correct: horizontal height from (160, 200) to (340, 200)
                    line: [[160, 200], [340, 200]],
                    isCorrect: true,
                    label: "紅色線段 (甲)",
                    explanation: "正確！因為平行的兩底邊在左右，指定右側邊為底時，高就是水平橫跨兩底邊的紅色垂直線段。",
                    rightAngle: [[330, 200], [330, 210], [340, 210]]
                },
                {
                    // Left base
                    line: [[160, 120], [160, 280]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是另一邊的底，不是高。"
                },
                {
                    // Diagonal
                    line: [[160, 120], [340, 240]],
                    isCorrect: false,
                    label: "橘色線段 (丙)",
                    explanation: "不對喔！橘色線段是對角斜線，沒有與右邊底邊垂直。"
                },
                {
                    // Slanted edge
                    line: [[160, 280], [340, 240]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是底部的斜側邊，與底邊不垂直。"
                }
            ]
        },
        {
            id: "l3_q5", // 等腰梯形 (上底為指定底)
            shapeType: "trapezoid",
            // Vertices: A(100, 260), B(400, 260), C(300, 120), D(200, 120)
            // Upper base is CD: from (200,120) to (300,120)
            shapePoints: [[100, 260], [400, 260], [300, 120], [200, 120]],
            basePoints: [[200, 120], [300, 120]], // Upper base is specified
            baseLabel: "底邊",
            candidates: [
                {
                    // Slanted leg
                    line: [[200, 120], [100, 260]],
                    isCorrect: false,
                    label: "紅色線段 (甲)",
                    explanation: "不對喔！紅色線段是側邊，跟底邊不垂直。"
                },
                {
                    // Slanted line inside
                    line: [[250, 120], [210, 260]],
                    isCorrect: false,
                    label: "藍色線段 (乙)",
                    explanation: "不對喔！藍色線段是斜的，不是垂直的高度。"
                },
                {
                    // Correct: vertical from top base to bottom base
                    line: [[250, 120], [250, 260]],
                    isCorrect: true,
                    label: "橘色線段 (丙)",
                    explanation: "正確！橘色線段垂直於指定的上底邊，並且連接到下底邊，這就是梯形的高度。",
                    rightAngle: [[250, 130], [260, 130], [260, 120]]
                },
                {
                    // Lower base
                    line: [[100, 260], [400, 260]],
                    isCorrect: false,
                    label: "綠色線段 (丁)",
                    explanation: "不對喔！綠色線段是下底，並非與上底垂直的高。"
                }
            ]
        }
    ]
};

// --- Game State Management ---
const gameState = {
    currentScreen: 'welcomeScreen',
    currentLevel: null,
    currentQuestionIndex: 0,
    score: 0,
    errorsInLevel: 0,
    levelHistory: {
        1: { stars: 0, completed: false },
        2: { stars: 0, completed: false },
        3: { stars: 0, completed: false }
    }
};

// --- UI Navigation Helper ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    
    // Custom logic on screen entry
    if (screenId === 'mapScreen') {
        updateMapUI();
    }
}

function updateMapUI() {
    for (let lvl = 1; lvl <= 3; lvl++) {
        const history = gameState.levelHistory[lvl];
        const card = document.getElementById(`level${lvl}Card`);
        const starContainer = document.getElementById(`level${lvl}Stars`);
        const statusText = document.getElementById(`level${lvl}StatusText`);
        
        // Stars rendering
        starContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('i');
            if (i < history.stars) {
                star.className = 'fa-solid fa-star';
            } else {
                star.className = 'fa-regular fa-star';
            }
            starContainer.appendChild(star);
        }
        
        // Status text
        if (history.completed) {
            statusText.textContent = `已完成 (${history.stars} 星)`;
            statusText.style.color = '#34d399';
        } else {
            statusText.textContent = '未挑戰';
            statusText.style.color = '#94a3b8';
        }
    }
}

// --- Render Geometry SVG ---
function renderQuestionGeometry(question) {
    const svg = document.getElementById('gameGeometrySvg');
    svg.innerHTML = ''; // Clear previous elements
    
    // Create elements using namespace
    const svgNS = "http://www.w3.org/2000/svg";
    
    // 1. Draw the primary shape
    const polygon = document.createElementNS(svgNS, 'polygon');
    const pointsStr = question.shapePoints.map(p => p.join(',')).join(' ');
    polygon.setAttribute('points', pointsStr);
    polygon.className.baseVal = 'geo-polygon';
    svg.appendChild(polygon);
    
    // 2. Draw extension lines if any (obtuse triangles, etc.)
    if (question.extensionLine) {
        const extLine = document.createElementNS(svgNS, 'line');
        extLine.setAttribute('x1', question.extensionLine[0][0]);
        extLine.setAttribute('y1', question.extensionLine[0][1]);
        extLine.setAttribute('x2', question.extensionLine[1][0]);
        extLine.setAttribute('y2', question.extensionLine[1][1]);
        extLine.className.baseVal = 'geo-extension';
        svg.appendChild(extLine);
    }
    
    // 3. Draw candidate heights
    question.candidates.forEach((cand, idx) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', cand.line[0][0]);
        line.setAttribute('y1', cand.line[0][1]);
        line.setAttribute('x2', cand.line[1][0]);
        line.setAttribute('y2', cand.line[1][1]);
        line.setAttribute('id', `svgHeightLine_${idx}`);
        line.className.baseVal = `geo-height geo-height-${idx}`;
        
        // Add click listener directly on SVG lines too
        line.addEventListener('click', () => handleChoiceSelection(idx));
        
        svg.appendChild(line);
        
        // Draw right angle symbol if correct AND it has one defined
        if (cand.rightAngle) {
            const raPath = document.createElementNS(svgNS, 'path');
            const pathStr = `M ${cand.rightAngle[0].join(',')} L ${cand.rightAngle[1].join(',')} L ${cand.rightAngle[2].join(',')}`;
            raPath.setAttribute('d', pathStr);
            raPath.setAttribute('id', `svgRightAngle_${idx}`);
            raPath.className.baseVal = `geo-right-angle geo-right-angle-${idx}`;
            // Hide right angles initially or show? 
            // In textbooks, right angles are drawn on candidate heights to verify they are indeed perpendicular,
            // or they are only drawn on correct answers. Let's draw it but we can choose to hide/fade it.
            // Let's show right angle marks for all options that have them. In Level 2 & 3, we defined rightAngle only on the correct one.
            // Let's show it so they can verify it. It builds confidence in geometry!
            svg.appendChild(raPath);
        }
    });
    
    // 4. Draw the base (on top of other lines so it stands out clearly)
    const baseLine = document.createElementNS(svgNS, 'line');
    baseLine.setAttribute('x1', question.basePoints[0][0]);
    baseLine.setAttribute('y1', question.basePoints[0][1]);
    baseLine.setAttribute('x2', question.basePoints[1][0]);
    baseLine.setAttribute('y2', question.basePoints[1][1]);
    baseLine.className.baseVal = 'geo-base';
    svg.appendChild(baseLine);
    
    // 5. Draw text label for base
    const midX = (question.basePoints[0][0] + question.basePoints[1][0]) / 2;
    const midY = (question.basePoints[0][1] + question.basePoints[1][1]) / 2;
    
    // Offset label slightly perpendicular to the base vector
    const dx = question.basePoints[1][0] - question.basePoints[0][0];
    const dy = question.basePoints[1][1] - question.basePoints[0][1];
    const len = Math.sqrt(dx*dx + dy*dy);
    // perpendicular vector (normal)
    const nx = -dy / len;
    const ny = dx / len;
    
    // Offset by 22px
    const labelX = midX + nx * 22;
    const labelY = midY + ny * 22 + 4; // slight vertical adjustment
    
    const baseText = document.createElementNS(svgNS, 'text');
    baseText.setAttribute('x', labelX);
    baseText.setAttribute('y', labelY);
    baseText.setAttribute('fill', '#ffffff');
    baseText.setAttribute('font-size', '14');
    baseText.setAttribute('font-weight', 'bold');
    baseText.setAttribute('text-anchor', 'middle');
    baseText.textContent = question.baseLabel || '底';
    svg.appendChild(baseText);
}

// --- Gameplay Flow Controller ---
function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.errorsInLevel = 0;
    
    // Update screen headers
    let title = "第一關：平行四邊形";
    if (levelNum === 2) title = "第二關：三角形";
    if (levelNum === 3) title = "第三關：梯形";
    document.querySelector('.progress-title').textContent = title;
    
    loadQuestion();
    showScreen('gameScreen');
}

function loadQuestion() {
    const levelQuestions = questionsData[gameState.currentLevel];
    const currentQ = levelQuestions[gameState.currentQuestionIndex];
    
    // Update progress bar & score
    const totalQ = levelQuestions.length;
    const progressPercent = ((gameState.currentQuestionIndex + 1) / totalQ) * 100;
    document.getElementById('progressBarFill').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `第 ${gameState.currentQuestionIndex + 1} / ${totalQ} 題`;
    document.getElementById('currentScore').textContent = `得分：${gameState.score}`;
    
    // Render SVG
    renderQuestionGeometry(currentQ);
    
    // Populate Option Buttons
    currentQ.candidates.forEach((cand, idx) => {
        const btn = document.getElementById(`btnChoice${idx}`);
        btn.querySelector('.choice-text').textContent = cand.label;
        btn.className = `choice-btn color-${getBtnColorName(idx)}`;
        btn.disabled = false;
    });
}

function getBtnColorName(idx) {
    const colors = ['red', 'blue', 'orange', 'green'];
    return colors[idx] || 'red';
}

// Hover linking between Option Buttons and SVG lines
function setupHoverListeners() {
    for (let idx = 0; idx < 4; idx++) {
        const btn = document.getElementById(`btnChoice${idx}`);
        
        btn.addEventListener('mouseenter', () => {
            const svgLine = document.getElementById(`svgHeightLine_${idx}`);
            if (svgLine) {
                svgLine.classList.add('hovered');
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            const svgLine = document.getElementById(`svgHeightLine_${idx}`);
            if (svgLine) {
                svgLine.classList.remove('hovered');
            }
        });
    }
}

// --- Fireworks Particle System ---
class Fireworks {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrameId = null;
        this.active = false;
        
        // Handle resizing dynamically
        window.addEventListener('resize', () => {
            if (this.active) this.resize();
        });
    }
    
    init() {
        if (!this.canvas) {
            this.canvas = document.getElementById(this.canvasId);
            this.ctx = this.canvas.getContext('2d');
        }
    }
    
    resize() {
        this.init();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    start() {
        this.active = true;
        this.resize();
        this.particles = [];
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Create initial bursts
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.active) {
                    this.createBurst(
                        Math.random() * this.canvas.width,
                        Math.random() * (this.canvas.height * 0.5) + this.canvas.height * 0.1
                    );
                }
            }, i * 300);
        }
        
        this.animate();
    }
    
    stop() {
        this.active = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    createBurst(x, y) {
        const colors = [
            '#ff5e62', '#ff9966', '#ffea00', '#00ffcc', '#24fe41', '#f000ff', '#0072ff'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const count = 50 + Math.floor(Math.random() * 30);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01,
                color: color,
                radius: Math.random() * 3 + 1
            });
        }
    }
    
    animate() {
        if (!this.active) return;
        
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // gravity
            p.vx *= 0.98; // drag
            p.alpha -= p.decay;
            
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        if (Math.random() < 0.04 && this.particles.length < 150) {
            this.createBurst(
                Math.random() * this.canvas.width,
                Math.random() * (this.canvas.height * 0.5) + this.canvas.height * 0.1
            );
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}

const fireworks = new Fireworks('fireworksCanvas');

// Answer Selection Logic
function handleChoiceSelection(choiceIndex) {
    const levelQuestions = questionsData[gameState.currentLevel];
    const currentQ = levelQuestions[gameState.currentQuestionIndex];
    const chosenCandidate = currentQ.candidates[choiceIndex];
    
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const title = document.getElementById('feedbackResultTitle');
    const explanation = document.getElementById('feedbackExplanation');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const tryBtn = document.getElementById('tryAgainBtn');
    
    if (chosenCandidate.isCorrect) {
        sound.playCorrect();
        gameState.score += 20; // 5 questions total, max 100 points
        
        feedbackIcon.className = 'feedback-icon correct';
        feedbackIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        title.textContent = '答對了！';
        title.style.color = 'var(--color-green)';
        explanation.innerHTML = `<div style="text-align: left; padding: 0 10px;">
            <p style="color: var(--color-green); font-weight: bold; margin-bottom: 8px; font-size: 1.05rem;">🎉 答對囉！</p>
            <p style="line-height: 1.6;">${chosenCandidate.explanation}</p>
        </div>`;
        
        nextBtn.style.display = 'inline-flex';
        tryBtn.style.display = 'none';
        
        // Start the fireworks!
        fireworks.start();
    } else {
        sound.playIncorrect();
        gameState.errorsInLevel += 1;
        
        feedbackIcon.className = 'feedback-icon incorrect';
        feedbackIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        title.textContent = '答錯了喔！';
        title.style.color = 'var(--color-red)';
        explanation.innerHTML = `<div style="text-align: left; padding: 0 10px;">
            <p style="color: #eab308; font-weight: bold; margin-bottom: 12px; font-size: 1.05rem;">
                💡 想一想，圖形的指定底和相對應的高有什麼關係？
            </p>
            <p style="margin-top: 8px; line-height: 1.6; border-left: 3px solid var(--color-red); padding-left: 10px;">
                <strong>選錯的理由：</strong>${chosenCandidate.explanation}
            </p>
        </div>`;
        
        nextBtn.style.display = 'none';
        tryBtn.style.display = 'inline-flex';
        
        // Disable this incorrect button to prevent double clicking
        document.getElementById(`btnChoice${choiceIndex}`).disabled = true;
    }
    
    feedbackOverlay.classList.add('active');
}

// Progressing to Next Question or Completion Screen
function nextQuestion() {
    fireworks.stop();
    document.getElementById('feedbackOverlay').classList.remove('active');
    
    const levelQuestions = questionsData[gameState.currentLevel];
    if (gameState.currentQuestionIndex < levelQuestions.length - 1) {
        gameState.currentQuestionIndex += 1;
        loadQuestion();
    } else {
        // Level complete!
        finishLevel();
    }
}

function finishLevel() {
    sound.playLevelComplete();
    
    // Evaluate Stars based on errors
    let stars = 3;
    if (gameState.errorsInLevel >= 1 && gameState.errorsInLevel <= 2) {
        stars = 2;
    } else if (gameState.errorsInLevel > 2) {
        stars = 1;
    }
    
    // Save to history
    if (stars > gameState.levelHistory[gameState.currentLevel].stars) {
        gameState.levelHistory[gameState.currentLevel].stars = stars;
    }
    gameState.levelHistory[gameState.currentLevel].completed = true;
    
    // Render Complete Screen details
    let levelName = "平行四邊形";
    if (gameState.currentLevel === 2) levelName = "三角形";
    if (gameState.currentLevel === 3) levelName = "梯形";
    
    document.getElementById('completeSubtitle').textContent = `你已經完成「${levelName}」的全部挑戰！`;
    document.getElementById('summaryCorrect').textContent = `5 / 5`;
    document.getElementById('summaryErrors').textContent = `${gameState.errorsInLevel} 次`;
    
    let starText = "三星級 (完美解鎖!)";
    if (stars === 2) starText = "二星級 (做得很好!)";
    if (stars === 1) starText = "一星級 (再接再厲!)";
    document.getElementById('summaryStarsText').textContent = starText;
    
    // Render stars on UI
    const finalStarsContainer = document.getElementById('finalStars');
    finalStarsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const star = document.createElement('i');
        star.className = 'fa-solid fa-star';
        if (i < stars) {
            star.classList.add('filled');
        }
        finalStarsContainer.appendChild(star);
    }
    
    // Handle Next Level Button
    const nextLevelBtn = document.getElementById('completeNextLevel');
    if (gameState.currentLevel < 3) {
        nextLevelBtn.style.display = 'inline-flex';
        nextLevelBtn.onclick = () => {
            startLevel(gameState.currentLevel + 1);
        };
    } else {
        nextLevelBtn.style.display = 'none';
    }
    
    showScreen('completeScreen');
}

// --- Background Decorative Elements Generator ---
function createBgElements() {
    const bgContainer = document.getElementById('bgDecorations');
    const shapeClasses = ['fa-circle', 'fa-square', 'fa-triangle', 'fa-star'];
    
    // Generate 8 small decorative shapes drifting slowly
    for (let i = 0; i < 8; i++) {
        const icon = document.createElement('i');
        // FontAwesome shapes
        icon.className = `fa-solid ${getRandomShape()} bg-drift-shape`;
        icon.style.left = `${Math.random() * 90 + 5}%`;
        icon.style.top = `${Math.random() * 90 + 5}%`;
        icon.style.fontSize = `${Math.random() * 20 + 15}px`;
        icon.style.animationDelay = `${Math.random() * 10}s`;
        icon.style.animationDuration = `${Math.random() * 15 + 15}s`;
        bgContainer.appendChild(icon);
    }
}

function getRandomShape() {
    const shapes = ['fa-circle', 'fa-square', 'fa-play', 'fa-star'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

// --- Initialization and DOM Bindings ---
document.addEventListener('DOMContentLoaded', () => {
    // Background decorations
    createBgElements();
    
    // Initialize sound switcher
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        if (sound.enabled) {
            soundToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        } else {
            soundToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    });
    
    // Setup Option Buttons Hovers
    setupHoverListeners();
    
    // Welcome screen navigation
    document.getElementById('startBtn').addEventListener('click', () => {
        showScreen('mapScreen');
    });
    
    // Level select buttons
    document.querySelectorAll('.level-card').forEach(card => {
        card.querySelector('.level-play-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // prevent card level click if any
            const lvl = parseInt(card.getAttribute('data-level'));
            startLevel(lvl);
        });
    });
    
    // Navigation back buttons
    document.getElementById('mapBackToWelcome').addEventListener('click', () => {
        showScreen('welcomeScreen');
    });
    
    document.getElementById('gameBackToMap').addEventListener('click', () => {
        showScreen('mapScreen');
    });
    
    document.getElementById('completeBackToMap').addEventListener('click', () => {
        showScreen('mapScreen');
    });
    
    // Next Question dialog buttons
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    
    document.getElementById('tryAgainBtn').addEventListener('click', () => {
        document.getElementById('feedbackOverlay').classList.remove('active');
    });
});

// Inject CSS style rules for background drift shapes dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
.bg-drift-shape {
    position: absolute;
    color: rgba(255, 255, 255, 0.03);
    animation: drift 25s infinite linear;
    pointer-events: none;
    z-index: -1;
}
@keyframes drift {
    0% { transform: translateY(0) rotate(0deg); opacity: 0.01; }
    50% { opacity: 0.05; }
    100% { transform: translateY(-100px) rotate(360deg); opacity: 0.01; }
}
`;
document.head.appendChild(styleSheet);
