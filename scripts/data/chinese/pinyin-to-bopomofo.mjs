// upstream src/converter.ts
var Converter = class {
  parser;
  transformer;
  constructor({ parser, transformer }) {
    this.parser = parser;
    this.transformer = transformer;
  }
  convert(text) {
    const syllableASTs = this.parser.parse(text);
    const result = this.transformer.transform(syllableASTs);
    return result;
  }
};

// upstream src/dictionaries.ts
var SYLLABLES_DICTIONARY = {
  "chuang": "\u3114\u3128\u3124",
  "shuang": "\u3115\u3128\u3124",
  "zhuang": "\u3113\u3128\u3124",
  "chang": "\u3114\u3124",
  "cheng": "\u3114\u3125",
  "chong": "\u3114\u3128\u3125",
  "chuai": "\u3114\u3128\u311E",
  "chuan": "\u3114\u3128\u3122",
  "guang": "\u310D\u3128\u3124",
  "huang": "\u310F\u3128\u3124",
  "jiang": "\u3110\u3127\u3124",
  "jiong": "\u3110\u3129\u3125",
  "kuang": "\u310E\u3128\u3124",
  "liang": "\u310C\u3127\u3124",
  "niang": "\u310B\u3127\u3124",
  "qiang": "\u3111\u3127\u3124",
  "qiong": "\u3111\u3129\u3125",
  "shang": "\u3115\u3124",
  "sheng": "\u3115\u3125",
  "shuai": "\u3115\u3128\u311E",
  "shuan": "\u3115\u3128\u3122",
  "xiang": "\u3112\u3127\u3124",
  "xiong": "\u3112\u3129\u3125",
  "zhang": "\u3113\u3124",
  "zheng": "\u3113\u3125",
  "zhong": "\u3113\u3128\u3125",
  "zhuai": "\u3113\u3128\u311E",
  "zhuan": "\u3113\u3128\u3122",
  "bang": "\u3105\u3124",
  "beng": "\u3105\u3125",
  "bian": "\u3105\u3127\u3122",
  "biao": "\u3105\u3127\u3120",
  "bing": "\u3105\u3127\u3125",
  "cang": "\u3118\u3124",
  "ceng": "\u3118\u3125",
  "chai": "\u3114\u311E",
  "chan": "\u3114\u3122",
  "chao": "\u3114\u3120",
  "chen": "\u3114\u3123",
  "chou": "\u3114\u3121",
  "chui": "\u3114\u3128\u311F",
  "chua": "\u3114\u3128\u311A",
  "chun": "\u3114\u3128\u3123",
  "chuo": "\u3114\u3128\u311B",
  "cong": "\u3118\u3128\u3125",
  "cuan": "\u3118\u3128\u3122",
  "dang": "\u3109\u3124",
  "deng": "\u3109\u3125",
  "dian": "\u3109\u3127\u3122",
  "diao": "\u3109\u3127\u3120",
  "ding": "\u3109\u3127\u3125",
  "dong": "\u3109\u3128\u3125",
  "duan": "\u3109\u3128\u3122",
  "fang": "\u3108\u3124",
  "feng": "\u3108\u3125",
  "gang": "\u310D\u3124",
  "geng": "\u310D\u3125",
  "gong": "\u310D\u3128\u3125",
  "guai": "\u310D\u3128\u311E",
  "guan": "\u310D\u3128\u3122",
  "hang": "\u310F\u3124",
  "heng": "\u310F\u3125",
  "hong": "\u310F\u3128\u3125",
  "huai": "\u310F\u3128\u311E",
  "huan": "\u310F\u3128\u3122",
  "jian": "\u3110\u3127\u3122",
  "jiao": "\u3110\u3127\u3120",
  "jing": "\u3110\u3127\u3125",
  "juan": "\u3110\u3129\u3122",
  "kang": "\u310E\u3124",
  "keng": "\u310E\u3125",
  "kong": "\u310E\u3128\u3125",
  "kuai": "\u310E\u3128\u311E",
  "kuan": "\u310E\u3128\u3122",
  "lang": "\u310C\u3124",
  "leng": "\u310C\u3125",
  "lian": "\u310C\u3127\u3122",
  "liao": "\u310C\u3127\u3120",
  "ling": "\u310C\u3127\u3125",
  "long": "\u310C\u3128\u3125",
  "l\xFCan": "\u310C\u3128\u3122",
  "mang": "\u3107\u3124",
  "meng": "\u3107\u3125",
  "mian": "\u3107\u3127\u3122",
  "miao": "\u3107\u3127\u3120",
  "ming": "\u3107\u3127\u3125",
  "nang": "\u310B\u3124",
  "neng": "\u310B\u3125",
  "nian": "\u310B\u3127\u3122",
  "niao": "\u310B\u3127\u3120",
  "ning": "\u310B\u3127\u3125",
  "nong": "\u310B\u3128\u3125",
  "nuan": "\u310B\u3128\u3122",
  "pang": "\u3106\u3124",
  "peng": "\u3106\u3125",
  "pian": "\u3106\u3127\u3122",
  "piao": "\u3106\u3127\u3120",
  "ping": "\u3106\u3127\u3125",
  "qian": "\u3111\u3127\u3122",
  "qiao": "\u3111\u3127\u3120",
  "qing": "\u3111\u3127\u3125",
  "quan": "\u3111\u3129\u3122",
  "rang": "\u3116\u3124",
  "reng": "\u3116\u3125",
  "rong": "\u3116\u3128\u3125",
  "ruan": "\u3116\u3128\u3122",
  "sang": "\u3119\u3124",
  "seng": "\u3119\u3125",
  "shai": "\u3115\u311E",
  "shan": "\u3115\u3122",
  "shao": "\u3115\u3120",
  "shei": "\u3115\u311F",
  "shen": "\u3115\u3123",
  "shou": "\u3115\u3121",
  "shua": "\u3115\u3128\u311A",
  "shui": "\u3115\u3128\u311F",
  "shun": "\u3115\u3128\u3123",
  "shuo": "\u3115\u3128\u311B",
  "song": "\u3119\u3128\u3125",
  "suan": "\u3119\u3128\u3122",
  "tang": "\u310A\u3124",
  "teng": "\u310A\u3125",
  "tian": "\u310A\u3127\u3122",
  "tiao": "\u310A\u3127\u3120",
  "ting": "\u310A\u3127\u3125",
  "tong": "\u310A\u3128\u3125",
  "tuan": "\u310A\u3128\u3122",
  "wang": "\u3128\u3124",
  "weng": "\u3128\u3125",
  "xian": "\u3112\u3127\u3122",
  "xiao": "\u3112\u3127\u3120",
  "xing": "\u3112\u3127\u3125",
  "xuan": "\u3112\u3129\u3122",
  "yang": "\u3127\u3124",
  "ying": "\u3127\u3125",
  "yong": "\u3129\u3125",
  "yuan": "\u3129\u3122",
  "zang": "\u3117\u3124",
  "zeng": "\u3117\u3125",
  "zhai": "\u3113\u311E",
  "zhan": "\u3113\u3122",
  "zhao": "\u3113\u3120",
  "zhen": "\u3113\u3123",
  "zhou": "\u3113\u3121",
  "zhua": "\u3113\u3128\u311A",
  "zhui": "\u3113\u3128\u311F",
  "zhun": "\u3113\u3128\u3123",
  "zhuo": "\u3113\u3128\u311B",
  "zong": "\u3117\u3128\u3125",
  "zuan": "\u3117\u3128\u3122",
  "ang": "\u3124",
  "bai": "\u3105\u311E",
  "ban": "\u3105\u3122",
  "bao": "\u3105\u3120",
  "bei": "\u3105\u311F",
  "ben": "\u3105\u3123",
  "bie": "\u3105\u3127\u311D",
  "bin": "\u3105\u3127\u3123",
  "cai": "\u3118\u311E",
  "can": "\u3118\u3122",
  "cao": "\u3118\u3120",
  "cou": "\u3118\u3121",
  "cen": "\u3118\u3123",
  "cei": "\u3118\u311F",
  "cha": "\u3114\u311A",
  "che": "\u3114\u311C",
  "chi": "\u3114",
  "chu": "\u3114\u3128",
  "cui": "\u3118\u3128\u311F",
  "cun": "\u3118\u3128\u3123",
  "cuo": "\u3118\u3128\u311B",
  "dai": "\u3109\u311E",
  "dan": "\u3109\u3122",
  "dao": "\u3109\u3120",
  "den": "\u3109\u3123",
  "dei": "\u3109\u311F",
  "die": "\u3109\u3127\u311D",
  "diu": "\u3109\u3127\u3121",
  "dou": "\u3109\u3121",
  "dui": "\u3109\u3128\u311F",
  "dun": "\u3109\u3128\u3123",
  "duo": "\u3109\u3128\u311B",
  "eng": "\u3125",
  "fan": "\u3108\u3122",
  "fiao": "\u3108\u3127\u3120",
  "fei": "\u3108\u311F",
  "fen": "\u3108\u3123",
  "fou": "\u3108\u3121",
  "gai": "\u310D\u311E",
  "gan": "\u310D\u3122",
  "gao": "\u310D\u3120",
  "gei": "\u310D\u311F",
  "gen": "\u310D\u3123",
  "gou": "\u310D\u3121",
  "gua": "\u310D\u3128\u311A",
  "gui": "\u310D\u3128\u311F",
  "gun": "\u310D\u3128\u3123",
  "guo": "\u310D\u3128\u311B",
  "hai": "\u310F\u311E",
  "han": "\u310F\u3122",
  "hao": "\u310F\u3120",
  "hei": "\u310F\u311F",
  "hen": "\u310F\u3123",
  "hou": "\u310F\u3121",
  "hua": "\u310F\u3128\u311A",
  "hui": "\u310F\u3128\u311F",
  "hun": "\u310F\u3128\u3123",
  "huo": "\u310F\u3128\u311B",
  "jia": "\u3110\u3127\u311A",
  "jie": "\u3110\u3127\u311D",
  "jin": "\u3110\u3127\u3123",
  "jiu": "\u3110\u3127\u3121",
  "jue": "\u3110\u3129\u311D",
  "jun": "\u3110\u3129\u3123",
  "kai": "\u310E\u311E",
  "kan": "\u310E\u3122",
  "kao": "\u310E\u3120",
  "ken": "\u310E\u3123",
  "kou": "\u310E\u3121",
  "kua": "\u310E\u3128\u311A",
  "kui": "\u310E\u3128\u311F",
  "kun": "\u310E\u3128\u3123",
  "kuo": "\u310E\u3128\u311B",
  "lai": "\u310C\u311E",
  "lan": "\u310C\u3122",
  "lao": "\u310C\u3120",
  "lei": "\u310C\u311F",
  "lia": "\u310C\u3127\u311A",
  "lie": "\u310C\u3127\u311D",
  "lin": "\u310C\u3127\u3123",
  "liu": "\u310C\u3127\u3121",
  "lou": "\u310C\u3121",
  "l\xFCe": "\u310C\u3129\u311D",
  "lun": "\u310C\u3128\u3123",
  "luo": "\u310C\u3128\u311B",
  "mai": "\u3107\u311E",
  "man": "\u3107\u3122",
  "mao": "\u3107\u3120",
  "mei": "\u3107\u311F",
  "men": "\u3107\u3123",
  "mie": "\u3107\u3127\u311D",
  "min": "\u3107\u3127\u3123",
  "miu": "\u3107\u3127\u3121",
  "mou": "\u3107\u3121",
  "nai": "\u310B\u311E",
  "nan": "\u310B\u3122",
  "nen": "\u310B\u3123",
  "nao": "\u310B\u3120",
  "nei": "\u310B\u311F",
  "nie": "\u310B\u3127\u311D",
  "nin": "\u310B\u3127\u3123",
  "niu": "\u310B\u3127\u3121",
  "nou": "\u310B\u3128\u3121",
  "n\xFCe": "\u310B\u3129\u311D",
  "nuo": "\u310B\u3128\u311B",
  "pai": "\u3106\u311E",
  "pan": "\u3106\u3122",
  "pao": "\u3106\u3120",
  "pei": "\u3106\u311F",
  "pen": "\u3106\u3123",
  "pie": "\u3106\u3127\u311D",
  "pin": "\u3106\u3127\u3123",
  "pou": "\u3106\u3121",
  "qia": "\u3111\u3127\u311A",
  "qie": "\u3111\u3127\u311D",
  "qin": "\u3111\u3127\u3123",
  "qiu": "\u3111\u3127\u3121",
  "que": "\u3111\u3129\u311D",
  "qun": "\u3111\u3129\u3123",
  "ran": "\u3116\u3122",
  "rao": "\u3116\u3120",
  "ren": "\u3116\u3123",
  "rou": "\u3116\u3121",
  "rui": "\u3116\u3128\u311F",
  "run": "\u3116\u3128\u3123",
  "ruo": "\u3116\u3128\u311B",
  "sai": "\u3119\u311E",
  "san": "\u3119\u3122",
  "sao": "\u3119\u3120",
  "sen": "\u3119\u3123",
  "sha": "\u3115\u311A",
  "she": "\u3115\u311C",
  "shi": "\u3115",
  "shu": "\u3115\u3128",
  "sou": "\u3119\u3121",
  "sui": "\u3119\u3128\u311F",
  "sun": "\u3119\u3128\u3123",
  "suo": "\u3119\u3128\u311B",
  "tai": "\u310A\u311E",
  "tan": "\u310A\u3122",
  "tao": "\u310A\u3120",
  "tie": "\u310A\u3127\u311D",
  "tou": "\u310A\u3121",
  "tui": "\u310A\u3128\u311F",
  "tun": "\u310A\u3128\u3123",
  "tuo": "\u310A\u3128\u311B",
  "wai": "\u3128\u311E",
  "wan": "\u3128\u3122",
  "wei": "\u3128\u311F",
  "wen": "\u3128\u3123",
  "xia": "\u3112\u3127\u311A",
  "xie": "\u3112\u3127\u311D",
  "xin": "\u3112\u3127\u3123",
  "xiu": "\u3112\u3127\u3121",
  "xue": "\u3112\u3129\u311D",
  "xun": "\u3112\u3129\u3123",
  "yan": "\u3127\u3122",
  "yao": "\u3127\u3120",
  "yin": "\u3127\u3123",
  "you": "\u3127\u3121",
  "yue": "\u3129\u311D",
  "yun": "\u3129\u3123",
  "zai": "\u3117\u311E",
  "zan": "\u3117\u3122",
  "zao": "\u3117\u3120",
  "zei": "\u3117\u311F",
  "zen": "\u3117\u3123",
  "zha": "\u3113\u311A",
  "zhe": "\u3113\u311C",
  "zhi": "\u3113",
  "zhu": "\u3113\u3128",
  "zou": "\u3117\u3121",
  "zui": "\u3117\u3128\u311F",
  "zun": "\u3117\u3128\u3123",
  "zuo": "\u3117\u3128\u311B",
  "ai": "\u311E",
  "an": "\u3122",
  "ao": "\u3120",
  "ba": "\u3105\u311A",
  "bi": "\u3105\u3127",
  "bo": "\u3105\u311B",
  "bu": "\u3105\u3128",
  "ca": "\u3118\u311A",
  "ce": "\u3118\u311C",
  "ci": "\u3118",
  "cu": "\u3118\u3128",
  "da": "\u3109\u311A",
  "de": "\u3109\u311C",
  "di": "\u3109\u3127",
  "du": "\u3109\u3128",
  "ei": "\u311F",
  "en": "\u3123",
  "er": "\u3126",
  "fa": "\u3108\u311A",
  "fo": "\u3108\u311B",
  "fu": "\u3108\u3128",
  "ga": "\u310D\u311A",
  "ge": "\u310D\u311C",
  "gu": "\u310D\u3128",
  "ha": "\u310F\u311A",
  "he": "\u310F\u311C",
  "hu": "\u310F\u3128",
  "ji": "\u3110\u3127",
  "ju": "\u3110\u3129",
  "ka": "\u310E\u311A",
  "ke": "\u310E\u311C",
  "ku": "\u310E\u3128",
  "la": "\u310C\u311A",
  "le": "\u310C\u311C",
  "li": "\u310C\u3127",
  "l\xFC": "\u310C\u3129",
  "lu": "\u310C\u3128",
  "lo": "\u310C\u311B",
  "ma": "\u3107\u311A",
  "me": "\u3107\u311C",
  "mi": "\u3107\u3127",
  "mo": "\u3107\u311B",
  "mu": "\u3107\u3128",
  "na": "\u310B\u311A",
  "ni": "\u310B\u3127",
  "n\xFC": "\u310B\u3129",
  "ne": "\u310B\u311C",
  "nu": "\u310B\u3128",
  "ou": "\u3121",
  "pa": "\u3106\u311A",
  "pi": "\u3106\u3127",
  "po": "\u3106\u311B",
  "pu": "\u3106\u3128",
  "qi": "\u3111\u3127",
  "qu": "\u3111\u3129",
  "re": "\u3116\u311C",
  "ri": "\u3116",
  "ru": "\u3116\u3128",
  "sa": "\u3119\u311A",
  "se": "\u3119\u311C",
  "si": "\u3119",
  "su": "\u3119\u3128",
  "ta": "\u310A\u311A",
  "te": "\u310A\u311C",
  "ti": "\u310A\u3127",
  "tu": "\u310A\u3128",
  "wa": "\u3128\u311A",
  "wo": "\u3128\u311B",
  "wu": "\u3128",
  "xi": "\u3112\u3127",
  "xu": "\u3112\u3129",
  "ya": "\u3127\u311A",
  "ye": "\u3127\u311D",
  "yi": "\u3127",
  "yu": "\u3129",
  "yo": "\u3127\u311B",
  "za": "\u3117\u311A",
  "ze": "\u3117\u311C",
  "zi": "\u3117",
  "zu": "\u3117\u3128",
  "a": "\u311A",
  "r": "\u3126",
  "\xEA": "\u311D",
  "e": "\u311C",
  "n": "\u310B",
  "m": "\u3107",
  "o": "\u311B"
};
var PINYIN_SYLLABLES = Object.keys(SYLLABLES_DICTIONARY);
var BOPOMOFO_SYLLABLES = Object.values(SYLLABLES_DICTIONARY);
var PINYIN_TO_BOPOMOFO_DICTIONARY = new Map(
  Object.entries(SYLLABLES_DICTIONARY)
);
var BOPOMOFO_TO_PINYIN_DICTIONARY = new Map(
  Object.entries(SYLLABLES_DICTIONARY).map(([pinyin, bopomofo]) => [bopomofo, pinyin])
);

