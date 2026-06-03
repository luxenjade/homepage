// quiz/config/hex.js
// 16進法クイズ（Supabase不使用、問題は動的生成）

window.QUIZ_CONFIG = {
  title: "16進法クイズ",
  subtitle: "Hexadecimal | binary, decimal, and color conversions",
  backLink: "/miscellaneous/",
  backLabel: "Miscellaneous",
  accentColor: "#148b9d",
  answerType: "choice",
  image: "/images/hex-quiz.svg",

  rangeMode: "multi",
  rangeLabel: "出題分野",
  ranges: [
    { id: "conversion_dec_hex", label: "10進⇔16進変換" },
    { id: "conversion_bin_hex", label: "2進⇔16進変換" },
    { id: "calc_hex_hex", label: "16進数四則演算" },
    { id: "calc_mixed_base", label: "複数基数混合" },
    { id: "calc_negative", label: "負の数計算" },
    { id: "color_code", label: "カラーコード" },
    { id: "ascii_binary", label: "ASCII 2進数" },
  ],
  countMode: "select",
  countDefault: 10,
  countOptions: [10, 20, 50, "all"],

  async fetchData(selectedRanges, count) {
    const total = count === "all" ? 999 : parseInt(count);
    const perCategory = Math.ceil(total / selectedRanges.length);

    let pool = [];
    for (const rangeId of selectedRanges) {
      pool.push(..._generateQuestions(rangeId, perCategory));
    }
    pool = window._quizShuffle(pool);
    return count === "all" ? pool : pool.slice(0, total);
  },

  formatQuestion(row) {
    return {
      text: row.text,
      category: row.category,
    };
  },

  formatCorrectLabel(row) {
    return row.correct;
  },

  buildDistractors(current, allData) {
    // hex-quiz の選択肢は row.options に格納済みなので distractor は不要
    // showChoices には options を直接渡すため、buildDistractors は使われない
    return [];
  },

  // hex-quiz は row.options を直接使うため、quiz-logic の distractor 生成をバイパスする
  // formatCorrectLabel が options の1つと一致するようにしている
  getCorrectValue: null,
  validate: null,
  onAnswer: null,

  extraRenderer(el, row, isCorrect) {
    if (row.explanation) {
      el.innerHTML = `<p style="margin-top:6px;font-size:0.85rem;font-weight:400;">${_esc(row.explanation)}</p>`;
    }
    if (row.colorCode) {
      el.innerHTML += `<div style="width:100%;height:48px;border-radius:8px;background:${_esc(row.colorCode)};margin-top:8px;border:1px solid var(--qz-border);"></div>`;
    }
  },

  renderQuestionExtras(el, row) {
    const parts = [];

    if (row.colorCode) {
      parts.push(`
        <div
          class="hex-color-preview"
          title="${_esc(row.colorCode)}"
          style="background-color:${_esc(row.colorCode)};"
        ></div>
      `);
    }

    if (row.showASCII) {
      parts.push(`
        <div class="hex-ascii-btn-wrap">
          <button class="qz-btn qz-btn--ghost qz-btn--sm" id="hex-ascii-btn" type="button">
            ASCII表を見る
          </button>
        </div>
      `);
    }

    el.innerHTML = parts.join("");

    if (row.showASCII) {
      el.querySelector("#hex-ascii-btn")?.addEventListener("click", () => {
        window.openQuizModal({
          title: "ASCII 文字コード表",
          html: _buildASCIITableHTML(),
          className: "hex-ascii-modal",
        });
      });
    }
  },

  renderMistake: null,
  renderChoice: null,

  // hex-quiz は quiz-logic の標準 distractor フローではなく
  // row.options を options として渡す必要がある。
  // そのため formatCorrectLabel と options を揃えた row を fetchData で生成する。
};

// ── 問題生成 ──────────────────────────────────────────────

