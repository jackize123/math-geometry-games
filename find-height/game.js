/**
 * 找高大作戰 - Core Game Script
 *
 * 音效引擎、進度儲存、隨機抽題等共用能力由 ../shared/ 的模組提供，
 * 兩款遊戲共用同一份實作，避免同樣的邏輯各寫一遍而走樣。
 */

// 共用音效引擎：指派 enabled 時會自動寫入 localStorage，達成跨頁記憶
const sound = GeoAudio;


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
                    explanation: "正確！這條線段從對邊頂點垂直到指定的底邊，並且有直角記號，代表這就是底邊相對應的「高」。",
                    rightAngle: [[150, 250], [160, 250], [160, 260]] // square corner
                },
                {
                    // Slanted side DA (150,100) to (100,260)
                    line: [[150, 100], [100, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形的「斜邊」，它跟指定的底邊不垂直，所以不是高。"
                },
                {
                    // Incorrect: vertical from C(430,100) to some random point inside? Or wait, let's make it slanted line
                    line: [[380, 260], [430, 100]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形的另一條「斜邊」，與底邊不垂直。"
                },
                {
                    // Perpendicular to the slanted side AD, starting from B(380,260)
                    line: [[380, 260], [280, 228]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段垂直於斜邊，它是以斜邊為「底」時的對應高，而不是以底部粗線為底的高。"
                }
            ]
        },
        {
            id: "l1_q2",
            shapeType: "parallelogram",
            // 教學重點：指定「斜邊」為底，高也會跟著變成斜的。
            // 頂點 A(140,300) B(300,300) C(360,110) D(200,110)
            //   AB ∥ CD（皆水平，長 160）、BC ∥ DA（向量 ±(60,-190)）
            shapePoints: [[140, 300], [300, 300], [360, 110], [200, 110]],
            basePoints: [[200, 110], [140, 300]], // 左側斜邊 DA 為底
            baseLabel: "底邊",
            candidates: [
                {
                    // 下方水平邊
                    line: [[140, 300], [300, 300]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形下方的邊，它本身可以當成另一組底，但不是這條斜底邊的高。"
                },
                {
                    // 正解：從對角頂點 B(300,300) 垂直落到斜底邊 DA。
                    // 底邊向量 d=(-60,190)，DB=(100,190)，
                    // t = (DB·d)/|d|² = 30100/39700 = 0.758，垂足 = D + t·d ≈ (154, 254)
                    line: [[300, 300], [154, 254]],
                    isCorrect: true,
                    explanation: "正確！指定的底是左邊那條斜邊，所以高要從對面的頂點垂直畫到這條斜邊上。高看起來也是斜的，但它和底邊確實成直角。",
                    rightAngle: [[150, 265], [162, 269], [165, 258]]
                },
                {
                    // 右側斜邊
                    line: [[300, 300], [360, 110]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是右邊的斜邊，它和指定的底邊平行，兩條平行線永遠不會垂直。"
                },
                {
                    // 常見誤答：以水平邊為底時的高
                    line: [[250, 110], [250, 300]],
                    isCorrect: false,
                    explanation: "不對喔！這條垂直線段確實是一條高，但它對應的底是水平的那組邊。這題指定的底換成了斜邊，高也必須跟著換方向。"
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
                    explanation: "不對喔！這條線段是平行四邊形的上方斜邊，它與左側垂直的底邊並不垂直。"
                },
                {
                    // Slanted line inside
                    line: [[160, 200], [360, 240]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段與左邊垂直的「底」有傾斜，並非垂直關係。"
                },
                {
                    // Correct height: strictly horizontal! From (160, 200) to (360, 200)
                    line: [[160, 200], [360, 200]],
                    isCorrect: true,
                    explanation: "正確！因為底邊是左邊垂直的線段，與它相對應的「高」必須與它垂直，也就是水平方向的這條線段。",
                    rightAngle: [[170, 200], [170, 210], [160, 210]]
                },
                {
                    // Diagonal
                    line: [[160, 280], [360, 140]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角線，並不與底邊垂直。"
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
                    explanation: "不對喔！這條線段是側邊（斜邊），不與上方的底邊垂直。"
                },
                {
                    // Slanted line
                    line: [[220, 140], [180, 240]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是傾斜的，不是垂直的高度。"
                },
                {
                    // Perpendicular to slanted side
                    line: [[380, 240], [348, 142]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段不是與上方指定底邊垂直的高。"
                },
                {
                    // Correct: vertical from bottom to top base
                    line: [[250, 140], [250, 240]],
                    isCorrect: true,
                    explanation: "正確！這條線段垂直於上方的底邊，且連接到對邊，這就是對應的「高」。",
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
                    explanation: "正確！底邊在右側垂直邊，因此對應的高必須是與其垂直的水平線段（這條線段）。",
                    rightAngle: [[310, 180], [310, 190], [320, 190]]
                },
                {
                    // Top slanted side
                    line: [[180, 120], [320, 80]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是上方的斜邊，不是垂直於底邊的高。"
                },
                {
                    // Slanted cross-section
                    line: [[180, 240], [320, 200]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是傾斜的，它跟右側的底邊沒有垂直關係。"
                },
                {
                    // Bottom slanted side
                    line: [[180, 300], [320, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是下方的斜邊，不能作為指定底邊的高。"
                }
            ]
        },
        {
            id: "l1_q6", // 標準平行四邊形，底在下方
            shapeType: "parallelogram",
            shapePoints: [[90, 270], [350, 270], [410, 110], [150, 110]],
            basePoints: [[90, 270], [350, 270]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 左側斜邊
                    line: [[90, 270], [150, 110]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形的斜邊，它和指定的底邊並不垂直。"
                },
                {
                    // 正解：從上邊垂直落到下底
                    line: [[200, 110], [200, 270]],
                    isCorrect: true,
                    explanation: "正確！這條線段從上方的對邊垂直落到指定的底邊，兩端都碰到平行的兩邊，正是相對應的「高」。",
                    rightAngle: [[200, 260], [210, 260], [210, 270]]
                },
                {
                    // 對角線
                    line: [[90, 270], [410, 110]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形的對角線，雖然穿過圖形內部，但沒有和底邊垂直。"
                },
                {
                    // 垂直於斜邊（是「以斜邊為底」時的高）
                    line: [[350, 270], [266, 238]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段垂直的是斜邊，它是把斜邊當成底時的高，不是這條底邊的高。"
                }
            ]
        },
        {
            id: "l1_q7", // 指定上邊為底
            shapeType: "parallelogram",
            shapePoints: [[120, 290], [360, 290], [420, 130], [180, 130]],
            basePoints: [[180, 130], [420, 130]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 側邊
                    line: [[180, 130], [120, 290]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是平行四邊形的側邊，和上方指定的底邊是傾斜的關係。"
                },
                {
                    // 與側邊平行的內部斜線
                    line: [[300, 130], [240, 290]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然連接了上下兩邊，但它是斜的，沒有和底邊形成直角。"
                },
                {
                    // 正解：垂直連接上下兩平行邊
                    line: [[250, 130], [250, 290]],
                    isCorrect: true,
                    explanation: "正確！底邊在上方時，高一樣是垂直連接兩條平行邊的線段。高的位置可以左右移動，只要保持垂直就都算數。",
                    rightAngle: [[250, 140], [260, 140], [260, 130]]
                },
                {
                    // 對角線
                    line: [[120, 290], [420, 130]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角線，它連接的是兩個頂點，並沒有垂直於底邊。"
                }
            ]
        },
        {
            id: "l1_q8", // 平行邊在左右，高為水平方向
            shapeType: "parallelogram",
            shapePoints: [[150, 310], [150, 130], [350, 90], [350, 270]],
            basePoints: [[150, 130], [150, 310]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 上方斜邊
                    line: [[150, 130], [350, 90]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是上方的斜邊，和左側垂直的底邊並不垂直。"
                },
                {
                    // 正解：水平橫跨左右兩平行邊
                    line: [[150, 200], [350, 200]],
                    isCorrect: true,
                    explanation: "正確！底邊是左側的垂直線段，所以它的高必須和它垂直，也就是這條水平線段。高的方向會跟著底邊改變，不一定是「上下」方向。",
                    rightAngle: [[160, 200], [160, 210], [150, 210]]
                },
                {
                    // 內部傾斜線
                    line: [[150, 250], [350, 210]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然橫跨了圖形，但它是斜的，和左側的底邊沒有形成直角。"
                },
                {
                    // 對角線
                    line: [[150, 310], [350, 90]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角線，不是垂直於底邊的高。"
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
                    explanation: "不對喔！這條線段是正三角形的斜邊，跟底邊不垂直。"
                },
                {
                    // Correct: vertical height from top vertex to base center
                    line: [[250, 96.8], [250, 270]],
                    isCorrect: true,
                    explanation: "正確！正三角形從頂點垂降到對面底邊的垂直線段就是對應的「高」。",
                    rightAngle: [[250, 260], [260, 260], [260, 270]]
                },
                {
                    // Slanted line
                    line: [[250, 96.8], [200, 270]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然從頂點出發，但沒有與底邊垂直。"
                },
                {
                    // A line from bottom corner to opposite side perpendicularly
                    // That is the height for the slanted side base!
                    line: [[150, 270], [300, 183.4]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然與右邊垂直，但那是「右邊為底」時的高，目前指定的底是「底部的黑線」喔！"
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
                    explanation: "不對喔！這條線段是另外一條斜邊，不是指定底邊的高。"
                },
                {
                    // Vertical line from C to AB (not perpendicular to AC)
                    line: [[250, 100], [250, 250]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是以底邊 AB 為底時的高，現在指定的底是左邊的斜邊。"
                },
                {
                    // 正解：從對角頂點 B(350,250) 垂直落到底邊 AC。
                    // 垂足由投影公式求得：底邊向量 d=(100,-150)，AB=(200,0)，
                    // t = (AB·d)/|d|² = 20000/32500 = 0.6154，垂足 = A + t·d = (212, 158)。
                    // 這個座標讓點積剛好為 0，是真正的垂直。
                    line: [[350, 250], [212, 158]],
                    isCorrect: true,
                    explanation: "正確！這條線段從對角頂點出發，垂直地連接到指定的斜底邊，這就是相對應的「高」。",
                    rightAngle: [[219, 148], [229, 155], [222, 165]]
                },
                {
                    // Line from B to AC but not perpendicular (slanted)
                    line: [[350, 250], [180, 205]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然連到指定的底邊，但是與其不垂直。"
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
                    explanation: "正確！直角三角形非常特殊，當一條直角邊為「底」時，另一條直角邊（這條線段）就是它的「高」。",
                    rightAngle: [[150, 250], [160, 250], [160, 260]]
                },
                {
                    // Hypotenuse BC
                    line: [[350, 260], [150, 100]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是直角三角形的「斜邊」，它跟指定的底邊並不垂直。"
                },
                {
                    // Height perpendicular to hypotenuse
                    line: [[150, 260], [212, 210]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是「斜邊為底」時的對應高，不是以底部直角邊為底的高。"
                },
                {
                    // Slanted line inside
                    line: [[150, 100], [250, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段從頂點出發到斜邊中點，但它並不與底邊垂直。"
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
                    explanation: "不對喔！這條線段是鈍角三角形的側邊，它不與底邊垂直。"
                },
                {
                    // Slanted side CB
                    line: [[150, 120], [380, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是長斜邊，跟底邊不垂直。"
                },
                {
                    // Incorrect height inside (not perpendicular to base)
                    line: [[150, 120], [280, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然畫在三角形內部，但它與底邊傾斜，不是垂直的高。"
                },
                {
                    // Correct: vertical line outside to extension line
                    line: [[150, 120], [150, 260]],
                    isCorrect: true,
                    explanation: "正確！這是鈍角三角形的經典題目。當底邊是底部短邊時，高會在「外部」，必須畫延長線，並從頂點向下作垂直線（這條線段）。",
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
                    explanation: "正確！雖然這是一個鈍角三角形，但因為指定的底是長邊，對角頂點垂降下來的高（這條線段）仍然會落在三角形的內部。",
                    rightAngle: [[220, 270], [230, 270], [230, 280]]
                },
                {
                    // Slanted edge CA
                    line: [[220, 200], [100, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是側邊，跟底邊不垂直。"
                },
                {
                    // Slanted edge CB
                    line: [[220, 200], [400, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是另一條側邊，不是垂直的高。"
                },
                {
                    // Slanted line
                    line: [[220, 200], [300, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段不是垂直的垂線。"
                }
            ]
        },
        {
            id: "l2_q6", // 直角三角形，其中一股就是高
            shapeType: "triangle",
            shapePoints: [[120, 290], [380, 290], [120, 120]],
            basePoints: [[120, 290], [380, 290]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 斜邊
                    line: [[120, 120], [380, 290]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是直角三角形的斜邊，它和底邊是傾斜的關係，不是高。"
                },
                {
                    // 中線（連到底邊中點，但不垂直）
                    line: [[120, 120], [250, 290]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然從頂點連到底邊上，但它和底邊沒有形成直角。高一定要垂直，碰到中點並不算數。"
                },
                {
                    // 正解：左邊那一股本身就是高
                    line: [[120, 120], [120, 290]],
                    isCorrect: true,
                    explanation: "正確！直角三角形的兩股互相垂直，所以當底邊是其中一股時，另一股本身就是相對應的「高」，不必另外再畫。",
                    rightAngle: [[120, 280], [130, 280], [130, 290]]
                },
                {
                    // 以斜邊為底時的高
                    line: [[120, 290], [198, 171]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段垂直的是斜邊，它是把斜邊當作底時的高，和目前指定的底邊不相符。"
                }
            ]
        },
        {
            id: "l2_q7", // 鈍角三角形，高落在底邊的延長線上
            shapeType: "triangle",
            shapePoints: [[150, 280], [330, 280], [430, 120]],
            basePoints: [[150, 280], [330, 280]],
            baseLabel: "底邊",
            extensionLine: [[330, 280], [440, 280]], // 底邊往右延長，高才有落腳處
            candidates: [
                {
                    // 邊 BC
                    line: [[330, 280], [430, 120]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是三角形的一個邊，和底邊並不垂直。"
                },
                {
                    // 正解：外部高
                    line: [[430, 120], [430, 280]],
                    isCorrect: true,
                    explanation: "正確！這是鈍角三角形的特殊情況：高落在底邊的「延長線」上，跑到圖形外面去了。只要它垂直於底邊所在的直線，就是正確的高。",
                    rightAngle: [[430, 270], [420, 270], [420, 280]]
                },
                {
                    // 邊 AC
                    line: [[150, 280], [430, 120]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是三角形最長的那個邊，不是垂直於底邊的高。"
                },
                {
                    // 從頂點連到底邊上，但不垂直
                    line: [[430, 120], [240, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然從頂點連到了底邊上，但它是斜的。高必須和底邊成直角。"
                }
            ]
        },
        {
            id: "l2_q8", // 等腰三角形，指定「腰」為底
            shapeType: "triangle",
            shapePoints: [[250, 100], [150, 300], [350, 300]],
            basePoints: [[250, 100], [150, 300]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 水平底邊（不是這題指定的底）
                    line: [[150, 300], [350, 300]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是三角形下方的邊，它本身是一個「底」，不是這題指定底邊的高。"
                },
                {
                    // 右腰
                    line: [[250, 100], [350, 300]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是另一條腰，和指定的底邊只在頂點相接，並沒有垂直。"
                },
                {
                    // 常見誤答：以水平邊為底時的高
                    line: [[250, 100], [250, 300]],
                    isCorrect: false,
                    explanation: "不對喔！這條垂直線段確實是一條高，但它對應的底是下方的水平邊，不是這題指定的斜邊。底換了，高也要跟著換。"
                },
                {
                    // 正解：從對角頂點垂直到指定的腰
                    line: [[350, 300], [190, 220]],
                    isCorrect: true,
                    explanation: "正確！指定的底是左邊那條斜的腰，所以高要從對面的頂點垂直畫到這條腰上，看起來也是斜的。",
                    rightAngle: [[185, 231], [195, 236], [201, 225]]
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
                    explanation: "不對喔！這條線段是等腰梯形的斜側邊，與底邊不垂直。"
                },
                {
                    // Correct: vertical from D(180,120) to base AB at (180,280)
                    line: [[180, 120], [180, 280]],
                    isCorrect: true,
                    explanation: "正確！這條線段是連接上下平行底邊的垂直距離，這就是梯形的「高」。",
                    rightAngle: [[180, 270], [190, 270], [190, 280]]
                },
                {
                    // Slanted line inside
                    line: [[180, 120], [230, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是傾斜的，不符合垂直的要求。"
                },
                {
                    // Diagonal
                    line: [[180, 120], [400, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是梯形的對角線，不是高。"
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
                    explanation: "不對喔！這條線段是右邊的斜側邊，不與底邊垂直。"
                },
                {
                    // Slanted internal line
                    line: [[320, 120], [250, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是傾斜的線段。"
                },
                {
                    // Correct: vertical leg DA itself (150,120) to (150,280)
                    line: [[150, 120], [150, 280]],
                    isCorrect: true,
                    explanation: "正確！直角梯形本身就有一條與上下底垂直的側邊，這條直角邊（這條線段）就是這個直角梯形的高。",
                    rightAngle: [[150, 270], [160, 270], [160, 280]]
                },
                {
                    // Upper base CD
                    line: [[150, 120], [320, 120]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是梯形的上底，不是垂直的高。"
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
                    explanation: "不對喔！這條線段是梯形的上方側邊，不與底邊垂直。"
                },
                {
                    // Slanted inside
                    line: [[360, 200], [180, 240]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是傾斜的，不與垂直底邊垂直。"
                },
                {
                    // Slanted bottom side DA
                    line: [[180, 300], [360, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是下方側邊，不是高。"
                },
                {
                    // Correct: horizontal line connecting left and right parallel bases!
                    // e.g. from (360, 200) to (180, 200)
                    line: [[360, 200], [180, 200]],
                    isCorrect: true,
                    explanation: "正確！當梯形的平行底邊位於左右兩側時，它的高必須是水平方向的垂直線段（這條線段），代表左右兩平行底邊的距離。",
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
                    explanation: "正確！因為平行的兩底邊在左右，指定右側邊為底時，高就是水平橫跨兩底邊的這條線段。",
                    rightAngle: [[330, 200], [330, 210], [340, 210]]
                },
                {
                    // Left base
                    line: [[160, 120], [160, 280]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是另一邊的底，不是高。"
                },
                {
                    // Diagonal
                    line: [[160, 120], [340, 240]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角斜線，沒有與右邊底邊垂直。"
                },
                {
                    // Slanted edge
                    line: [[160, 280], [340, 240]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是底部的斜側邊，與底邊不垂直。"
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
                    explanation: "不對喔！這條線段是側邊，跟底邊不垂直。"
                },
                {
                    // Slanted line inside
                    line: [[250, 120], [210, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是斜的，不是垂直的高度。"
                },
                {
                    // Correct: vertical from top base to bottom base
                    line: [[250, 120], [250, 260]],
                    isCorrect: true,
                    explanation: "正確！這條線段垂直於指定的上底邊，並且連接到下底邊，這就是梯形的高度。",
                    rightAngle: [[250, 130], [260, 130], [260, 120]]
                },
                {
                    // Lower base
                    line: [[100, 260], [400, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是下底，並非與上底垂直的高。"
                }
            ]
        },
        {
            id: "l3_q6", // 直角梯形，指定下底
            shapeType: "trapezoid",
            shapePoints: [[130, 290], [380, 290], [380, 150], [230, 150]],
            basePoints: [[130, 290], [380, 290]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 斜腰
                    line: [[130, 290], [230, 150]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是梯形傾斜的那條腰，和下底沒有形成直角。"
                },
                {
                    // 對角線
                    line: [[130, 290], [380, 150]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是梯形的對角線，穿過內部但沒有垂直於底邊。"
                },
                {
                    // 正解：內部垂直線段
                    line: [[300, 150], [300, 290]],
                    isCorrect: true,
                    explanation: "正確！梯形的高是垂直連接上底與下底的線段。這個直角梯形右邊那條腰剛好也是高，但畫在中間、只要保持垂直，長度完全相同。",
                    rightAngle: [[300, 280], [310, 280], [310, 290]]
                },
                {
                    // 與斜腰平行的內部斜線
                    line: [[200, 290], [260, 150]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段雖然連接了上下兩底，但它是斜的，不能當作高。"
                }
            ]
        },
        {
            id: "l3_q7", // 等腰梯形，指定上底
            shapeType: "trapezoid",
            shapePoints: [[120, 290], [380, 290], [320, 140], [180, 140]],
            basePoints: [[180, 140], [320, 140]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 左腰
                    line: [[120, 290], [180, 140]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是等腰梯形的左腰，和上底是傾斜的關係。"
                },
                {
                    // 正解
                    line: [[250, 140], [250, 290]],
                    isCorrect: true,
                    explanation: "正確！不論指定的是上底還是下底，梯形的高都是垂直連接兩條平行底邊的線段，長度都一樣。",
                    rightAngle: [[250, 150], [260, 150], [260, 140]]
                },
                {
                    // 右腰
                    line: [[380, 290], [320, 140]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是右腰，它和上底沒有垂直。"
                },
                {
                    // 對角線
                    line: [[180, 140], [380, 290]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角線，連接的是兩個頂點，不是垂直的高。"
                }
            ]
        },
        {
            id: "l3_q8", // 平行邊在左右的梯形，高為水平方向
            shapeType: "trapezoid",
            shapePoints: [[160, 300], [160, 120], [360, 160], [360, 260]],
            basePoints: [[160, 120], [160, 300]],
            baseLabel: "底邊",
            candidates: [
                {
                    // 上方斜邊
                    line: [[160, 120], [360, 160]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是梯形的腰，和左側垂直的底邊並不垂直。"
                },
                {
                    // 下方斜邊
                    line: [[160, 300], [360, 260]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是另一條腰，同樣沒有和指定的底邊形成直角。"
                },
                {
                    // 對角線
                    line: [[160, 300], [360, 160]],
                    isCorrect: false,
                    explanation: "不對喔！這條線段是對角線，不是垂直於底邊的高。"
                },
                {
                    // 正解：水平橫跨左右兩平行邊
                    line: [[160, 210], [360, 210]],
                    isCorrect: true,
                    explanation: "正確！這個梯形的兩條平行邊在左右兩側，所以高是水平方向的線段。判斷高的關鍵永遠是「和指定的底垂直」，而不是「看起來是不是站直的」。",
                    rightAngle: [[170, 210], [170, 220], [160, 220]]
                }
            ]
        }
    ]
};

// --- Game State Management ---
const GAME_ID = 'find-height';

// 每關題庫有 8 題，每次隨機抽 5 題作答，讓學生重玩時不會靠背答案位置通關
const QUESTIONS_PER_LEVEL = 5;

// 使用者若在系統設定中要求減少動態效果，就不播放煙火動畫
const prefersReducedMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const gameState = {
    currentScreen: 'welcomeScreen',
    currentLevel: null,
    currentQuestionIndex: 0,
    score: 0,
    errorsInLevel: 0,
    // 本關實際作答的題目快照（已抽題、已洗選項）。
    // 抽樣只在 startLevel 發生一次，之後渲染與判分都讀這份，確保索引與資料全程一致。
    activeQuestions: [],
    levelHistory: GeoStorage.loadProgress(GAME_ID)
};

/** 把目前的關卡成績寫回 localStorage */
function persistProgress() {
    GeoStorage.saveProgress(GAME_ID, gameState.levelHistory);
}

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

// 選項的顏色與代號由索引決定，不再寫死在題庫裡。
// 這是選項能安全洗牌的前提：洗牌後第 n 個選項一定拿到第 n 個顏色與代號。
const CHOICE_COLORS = ['red', 'blue', 'orange', 'green'];
const CHOICE_COLOR_NAMES = ['紅色', '藍色', '橘色', '綠色'];
const CHOICE_ORDINALS = ['甲', '乙', '丙', '丁'];

const LEVEL_NAMES = { 1: '平行四邊形', 2: '三角形', 3: '梯形' };
const LEVEL_TITLES = { 1: '第一關：平行四邊形', 2: '第二關：三角形', 3: '第三關：梯形' };

function getChoiceLabel(idx) {
    return `${CHOICE_COLOR_NAMES[idx]}線段 (${CHOICE_ORDINALS[idx]})`;
}

function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.errorsInLevel = 0;

    // 從該關題庫抽題，並各自洗亂四個選項的順序。
    // 用淺拷貝換掉 candidates，原始 questionsData 保持不變，下一輪才能重新抽到完整題庫。
    gameState.activeQuestions = GeoRandom
        .sample(questionsData[levelNum], QUESTIONS_PER_LEVEL)
        .map(q => Object.assign({}, q, { candidates: GeoRandom.shuffle(q.candidates) }));

    document.querySelector('.progress-title').textContent = LEVEL_TITLES[levelNum];

    loadQuestion();
    showScreen('gameScreen');
}

function loadQuestion() {
    const levelQuestions = gameState.activeQuestions;
    const currentQ = levelQuestions[gameState.currentQuestionIndex];

    // Update progress bar & score
    const totalQ = levelQuestions.length;
    const progressPercent = ((gameState.currentQuestionIndex + 1) / totalQ) * 100;
    document.getElementById('progressBarFill').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `第 ${gameState.currentQuestionIndex + 1} / ${totalQ} 題`;
    document.getElementById('currentScore').textContent = `得分：${gameState.score}`;

    // Render SVG
    renderQuestionGeometry(currentQ);
    updateSvgDescription(currentQ);

    // Populate Option Buttons
    currentQ.candidates.forEach((cand, idx) => {
        const btn = document.getElementById(`btnChoice${idx}`);
        btn.querySelector('.choice-text').textContent = getChoiceLabel(idx);
        btn.className = `choice-btn color-${CHOICE_COLORS[idx]}`;
        btn.disabled = false;
        btn.setAttribute('aria-label', `選項${CHOICE_ORDINALS[idx]}：${CHOICE_COLOR_NAMES[idx]}線段`);
    });
}

/** 更新圖形的文字描述，讓螢幕閱讀器使用者也知道畫面上有什麼 */
function updateSvgDescription(question) {
    const desc = document.getElementById('svgDesc');
    if (!desc) return;
    const shapeName = LEVEL_NAMES[gameState.currentLevel] || '圖形';
    desc.textContent = `圖中是一個${shapeName}，黑色粗線標示指定的底邊。`
        + `圖上另有四條候選線段，依序以紅色、藍色、橘色、綠色繪製，`
        + `對應甲、乙、丙、丁四個選項，請判斷哪一條才是這條底邊的高。`;
}

/**
 * 建立選項按鈕與圖形線段的連動。
 * 除了滑鼠 hover，也綁定 focus/blur——否則使用鍵盤 Tab 的學生
 * 在圖上完全看不到目前選到哪一條線段。
 */
function setupChoiceInteractions() {
    for (let idx = 0; idx < 4; idx++) {
        const btn = document.getElementById(`btnChoice${idx}`);

        const highlight = () => {
            const svgLine = document.getElementById(`svgHeightLine_${idx}`);
            if (svgLine) svgLine.classList.add('hovered');
        };
        const unhighlight = () => {
            const svgLine = document.getElementById(`svgHeightLine_${idx}`);
            if (svgLine) svgLine.classList.remove('hovered');
        };

        btn.addEventListener('mouseenter', highlight);
        btn.addEventListener('mouseleave', unhighlight);
        btn.addEventListener('focus', highlight);
        btn.addEventListener('blur', unhighlight);

        // 作答入口。原本只有 SVG 上的細線段可點，觸控裝置幾乎點不中，
        // 四顆選項按鈕形同虛設，這裡補上真正的點擊綁定。
        btn.addEventListener('click', () => handleChoiceSelection(idx));
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
    // 讀本關的題目快照，而非原始題庫——快照才是已抽題、已洗選項的那一份
    const currentQ = gameState.activeQuestions[gameState.currentQuestionIndex];
    if (!currentQ) return;
    const chosenCandidate = currentQ.candidates[choiceIndex];
    if (!chosenCandidate) return;

    // 記住是哪顆按鈕觸發的，關閉回饋視窗時把焦點還回去
    lastFocusedChoice = document.getElementById(`btnChoice${choiceIndex}`);

    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const title = document.getElementById('feedbackResultTitle');
    const explanation = document.getElementById('feedbackExplanation');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const tryBtn = document.getElementById('tryAgainBtn');
    
    if (chosenCandidate.isCorrect) {
        sound.playCorrect();
        // 依實際題數平均分配，總分維持 100
        gameState.score += Math.round(100 / gameState.activeQuestions.length);

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
        
        // Start the fireworks!（若使用者要求減少動態效果則略過）
        if (!prefersReducedMotion) fireworks.start();
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

    // 把焦點移進對話框，鍵盤與螢幕閱讀器使用者才會被帶到剛跳出的說明上
    const focusTarget = chosenCandidate.isCorrect ? nextBtn : tryBtn;
    window.setTimeout(() => focusTarget.focus(), 50);
}

// 記錄開啟回饋視窗前的焦點位置，關閉後歸還
let lastFocusedChoice = null;

/** 關閉回饋視窗並把焦點還給原本的選項按鈕 */
function closeFeedback() {
    document.getElementById('feedbackOverlay').classList.remove('active');
    if (lastFocusedChoice && !lastFocusedChoice.disabled) {
        lastFocusedChoice.focus();
    }
}

// Progressing to Next Question or Completion Screen
function nextQuestion() {
    fireworks.stop();
    document.getElementById('feedbackOverlay').classList.remove('active');
    
    const levelQuestions = gameState.activeQuestions;
    if (gameState.currentQuestionIndex < levelQuestions.length - 1) {
        gameState.currentQuestionIndex += 1;
        loadQuestion();
        // 換題後把焦點帶回第一個選項，鍵盤使用者不必重新 Tab 一輪
        window.setTimeout(() => {
            const first = document.getElementById('btnChoice0');
            if (first) first.focus();
        }, 50);
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
    persistProgress(); // 寫入 localStorage，重整或關掉分頁後進度仍在

    // Render Complete Screen details
    const levelName = LEVEL_NAMES[gameState.currentLevel];
    const totalQ = gameState.activeQuestions.length;

    document.getElementById('completeSubtitle').textContent = `你已經完成「${levelName}」的全部挑戰！`;
    document.getElementById('summaryCorrect').textContent = `${totalQ} / ${totalQ}`;
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
    
    // Initialize sound switcher（開關狀態由 localStorage 還原，跨頁與重整都記得）
    const soundToggle = document.getElementById('soundToggle');
    const renderSoundIcon = () => {
        soundToggle.innerHTML = sound.enabled
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
        soundToggle.setAttribute('aria-pressed', String(sound.enabled));
        soundToggle.setAttribute('aria-label', sound.enabled ? '關閉音效' : '開啟音效');
    };
    renderSoundIcon();
    soundToggle.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        renderSoundIcon();
    });

    // Setup Option Buttons interactions（hover / focus / click）
    setupChoiceInteractions();

    // 重新開始：清除本機進度，供課堂平板換人使用
    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (!window.confirm('確定要清除這款遊戲的所有關卡進度嗎？此動作無法復原。')) return;
            GeoStorage.clearProgress(GAME_ID);
            gameState.levelHistory = GeoStorage.loadProgress(GAME_ID);
            updateMapUI();
            sound.playClick();
        });
    }

    // 若瀏覽器不允許儲存（無痕視窗等），先告知使用者進度不會被保留
    const hint = document.getElementById('storageHint');
    if (hint && !GeoStorage.isAvailable()) {
        hint.textContent = '提醒：目前的瀏覽器設定無法儲存進度，關閉分頁後紀錄不會保留。';
    }

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
    
    document.getElementById('tryAgainBtn').addEventListener('click', closeFeedback);

    // 回饋視窗開啟時，Esc 等同「再試一次」；答對時 Esc 不關閉，避免略過說明
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const overlay = document.getElementById('feedbackOverlay');
        if (!overlay.classList.contains('active')) return;
        const tryBtn = document.getElementById('tryAgainBtn');
        if (tryBtn.style.display !== 'none') closeFeedback();
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
