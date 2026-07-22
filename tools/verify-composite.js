/**
 * composite-area 題庫驗證腳本
 * 重點：自動重算每個部件的面積公式與總面積，
 * 因為 verifyPartCalculation 用 parseInt 嚴格比對，只要資料算錯學生就永遠驗證不過。
 */
const fs = require('fs');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');

const start = src.indexOf('const GAME_LEVELS');
const end = src.indexOf('// 從 localStorage 還原上次的進度');
if (start < 0 || end < 0) { console.error('FAIL: cannot locate GAME_LEVELS block'); process.exit(1); }

let GAME_LEVELS;
eval(src.slice(start, end).replace('const GAME_LEVELS', 'GAME_LEVELS'));

let errors = 0, warnings = 0;
function fail(m) { console.log('  [FAIL] ' + m); errors++; }
function warn(m) { console.log('  [WARN] ' + m); warnings++; }

function expectedArea(part) {
  const i = part.inputs;
  if (part.type === 'parallelogram') return i.base * i.height;
  if (part.type === 'triangle') return i.base * i.height / 2;
  if (part.type === 'trapezoid') return (i.upper + i.lower) * i.height / 2;
  return null;
}

for (const lvl of [1, 2, 3]) {
  const level = GAME_LEVELS[lvl];
  console.log(`\n=== Level ${lvl}: "${level.title}" — ${level.stages.length} stages ===`);
  if (level.stages.length !== 4) fail(`Level ${lvl} has ${level.stages.length} stages, expected 4`);

  level.stages.forEach(stage => {
    const tag = `L${lvl}/${stage.title}`;

    if (!stage.instruction || !stage.tip) fail(`${tag}: missing instruction or tip`);
    if (typeof stage.drawSvg !== 'function') fail(`${tag}: drawSvg is not a function`);

    const ids = stage.parts.map(p => p.id);
    if (new Set(ids).size !== ids.length) fail(`${tag}: duplicate part ids`);

    // 逐一重算部件面積
    stage.parts.forEach(p => {
      const exp = expectedArea(p);
      if (exp === null) { fail(`${tag}/${p.id}: unknown type "${p.type}"`); return; }
      if (exp !== p.inputs.area) {
        fail(`${tag}/${p.id} (${p.type}): area is ${p.inputs.area}, formula gives ${exp}`);
      }
      if (!Number.isInteger(p.inputs.area)) {
        fail(`${tag}/${p.id}: area ${p.inputs.area} is not an integer (parseInt comparison would fail)`);
      }
      Object.entries(p.inputs).forEach(([k, v]) => {
        if (!Number.isInteger(v)) fail(`${tag}/${p.id}: input "${k}" = ${v} is not an integer`);
        if (v <= 0) fail(`${tag}/${p.id}: input "${k}" = ${v} must be positive`);
      });
      if (!p.svgPoints) fail(`${tag}/${p.id}: missing svgPoints`);
      if (!p.name || !p.label) fail(`${tag}/${p.id}: missing name or label`);
    });

    // 依 totalFormula 重算總面積（左至右，+ 與 - 同優先級）
    let total = 0, op = '+', tokenCount = 0;
    stage.totalFormula.forEach(tok => {
      if (tok === '+' || tok === '-') { op = tok; return; }
      const part = stage.parts.find(p => p.id === tok);
      if (!part) { fail(`${tag}: totalFormula references unknown part "${tok}"`); return; }
      tokenCount++;
      total = (op === '+') ? total + part.inputs.area : total - part.inputs.area;
    });

    if (tokenCount !== stage.parts.length) {
      warn(`${tag}: totalFormula uses ${tokenCount} parts but ${stage.parts.length} are defined`);
    }
    if (total !== stage.totalArea) {
      fail(`${tag}: totalArea is ${stage.totalArea}, formula gives ${total}`);
    }
    if (total <= 0) fail(`${tag}: total area ${total} is not positive`);

    // drawSvg 必須真的輸出對應的 data-part，否則點擊高亮會失效
    const fake = { innerHTML: '' };
    try {
      stage.drawSvg(fake);
      stage.parts.forEach(p => {
        if (!fake.innerHTML.includes(`data-part="${p.id}"`)) {
          fail(`${tag}: drawSvg output has no data-part="${p.id}"`);
        }
      });
    } catch (e) {
      fail(`${tag}: drawSvg threw ${e.message}`);
    }

    console.log(`  ok  ${stage.title}: ${stage.parts.length} parts, total ${stage.totalArea}`);
  });
}

console.log(`\n===== RESULT: ${errors} errors, ${warnings} warnings =====`);
process.exit(errors > 0 ? 1 : 0);