// upstream src/tones.ts
var pinyinToneMap = /* @__PURE__ */ new Map([
  [String.fromCodePoint(772), 1],
  [String.fromCodePoint(769), 2],
  [String.fromCodePoint(780), 3],
  [String.fromCodePoint(768), 4]
]);
var pinyinTones = {
  1: String.fromCodePoint(772),
  2: String.fromCodePoint(769),
  3: String.fromCodePoint(780),
  4: String.fromCodePoint(768),
  5: ""
};
var zhuyinToneMap = /* @__PURE__ */ new Map([
  [String.fromCodePoint(714), 2],
  [String.fromCodePoint(711), 3],
  [String.fromCodePoint(715), 4],
  [String.fromCodePoint(729), 5]
]);
var zhuyinTones = {
  1: "",
  2: String.fromCodePoint(714),
  3: String.fromCodePoint(711),
  4: String.fromCodePoint(715),
  5: String.fromCodePoint(729)
};
var pinyinToneRegex = new RegExp(
  `(${[
    String.fromCodePoint(772),
    String.fromCodePoint(769),
    String.fromCodePoint(780),
    String.fromCodePoint(768)
  ].join("|")})`,
  "i"
);

// upstream src/parsers/parser.ts
var Parser = class {
};

// upstream src/parsers/bopomofo_parser.ts
var zhuyingAfterTones = [
  String.fromCodePoint(714),
  String.fromCodePoint(711),
  String.fromCodePoint(715)
];
var BopomofoParser = class extends Parser {
  parse(text) {
    const zhuyinSyllables = this.splitIntoZhuyinSyllablesAndTones(text);
    const syllableASTs = this.toSyllableASTs(zhuyinSyllables);
    return syllableASTs;
  }
  toSyllableASTs(syllables) {
    return syllables.map(({ syllable, tone }) => {
      const pinyinTone = this.getZhuyinToneNumber(tone);
      const pinyinSyllable = BOPOMOFO_TO_PINYIN_DICTIONARY.get(syllable);
      if (!pinyinSyllable) {
        throw new Error(`Invalid syllable: ${syllable}`);
      }
      return {
        tone: pinyinTone,
        syllable: pinyinSyllable
      };
    });
  }
  splitIntoZhuyinSyllablesAndTones(text) {
    if (text.length === 0) {
      return [];
    }
    if (this.isSpecialFirstTone(text)) {
      return this.handleSpecialFirstTone(text);
    }
    const matchingSyllable = this.findMatchingZhuyinSyllable(text);
    const { tone, restOfText } = this.extractToneAndRest(text, matchingSyllable);
    const otherSyllables = this.splitIntoZhuyinSyllablesAndTones(restOfText);
    return [
      { syllable: matchingSyllable, tone },
      ...otherSyllables
    ];
  }
  isSpecialFirstTone(text) {
    return text.slice(0, 1) === zhuyinTones[5];
  }
  handleSpecialFirstTone(text) {
    const rest = text.slice(1);
    const matchingSyllable = this.findMatchingZhuyinSyllable(rest);
    const restOfText = rest.slice(matchingSyllable.length);
    const otherSyllables = this.splitIntoZhuyinSyllablesAndTones(restOfText);
    return [
      { syllable: matchingSyllable, tone: zhuyinTones[5] },
      ...otherSyllables
    ];
  }
  findMatchingZhuyinSyllable(text) {
    const match = BOPOMOFO_SYLLABLES.find((syllable) => text.startsWith(syllable));
    if (!match) {
      throw new Error(`Couldn't find zhuying syllable in: ${text}`);
    }
    return match;
  }
  extractToneAndRest(text, syllable) {
    const characterAfterSyllable = text.slice(syllable.length, syllable.length + 1);
    if (characterAfterSyllable === "") {
      return { tone: "", restOfText: text.slice(syllable.length) };
    }
    const isValidAfterSyllableTone = zhuyingAfterTones.includes(characterAfterSyllable);
    const tone = isValidAfterSyllableTone ? characterAfterSyllable : "1";
    const restOfText = text.slice(syllable.length + (isValidAfterSyllableTone ? 1 : 0));
    return { tone, restOfText };
  }
  getZhuyinToneNumber(tone) {
    if (tone === "") {
      return 1;
    }
    return zhuyinToneMap.get(tone) ?? 1;
  }
};
var bopomofoParser = new BopomofoParser();

