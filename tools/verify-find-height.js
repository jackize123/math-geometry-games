/**
 * find-height 題庫驗證腳本
 * 重點：用向量點積實際檢查「正解線段是否真的垂直於指定底邊」，
 * 純靠肉眼看 SVG 座標是抓不出微小偏差的。
 */
const fs = require('fs');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');

const start = src.indexOf('const questionsData');
const end = src.indexOf('// --- Game State Management ---');
if (start < 0 || end < 0) { console.error('FAIL: cannot locate questionsData block'); process.exit(1); }

let questionsData;
eval(src.slice(start, end).replace('const questionsData', 'questionsData'));

const VIEW_W = 500, VIEW_H = 380;
let errors = 0, warnings = 0;
const ids = new Set();

function vec(a, b) { return [b[0] - a[0], b[1] - a[1]]; }
function dot(u, v) { return u[0] * v[0] + u[1] * v[1]; }
function len(u) { return Math.hypot(u[0], u[1]); }

function fail(msg) { console.log('  [FAIL] ' + msg); errors++; }
function warn(msg) { console.log('  [WARN] ' + msg); warnings++; }

for (const lvl of [1, 2, 3]) {
  const qs = questionsData[lvl];
  console.log(`\n=== Level ${lvl}: ${qs.length} questions ===`);
  if (qs.length !== 8) fail(`Level ${lvl} has ${qs.length} questions, expected 8`);

  qs.forEach(q => {
    const tag = q.id;
    if (ids.has(tag)) fail(`${tag}: duplicate id`);
    ids.add(tag);

    // 選項數與正解數
    if (q.candidates.length !== 4) fail(`${tag}: ${q.candidates.length} candidates, expected 4`);
    const corrects = q.candidates.filter(c => c.isCorrect);
    if (corrects.length !== 1) { fail(`${tag}: ${corrects.length} correct answers, expected exactly 1`); return; }

    const correct = corrects[0];
    if (!correct.rightAngle) warn(`${tag}: correct answer has no rightAngle marker`);

    // 每個選項都要有解說
    q.candidates.forEach((c, i) => {
      if (!c.explanation || c.explanation.length < 8) fail(`${tag}: candidate ${i} missing explanation`);
      if (/紅色|藍色|橘色|綠色/.test(c.explanation)) fail(`${tag}: candidate ${i} explanation still mentions a colour (breaks shuffling)`);
      if (c.label !== undefined) fail(`${tag}: candidate ${i} still has a hardcoded label field`);
    });

    // 核心幾何檢查：正解必須垂直於底邊
    const baseV = vec(q.basePoints[0], q.basePoints[1]);
    const hV = vec(correct.line[0], correct.line[1]);
    const cosang = dot(baseV, hV) / (len(baseV) * len(hV));
    const angle = Math.acos(Math.max(-1, Math.min(1, cosang))) * 180 / Math.PI;
    const deviation = Math.abs(angle - 90);
    if (deviation > 1.5) {
      fail(`${tag}: correct answer is ${angle.toFixed(2)}deg from base, expected 90deg (off by ${deviation.toFixed(2)})`);
    } else if (deviation > 0.2) {
      warn(`${tag}: correct answer is ${angle.toFixed(2)}deg from base (minor rounding)`);
    }

    // 干擾選項不該剛好也垂直（否則有兩個正解）
    q.candidates.forEach((c, i) => {
      if (c.isCorrect) return;
      const v = vec(c.line[0], c.line[1]);
      const ca = dot(baseV, v) / (len(baseV) * len(v));
      const a = Math.acos(Math.max(-1, Math.min(1, ca))) * 180 / Math.PI;
      if (Math.abs(a - 90) < 1.5) {
        warn(`${tag}: distractor ${i} is also perpendicular to the base (${a.toFixed(2)}deg) - may be ambiguous`);
      }
    });

    // 座標必須落在 viewBox 內
    const pts = [].concat(
      q.shapePoints,
      q.basePoints,
      q.extensionLine || [],
      ...q.candidates.map(c => c.line),
      ...q.candidates.filter(c => c.rightAngle).map(c => c.rightAngle)
    );
    pts.forEach(p => {
      if (p[0] < 0 || p[0] > VIEW_W || p[1] < 0 || p[1] > VIEW_H) {
        fail(`${tag}: point (${p[0]},${p[1]}) outside viewBox ${VIEW_W}x${VIEW_H}`);
      }
    });
  });
  console.log(`  checked ${qs.length} questions`);
}

console.log(`\n===== RESULT: ${errors} errors, ${warnings} warnings =====`);
process.exit(errors > 0 ? 1 : 0);