function _generateQuestions(category, count) {
  const generators = {
    conversion_dec_hex: _genDecHex,
    conversion_bin_hex: _genBinHex,
    calc_hex_hex: _genCalcHex,
    calc_mixed_base: _genMixed,
    calc_negative: _genNegative,
    color_code: _genColor,
    ascii_binary: _genAscii,
  };
  const categoryNames = {
    conversion_dec_hex: "10進⇔16進変換",
    conversion_bin_hex: "2進⇔16進変換",
    calc_hex_hex: "16進数四則演算",
    calc_mixed_base: "複数基数混合",
    calc_negative: "負の数計算",
    color_code: "カラーコード",
    ascii_binary: "ASCII 2進数",
  };
  const fn = generators[category];
  if (!fn) return [];
  return Array.from({ length: count }, () => {
    const q = fn();
    q.category = categoryNames[category];
    return q;
  });
}

function _shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _hexChoices(correct, n) {
  const set = new Set([correct]);
  while (set.size < 4) {
    const off = Math.round((Math.random() - 0.5) * 50);
    set.add(
      "0x" +
        Math.max(0, parseInt(correct, 16) + off)
          .toString(16)
          .toUpperCase(),
    );
  }
  return _shuffle([...set]);
}

function _decChoices(correct) {
  const set = new Set([String(correct)]);
  while (set.size < 4)
    set.add(
      String(Math.max(0, correct + Math.round((Math.random() - 0.5) * 50))),
    );
  return _shuffle([...set]);
}

function _binChoices(correct) {
  const n = parseInt(correct, 2);
  const set = new Set([correct]);
  while (set.size < 4)
    set.add(
      Math.max(0, n + Math.round((Math.random() - 0.5) * 16))
        .toString(2)
        .padStart(8, "0"),
    );
  return _shuffle([...set]);
}

function _genDecHex() {
  const isDecToHex = Math.random() > 0.5;
  const dec = Math.floor(Math.random() * 256);
  const hex = "0x" + dec.toString(16).toUpperCase();
  if (isDecToHex) {
    return {
      text: `10進数の ${dec} を16進数に変換すると？`,
      correct: hex,
      options: _hexChoices(hex, dec),
      explanation: `${dec} → ${hex}`,
    };
  } else {
    return {
      text: `16進数の ${hex} を10進数に変換すると？`,
      correct: String(dec),
      options: _decChoices(dec),
      explanation: `${hex} → ${dec}`,
    };
  }
}

function _genBinHex() {
  const dec = Math.floor(Math.random() * 256);
  const bin = dec.toString(2).padStart(8, "0");
  const hex = "0x" + dec.toString(16).toUpperCase();
  if (Math.random() > 0.5) {
    return {
      text: `2進数の ${bin} を16進数に変換すると？`,
      correct: hex,
      options: _hexChoices(hex, dec),
      explanation: `${bin} → ${hex}`,
    };
  } else {
    return {
      text: `16進数の ${hex} を2進数に変換すると？`,
      correct: bin,
      options: _binChoices(bin),
      explanation: `${hex} → ${bin}`,
    };
  }
}

function _genCalcHex() {
  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 128);
  let b =
    op === "-"
      ? Math.floor(Math.random() * 50)
      : Math.floor(Math.random() * (op === "*" ? 16 : 128));
  if (op === "-" && a < b) [a, b] = [b, a];
  const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
  const hA = "0x" + a.toString(16).toUpperCase();
  const hB = "0x" + b.toString(16).toUpperCase();
  const correct = "0x" + result.toString(16).toUpperCase();
  return {
    text: `${hA} ${op} ${hB} = ?`,
    correct,
    options: _hexChoices(correct, result),
    explanation: `= ${result}`,
  };
}

function _genMixed() {
  const a = Math.floor(Math.random() * 100);
  let b = Math.floor(Math.random() * 100);
  if (a < b) b = a;
  const result = a - b;
  const hB = "0x" + b.toString(16).toUpperCase();
  const correct = "0x" + result.toString(16).toUpperCase();
  return {
    text: `10進数の ${a} - 16進数の ${hB} = 16進数で？`,
    correct,
    options: _hexChoices(correct, result),
    explanation: `= ${result}`,
  };
}