// upstream src/parsers/pinyin_number_parser.ts
var PINYIN_NUMBER_SYLLABLE_REGEX = /(?<syllable>[a-zü]+)(?<tone>\d)/g;
var PinyinNumberParser = class extends Parser {
  parse(text) {
    const syllables = text.matchAll(PINYIN_NUMBER_SYLLABLE_REGEX);
    const syllableASTs = Array.from(syllables, (match) => {
      const syllable = match.groups?.["syllable"];
      const tone = match.groups?.["tone"];
      if (!syllable || !tone) {
        throw new Error(`Invalid syllable '${match[0]}'`);
      }
      const toneNumber = parseInt(tone);
      if (!this.isValidTone(toneNumber)) {
        throw new Error(`Invalid tone '${tone}'`);
      }
      return {
        syllable,
        tone: toneNumber
      };
    });
    return syllableASTs;
  }
  isValidTone(tone) {
    return [1, 2, 3, 4, 5].includes(tone);
  }
};
var pinyinNumberParser = new PinyinNumberParser();

// upstream src/parsers/pinyin_tone_mark_parser.ts
var TONE_MATCH_REGEX = new RegExp(`[${[
  String.fromCodePoint(772),
  String.fromCodePoint(769),
  String.fromCodePoint(780),
  String.fromCodePoint(768)
].join("")}]`, "g");
var PinyinToneMarkParser = class extends Parser {
  parse(text) {
    const normalized = text.normalize("NFD");
    const matchedTones = this.extractToneMarks(normalized);
    const textWithoutTones = this.removeToneMarks(normalized, matchedTones);
    const syllables = this.splitIntoSyllables(textWithoutTones);
    const syllableASTs = this.associateTonesWithSyllables(syllables, matchedTones);
    return syllableASTs;
  }
  extractToneMarks(normalized) {
    const parsedTones = normalized.matchAll(TONE_MATCH_REGEX);
    return Array.from(parsedTones, (match) => ({ tone: match[0], index: match.index }));
  }
  removeToneMarks(normalized, matchedTones) {
    const matchedIndexes = new Set(matchedTones.map(({ index }) => index));
    return normalized.split("").filter((_, index) => !matchedIndexes.has(index)).join("").normalize("NFC");
  }
  splitIntoSyllables(text) {
    if (text.length === 0) {
      return [];
    }
    const matched = PINYIN_SYLLABLES.find((syllable) => text.startsWith(syllable));
    if (!matched) {
      throw new Error(`Can't find pinyin syllable in text '${text}'`);
    }
    const restOfText = text.slice(matched.length);
    const rest = this.splitIntoSyllables(restOfText);
    return [matched].concat(rest);
  }
  getToneNumber(matchedTone) {
    if (!matchedTone) {
      return 5;
    }
    return pinyinToneMap.get(matchedTone.tone) ?? 5;
  }
  associateTonesWithSyllables(syllables, matchedTones) {
    return syllables.reduce((acc, cur) => {
      const currentSyllableStartPosition = this.calculateSyllablesLength(acc);
      const currentSyllableEndPosition = currentSyllableStartPosition + cur.normalize("NFD").length;
      const matchedTone = this.findMatchedTone(matchedTones, currentSyllableStartPosition, currentSyllableEndPosition);
      const matchedToneNumber = this.getToneNumber(matchedTone);
      return acc.concat({
        syllable: cur,
        tone: matchedToneNumber
      });
    }, []);
  }
  calculateSyllablesLength(syllables) {
    return syllables.reduce((sum, cur) => {
      const toneLength = cur.tone === 5 ? 0 : 1;
      return sum + cur.syllable.length + toneLength;
    }, 0);
  }
  findMatchedTone(matchedTones, start, end) {
    return matchedTones.find(({ index }) => index >= start && index <= end);
  }
};
var pinyinToneMarkParser = new PinyinToneMarkParser();

