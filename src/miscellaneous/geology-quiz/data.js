// ============================================================
// data.js  |  地質年代クイズ 共通データ
// quiz.html / timeline.html から <script src="data.js"> で読み込む
// ============================================================

const PERIOD_LIST = [
  // 先カンブリア時代
  {
    id: "hadean",
    name: "冥王代",
    nameEn: "Hadean",
    era: "precambrian",
    mya: "46〜40億年前",
    color: "#3D1C00",
    accent: "#7A3A00",
    description:
      "地球誕生直後。表面はマグマオーシャンに覆われ、隕石が激しく降り注いだ。大気はほぼ水蒸気・二酸化炭素。生命は存在しない。",
    organisms: [],
  },
  {
    id: "archean",
    name: "太古代",
    nameEn: "Archean",
    era: "precambrian",
    mya: "40〜25億年前",
    color: "#4A1F00",
    accent: "#9A4410",
    description:
      "地球最初の生命（原核生物）が誕生。シアノバクテリアが光合成を開始し、大気中に酸素を放出し始めた。ストロマトライトがこの時代の証拠として残っている。",
    organisms: ["stromatolite"],
  },
  {
    id: "proterozoic",
    name: "原生代",
    nameEn: "Proterozoic",
    era: "precambrian",
    mya: "25〜5.4億年前",
    color: "#5A2E05",
    accent: "#B8560F",
    description:
      "酸素濃度が上昇し、オゾン層が形成される。真核生物が出現し、後期には多細胞生物（エディアカラ生物群）が登場。全球凍結（スノーボールアース）も起きた。",
    organisms: ["ediacaran"],
  },
  // 古生代
  {
    id: "cambrian",
    name: "カンブリア紀",
    nameEn: "Cambrian",
    era: "paleozoic",
    mya: "5.4〜4.9億年前",
    color: "#0B3D2E",
    accent: "#1A7A5A",
    description:
      "「カンブリア爆発」と呼ばれる爆発的な生物多様化が起きた。眼・殻・脚など複雑な構造を持つ動物が一斉に出現。バージェス頁岩・澄江動物群の化石が有名。",
    organisms: ["anomalocaris", "trilobite"],
  },
  {
    id: "ordovician",
    name: "オルドビス紀",
    nameEn: "Ordovician",
    era: "paleozoic",
    mya: "4.9〜4.4億年前",
    color: "#0D4233",
    accent: "#1E8A65",
    description:
      "海洋生物（腕足類・筆石・三葉虫など）がさらに多様化。植物が陸上へ最初に進出し始めた。末期に大量絶滅が起き、海洋生物の約85%が絶滅した。",
    organisms: [],
  },
  {
    id: "silurian",
    name: "シルル紀",
    nameEn: "Silurian",
    era: "paleozoic",
    mya: "4.4〜4.2億年前",
    color: "#0F4838",
    accent: "#219970",
    description:
      "魚類（顎を持つ魚類）が発展。陸上に維管束植物（クックソニアなど）が本格的に定着し、節足動物も上陸した。珊瑚礁が形成されるようになった。",
    organisms: [],
  },
  {
    id: "devonian",
    name: "デボン紀",
    nameEn: "Devonian",
    era: "paleozoic",
    mya: "4.2〜3.6億年前",
    color: "#124F3F",
    accent: "#24A87C",
    description:
      "「魚の時代」。甲冑魚・肺魚・総鰭類が繁栄。総鰭類から両生類が進化し陸上に進出。陸上では木生シダが繁茂。アンモナイト類の祖先が誕生。",
    organisms: [],
  },
  {
    id: "carboniferous",
    name: "石炭紀",
    nameEn: "Carboniferous",
    era: "paleozoic",
    mya: "3.6〜3.0億年前",
    color: "#1C3A22",
    accent: "#38782E",
    description:
      "高温多湿の大森林時代。リンボク・フウインボクなどの巨大木生シダが繁茂し、その遺骸が現在の石炭となった。昆虫・爬虫類が出現。酸素濃度が史上最高水準に達した。",
    organisms: ["lepidodendron"],
  },
  {
    id: "permian",
    name: "ペルム紀",
    nameEn: "Permian",
    era: "paleozoic",
    mya: "3.0〜2.52億年前",
    color: "#2A2A1A",
    accent: "#6A6A22",
    description:
      "古生代最後の時代。超大陸パンゲアが形成された。末期（P-T境界）に史上最大の大量絶滅が発生し、全生物種の96%・海洋生物種の90%以上が消滅した。フズリナもここで絶滅。",
    organisms: ["fusulinid"],
  },
  // 中生代
  {
    id: "triassic",
    name: "三畳紀",
    nameEn: "Triassic",
    era: "mesozoic",
    mya: "2.52〜2.01億年前",
    color: "#6B2D00",
    accent: "#C85A00",
    description:
      "P-T境界大量絶滅からの回復期。最初の恐竜・哺乳類の祖先が出現。イクチオサウルス・プレシオサウルスなど海の爬虫類も誕生。針葉樹が陸上を支配し始めた。",
    organisms: ["ichthyosaurus"],
  },
  {
    id: "jurassic",
    name: "ジュラ紀",
    nameEn: "Jurassic",
    era: "mesozoic",
    mya: "2.01〜1.45億年前",
    color: "#4A5A00",
    accent: "#8AB000",
    description:
      "恐竜が最盛期を迎えた。ブラキオサウルスなど巨大竜脚類・ステゴサウルスが出現。始祖鳥が登場し鳥類の進化が始まった。アンモナイトが大繁栄した。",
    organisms: ["brachiosaurus", "ammonite"],
  },
  {
    id: "cretaceous",
    name: "白亜紀",
    nameEn: "Cretaceous",
    era: "mesozoic",
    mya: "1.45〜0.66億年前",
    color: "#003D6B",
    accent: "#0075CC",
    description:
      "ティラノサウルス・トリケラトプスなどが全盛を誇った。被子植物が出現・拡大し昆虫との共進化が進んだ。末期（K-Pg境界）に巨大隕石が衝突し、恐竜・アンモナイトが絶滅した。",
    organisms: ["tyrannosaurus", "pteranodon"],
  },
  // 新生代
  {
    id: "paleogene",
    name: "古第三紀",
    nameEn: "Paleogene",
    era: "cenozoic",
    mya: "6600〜2300万年前",
    color: "#7A4A00",
    accent: "#E08800",
    description:
      "恐竜絶滅後、哺乳類が急速に多様化し様々なニッチを占めた。霊長類・鯨類の祖先が出現。北太平洋では謎の海生哺乳類デスモスチルスが進化した。",
    organisms: ["desmostylus"],
  },
  {
    id: "neogene",
    name: "新第三紀",
    nameEn: "Neogene",
    era: "cenozoic",
    mya: "2300〜258万年前",
    color: "#8A3500",
    accent: "#F06000",
    description:
      "日本列島が大陸から分離し現在の形に近づいた。温暖な海にビカリア（巻き貝）が棲息。草原の拡大に伴い大型草食哺乳類が多様化。アフリカでは人類の祖先が誕生した。",
    organisms: ["vicarya"],
  },
  {
    id: "quaternary",
    name: "第四紀",
    nameEn: "Quaternary",
    era: "cenozoic",
    mya: "258万年前〜現在",
    color: "#6B2200",
    accent: "#CC4400",
    description:
      "氷河時代（氷期・間氷期のサイクル）。マンモス・ナウマンゾウなど大型哺乳類が繁栄するも、多くが末期に絶滅した。現生人類（ホモ・サピエンス）が登場し文明を築いた。",
    organisms: ["mammoth", "naumanni"],
  },
];

