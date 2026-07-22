# 幾何互動教室

國小高年級數學「面積」單元的兩款互動教學遊戲，純靜態網頁，無需後端。

**正式網址：** https://math-geometry-games.vercel.app

## 內容

| 遊戲 | 路徑 | 題庫 | 說明 |
| --- | --- | --- | --- |
| 找高大作戰 | `find-height/` | 每關 8 題，隨機抽 5 題 | 給定底邊，找出相對應的高。涵蓋平行四邊形、三角形（含鈍角三角形外部高）、梯形。 |
| 複合圖形面積挑戰 | `composite-area/` | 每關 4 題，隨機抽 3 題 | 將複合圖形拆解成基本圖形，分別計算面積後以加法或減法合併求總面積。 |

兩款遊戲各有三個關卡，答題後即時回饋並依答錯次數評定星等。

## 技術說明

- 純 HTML / CSS / 原生 JavaScript，無建置流程、無框架、無相依套件。
- 圖形以 SVG 動態繪製，音效以 Web Audio API 即時合成（不載入音檔，離線可用）。
- 外部資源僅 Google Fonts 與 FontAwesome（皆由 CDN 載入）。

### 共用模組 `shared/`

兩款遊戲原本各有一份音效與特效實作，已整併至 `shared/`：

| 檔案 | 用途 |
| --- | --- |
| `storage.js` | 關卡進度與音效設定的 localStorage 存取。所有操作包在 try/catch 中，無痕視窗下遊戲照常運作，只是不記錄。 |
| `audio.js` | 共用音效引擎。`enabled` 為屬性存取器，指派時自動存檔，因此音效開關可跨遊戲、跨重整記憶。 |
| `shuffle.js` | Fisher-Yates 洗牌與題目抽樣。 |
| `base.css` | 無障礙與響應式基礎：焦點環、44px 觸控目標、`prefers-reduced-motion`、窄螢幕版面。 |

以傳統 `<script src>` 引入而非 ES modules，確保 `file://` 直接開啟也能運作（老師可帶 USB 離線使用）。

### 題庫設計注意事項

- **選項顏色不可寫進題目資料。** 選項的顏色與甲乙丙丁代號由渲染時的索引決定（`CHOICE_COLORS` / `CHOICE_ORDINALS`），解說文字一律用「這條線段」。若把顏色寫死在資料裡，選項一洗牌就會文不對圖。
- **複合圖形的邊長與面積必須是整數。** `verifyPartCalculation` 以 `parseInt` 嚴格比對，出現小數時學生永遠驗證不過。

### 題庫驗證

新增或修改題目後，務必跑驗證腳本（會用向量點積實際檢查「正解是否真的垂直於底邊」、重算每個部件的面積公式）：

```bash
node tools/verify-find-height.js find-height/game.js
node tools/verify-composite.js composite-area/game.js
```

這兩支腳本曾抓出兩題原本就存在的幾何錯誤（`l1_q2` 偏差 65.6°、`l2_q2` 偏差 5.9°），肉眼檢查看不出來。

## 本機預覽

```bash
npx serve .
```

## 部署

靜態網站，儲存庫根目錄即網站根目錄，不需要建置指令或輸出目錄設定。

```bash
vercel --prod
```

正式網址是固定的 alias，每次部署都會自動指向新版本，發給學生的連結不需更換。