// upstream src/transformers/transformer.ts
var Transformer = class {
};

// upstream src/transformers/bopomofo_transformer.ts
var BopomofoTransformer = class extends Transformer {
  transform(syllables) {
    const text = syllables.map(
      (syllable) => {
        const bopomofo = PINYIN_TO_BOPOMOFO_DICTIONARY.get(syllable.syllable);
        if (!bopomofo) {
          throw new Error(
            `Couldn't find bopomofo for syllable '${syllable.syllable}'`
          );
        }
        const tone = zhuyinTones[syllable.tone];
        if (syllable.tone === 5) {
          return `${tone}${bopomofo}`;
        }
        return `${bopomofo}${tone}`;
      }
    ).join("");
    return text;
  }
};
var bopomofoTransformer = new BopomofoTransformer();

// upstream src/transformers/pinyin_number_transformer.ts
var PinyinNumberTransformer = class extends Transformer {
  transform(syllables) {
    return syllables.map((syllable) => this.toPinyinNumber(syllable)).join("");
  }
  toPinyinNumber(syllable) {
    return `${syllable.syllable}${syllable.tone}`;
  }
};
var pinyinNumberTransformer = new PinyinNumberTransformer();

// upstream src/transformers/pinyin_tone_mark_transformer.ts
var MAIN_VOWELS = ["a", "e", "o", "\xFC"];
var PinyinToneMarkTransformer = class extends Transformer {
  transform(syllables) {
    return syllables.map((syllable) => this.toPinyinToneMark(syllable)).join("");
  }
  toPinyinToneMark(syllable) {
    const pinyinToneMark = pinyinTones[syllable.tone];
    const pos = this.findVowelPosition(syllable.syllable);
    if (pos === void 0) {
      throw new Error(`Couldn't find vowel for '${syllable.syllable}'`);
    }
    const syllableHead = syllable.syllable.slice(0, pos + 1);
    const syllableTail = syllable.syllable.slice(pos + 1);
    return `${syllableHead}${pinyinToneMark}${syllableTail}`.normalize("NFC");
  }
  findVowelPosition(syllable) {
    const mainVowelPositions = MAIN_VOWELS.map((vowel) => syllable.indexOf(vowel)).find((pos) => pos > -1);
    if (mainVowelPositions !== void 0) {
      return mainVowelPositions;
    }
    const iPosition = syllable.indexOf("i");
    const uPosition = syllable.indexOf("u");
    if (iPosition > -1 && uPosition > -1) {
      return Math.max(iPosition, uPosition);
    }
    if (uPosition > -1) {
      return uPosition;
    }
    if (iPosition > -1) {
      return iPosition;
    }
    return void 0;
  }
};
var pinyinToneMarkTransformer = new PinyinToneMarkTransformer();

// upstream src/converters.ts
function pinyinToBopomofo(pinyin, pinyinStyle = "TONE_MARK") {
  const parser = pinyinStyle === "TONE_MARK" ? pinyinToneMarkParser : pinyinNumberParser;
  const transformer = bopomofoTransformer;
  const converter = new Converter({
    parser,
    transformer
  });
  const bopomofo = converter.convert(pinyin);
  return bopomofo;
}
function bopomofoToPinyin(bopomofo, pinyinStyle = "TONE_MARK") {
  const parser = bopomofoParser;
  const transformer = pinyinStyle === "TONE_MARK" ? pinyinToneMarkTransformer : pinyinNumberTransformer;
  const converter = new Converter({
    parser,
    transformer
  });
  const pinyin = converter.convert(bopomofo);
  return pinyin;
}
export {
  bopomofoToPinyin,
  pinyinToBopomofo
};