const ERA_GROUPS = [
  {
    id: "precambrian",
    name: "先カンブリア時代",
    color: "#6B3300",
    barColor: "#9B5320",
    textColor: "#FFD090",
    periods: ["hadean", "archean", "proterozoic"],
  },
  {
    id: "paleozoic",
    name: "古生代",
    color: "#0D5E42",
    barColor: "#1D8E62",
    textColor: "#90FFD0",
    periods: [
      "cambrian",
      "ordovician",
      "silurian",
      "devonian",
      "carboniferous",
      "permian",
    ],
  },
  {
    id: "mesozoic",
    name: "中生代",
    color: "#1A3A7A",
    barColor: "#2A6ACA",
    textColor: "#90C8FF",
    periods: ["triassic", "jurassic", "cretaceous"],
  },
  {
    id: "cenozoic",
    name: "新生代",
    color: "#7A3500",
    barColor: "#CA6510",
    textColor: "#FFB870",
    periods: ["paleogene", "neogene", "quaternary"],
  },
];

const ORGANISMS = [
  {
    id: "stromatolite",
    name: "ストロマトライト",
    nameEn: "Stromatolite",
    emoji: "🪨",
    correctPeriod: "archean",
    isIndexFossil: true,
    periodLabel: "太古代",
    rangeLabel: "太古代〜現在",
    description:
      "シアノバクテリアが積み重なってできた層状の岩石構造。光合成によって地球に初めて酸素をもたらした生命の証拠。現在もオーストラリアのシャーク湾に生息している「生きた化石」。",
    hint: "地球最初の酸素生産者。光合成で大気を変えた",
  },
  {
    id: "ediacaran",
    name: "エディアカラ生物群",
    nameEn: "Ediacaran Biota",
    emoji: "🌿",
    correctPeriod: "proterozoic",
    isIndexFossil: false,
    periodLabel: "原生代",
    rangeLabel: "原生代末期",
    description:
      "約6〜5.4億年前に出現した多細胞生物の集団。チャーニア・ディッキンソニアなど現代の動物との関係が不明な不思議な形の生物が多い。骨格や殻を持たず軟体のまま化石化した。",
    hint: "多細胞生物の先駆け。現代の動物との関係は謎に包まれている",
  },
  {
    id: "anomalocaris",
    name: "アノマロカリス",
    nameEn: "Anomalocaris",
    emoji: "🦐",
    correctPeriod: "cambrian",
    isIndexFossil: false,
    periodLabel: "カンブリア紀",
    rangeLabel: "カンブリア紀",
    description:
      "カンブリア紀最大の捕食者。体長1m近くに達し、複眼と強力なハサミ状の前肢を持つ。バージェス頁岩から発見され、カンブリア爆発の象徴的な生物。",
    hint: "カンブリア紀の海の「王者」。体長最大1m",
  },
  {
    id: "trilobite",
    name: "三葉虫",
    nameEn: "Trilobite",
    emoji: "🦞",
    correctPeriod: "cambrian",
    isIndexFossil: true,
    periodLabel: "カンブリア紀〜ペルム紀",
    rangeLabel: "カンブリア紀〜ペルム紀（古生代全体）",
    description:
      "古生代を通じて繁栄した節足動物。体が「頭部・胸部・尾部」の3部、さらに左・軸・右の3葉に分かれる（名前の由来）。P-T境界の大量絶滅で全滅。古生代の代表的な示準化石。",
    hint: "古生代全体の示準化石。P-T境界（ペルム紀末）で絶滅した",
  },
  {
    id: "fusulinid",
    name: "フズリナ（紡錘虫）",
    nameEn: "Fusulinid",
    emoji: "🥜",
    correctPeriod: "permian",
    isIndexFossil: true,
    periodLabel: "石炭紀〜ペルム紀",
    rangeLabel: "石炭紀〜ペルム紀（古生代後期）",
    description:
      "石炭紀〜ペルム紀の浅い温暖な海に大量に棲んでいた有孔虫の仲間。米粒ほどの小さな殻を持ち石灰岩を作った。ペルム紀末の大量絶滅で完全に絶滅した。古生代後期の示準化石。",
    hint: "米粒サイズ。石炭紀〜ペルム紀の示準化石。ペルム紀末に絶滅",
  },
  {
    id: "lepidodendron",
    name: "リンボク（鱗木）",
    nameEn: "Lepidodendron",
    emoji: "🌲",
    correctPeriod: "carboniferous",
    isIndexFossil: false,
    periodLabel: "石炭紀",
    rangeLabel: "石炭紀〜ペルム紀初期",
    description:
      "石炭紀の巨大な樹木型シダ植物。高さ30〜40mに達し、幹の表面に鱗状の跡が残る（「鱗木」の名前の由来）。この時代の大森林が地中に埋もれて現在の石炭の起源となった。",
    hint: "石炭の原料になった石炭紀の巨大シダ植物",
  },
  {
    id: "ammonite",
    name: "アンモナイト",
    nameEn: "Ammonite",
    emoji: "🐌",
    correctPeriod: "jurassic",
    isIndexFossil: true,
    periodLabel: "デボン紀〜白亜紀",
    rangeLabel: "デボン紀〜白亜紀末（中生代に最盛期）",
    description:
      "巻き貝のような殻を持つ頭足類（タコ・イカの仲間）。デボン紀に出現し中生代（特にジュラ紀〜白亜紀）に大繁栄。白亜紀末に恐竜とともに絶滅した。中生代の代表的な示準化石。",
    hint: "恐竜と同時期に繁栄・絶滅した中生代の示準化石",
  },
  {
    id: "ichthyosaurus",
    name: "イクチオサウルス",
    nameEn: "Ichthyosaurus",
    emoji: "🐬",
    correctPeriod: "triassic",
    isIndexFossil: false,
    periodLabel: "三畳紀〜白亜紀",
    rangeLabel: "三畳紀（出現）〜白亜紀",
    description:
      "三畳紀から白亜紀にかけて海に棲んだ大型爬虫類。魚のような流線型の体形でイルカに似た外見だが爬虫類。空気呼吸をし、卵ではなく直接子を産む胎生だった。",
    hint: "イルカに似た海の爬虫類。三畳紀に出現した中生代の捕食者",
  },
  {
    id: "brachiosaurus",
    name: "ブラキオサウルス",
    nameEn: "Brachiosaurus",
    emoji: "🦕",
    correctPeriod: "jurassic",
    isIndexFossil: false,
    periodLabel: "ジュラ紀後期",
    rangeLabel: "ジュラ紀後期",
    description:
      "ジュラ紀後期に北アメリカ・アフリカに生息した巨大竜脚類恐竜。体長25m・体重70トン級で、前脚が後脚より長いのが特徴（名前の由来は「腕トカゲ」）。高い木の葉を食べた。",
    hint: "ジュラ紀後期を代表する巨大草食恐竜",
  },
  {
    id: "pteranodon",
    name: "プテラノドン",
    nameEn: "Pteranodon",
    emoji: "🦅",
    correctPeriod: "cretaceous",
    isIndexFossil: false,
    periodLabel: "白亜紀後期",
    rangeLabel: "白亜紀後期",
    description:
      "白亜紀後期の翼竜。翼開長7〜9mに達する大型種で、歯を持たずくちばしで魚をすくい取った。恐竜ではなく翼竜（飛行爬虫類）であり現在の鳥類とは別系統。",
    hint: "白亜紀の空を飛ぶ爬虫類（恐竜ではなく翼竜）",
  },
  {
    id: "tyrannosaurus",
    name: "ティラノサウルス",
    nameEn: "Tyrannosaurus rex",
    emoji: "🦖",
    correctPeriod: "cretaceous",
    isIndexFossil: false,
    periodLabel: "白亜紀末期",
    rangeLabel: "白亜紀最末期",
    description:
      "白亜紀末期（約6800〜6600万年前）の北アメリカに生息した最大級の肉食恐竜。体長13m・体重9トン。強力な顎と鋭い歯で最上位捕食者として君臨した。小さな前脚が特徴。",
    hint: "白亜紀末期の陸上最強捕食者。K-Pg境界で絶滅",
  },
  {
    id: "desmostylus",
    name: "デスモスチルス",
    nameEn: "Desmostylus",
    emoji: "🦛",
    correctPeriod: "paleogene",
    isIndexFossil: false,
    periodLabel: "古第三紀〜新第三紀",
    rangeLabel: "古第三紀漸新世〜新第三紀中新世",
    description:
      "北太平洋沿岸（日本含む）に生息した大型海生哺乳類。カバのような体格で海岸で海草を食べた。独自の進化を遂げた束柱目（そくちゅうもく）に属し、現生の類縁種はいない。",
    hint: "日本周辺の海岸に棲んでいた謎の海生哺乳類",
  },
  {
    id: "vicarya",
    name: "ビカリア",
    nameEn: "Vicarya",
    emoji: "🐚",
    correctPeriod: "neogene",
    isIndexFossil: true,
    periodLabel: "新第三紀",
    rangeLabel: "新第三紀中新世",
    description:
      "新第三紀中新世（約2000〜1000万年前）の温暖な浅海に棲んだ巻き貝。日本各地の地層から化石が発見され、当時の日本が熱帯〜亜熱帯の海であったことを示す。新第三紀の代表的な示準化石。",
    hint: "新第三紀の温暖な海の巻き貝。日本各地で化石が出土",
  },
  {
    id: "mammoth",
    name: "マンモス",
    nameEn: "Woolly Mammoth",
    emoji: "🦣",
    correctPeriod: "quaternary",
    isIndexFossil: false,
    periodLabel: "第四紀",
    rangeLabel: "第四紀更新世〜完新世初期",
    description:
      "第四紀の氷河時代にユーラシア・北アメリカに生息した大型哺乳類。ゾウの仲間で長い体毛と大きく曲がった牙を持つ。約4000年前まで生存。シベリアの永久凍土から冷凍個体が多数発見される。",
    hint: "氷河時代のシンボル。永久凍土から冷凍化石が見つかる",
  },
  {
    id: "naumanni",
    name: "ナウマンゾウ",
    nameEn: "Naumann's Elephant",
    emoji: "🐘",
    correctPeriod: "quaternary",
    isIndexFossil: false,
    periodLabel: "第四紀",
    rangeLabel: "第四紀更新世",
    description:
      "日本列島に生息した固有のゾウ。体高約2.5mと現生のゾウより小型。約3〜1万年前に日本各地に棲み、野尻湖（長野県）などで大量の化石が発見されている。日本の第四紀を代表する化石動物。",
    hint: "日本固有のゾウ。野尻湖遺跡で有名",
  },
];

// 画像パスを取得する関数（images/ フォルダに organism.id.png を置く）
function getImagePath(organismId, ext = "png") {
  return `images/${organismId}.${ext}`;
}

function getImageFallbackPath(organismId, currentSrc = "") {
  const isPng = String(currentSrc).toLowerCase().includes(".png");
  return getImagePath(organismId, isPng ? "jpg" : "png");
}

// 期間IDから期間オブジェクトを取得
function getPeriodById(id) {
  return PERIOD_LIST.find((p) => p.id === id);
}

// 生物IDから生物オブジェクトを取得
function getOrganismById(id) {
  return ORGANISMS.find((o) => o.id === id);
}