function _genNegative() {
  const a = Math.floor(Math.random() * 50) + 10;
  const b = Math.floor(Math.random() * 100) + a + 10;
  const result = a - b;
  const absResult = Math.abs(result);
  const hA = "0x" + a.toString(16).toUpperCase();
  const hB = "0x" + b.toString(16).toUpperCase();
  const correct = "-0x" + absResult.toString(16).toUpperCase();
  const set = new Set([correct]);
  while (set.size < 4)
    set.add(
      "-0x" +
        Math.max(1, absResult + Math.round((Math.random() - 0.5) * 20))
          .toString(16)
          .toUpperCase(),
    );
  return {
    text: `${hA} - ${hB} = ?`,
    correct,
    options: _shuffle([...set]),
    explanation: `= ${result}`,
  };
}

function _genColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const code =
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0").toUpperCase())
      .join("");
  const correct = `R:${r}, G:${g}, B:${b}`;
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const set = new Set([correct]);
  while (set.size < 4) {
    const wr = clamp(r + Math.round((Math.random() - 0.5) * 100));
    const wg = clamp(g + Math.round((Math.random() - 0.5) * 100));
    const wb = clamp(b + Math.round((Math.random() - 0.5) * 100));
    set.add(`R:${wr}, G:${wg}, B:${wb}`);
  }
  return {
    text: `カラーコード ${code} のRGB値は？`,
    correct,
    options: _shuffle([...set]),
    colorCode: code,
  };
}

function _genAscii() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const char = chars[Math.floor(Math.random() * chars.length)];
  const code = char.charCodeAt(0);
  const binary = code.toString(2).padStart(8, "0");
  if (Math.random() > 0.5) {
    return {
      text: `文字 '${char}' のASCIIコードを2進数で表すと？`,
      correct: binary,
      options: _binChoices(binary),
      explanation: `'${char}' = ${code} = ${binary}`,
      showASCII: true,
    };
  } else {
    const set = new Set([char]);
    while (set.size < 4)
      set.add(chars[Math.floor(Math.random() * chars.length)]);
    return {
      text: `2進数 ${binary} はASCIIコードで何の文字？`,
      correct: char,
      options: _shuffle([...set]),
      explanation: `${binary} = ${code} = '${char}'`,
      showASCII: true,
    };
  }
}

function _buildASCIITableHTML() {
  const controlChars = [
    "NUL",
    "SOH",
    "STX",
    "ETX",
    "EOT",
    "ENQ",
    "ACK",
    "BEL",
    "BS",
    "HT",
    "LF",
    "VT",
    "FF",
    "CR",
    "SO",
    "SI",
    "DLE",
    "DC1",
    "DC2",
    "DC3",
    "DC4",
    "NAK",
    "SYN",
    "ETB",
    "CAN",
    "EM",
    "SUB",
    "ESC",
    "FS",
    "GS",
    "RS",
    "US",
  ];

  let html = '<table class="hex-ascii-table">';
  html +=
    '<tr><th class="hex-ascii-corner">下位4ビット →<br>上位4ビット ↓</th>';
  for (let i = 0; i < 16; i++) {
    html += `<th>${i.toString(16).toUpperCase()}</th>`;
  }
  html += "</tr>";

  for (let row = 0; row < 8; row++) {
    html += `<tr><th>${row}</th>`;
    for (let col = 0; col < 16; col++) {
      const code = row * 16 + col;
      if (code < 32) {
        html += `<td class="hex-ascii-ctrl">${controlChars[code]}</td>`;
      } else if (code === 32) {
        html += "<td>SP</td>";
      } else if (code === 127) {
        html += '<td class="hex-ascii-ctrl">DEL</td>';
      } else {
        html += `<td>${String.fromCharCode(code)}</td>`;
      }
    }
    html += "</tr>";
  }
  html += "</table>";
  return html;
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
