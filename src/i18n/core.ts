export const locales = ['zh-TW', 'zh-CN', 'en'] as const;
export type Locale = typeof locales[number];

export const messages = {
  'zh-TW': {
    // Navigation & Brand
    tagline: '中英打字競技場',
    language: '介面語言',
    local: '本機練習',
    guest: '訪客模式 · 無須登入',

    // Hero
    heroEyebrow: '三種語言 · 一個競技場',
    introTitle: '每一次敲擊，都讓你更快一步。',
    introTitlePrefix: '每一次敲擊，',
    introTitleAccent: '都讓你更快一步。',
    introText: '英文、簡體拼音、繁體注音三種訓練模式。',

    // How to Play & Rules
    howToPlayTag: '遊戲規則',
    rulesTitle: '遊戲規則說明',
    step1: '選擇練習模式與挑戰時限',
    step2: '按 Enter 或開始挑戰',
    step3: '依照目標字元輸入',
    step4: '使用 Backspace 修正錯字',
    step5: '使用 Esc 暫停練習',

    // Onboarding Guide
    guide: '新手導覽',
    guideTitle: '歡迎來到 TriType Arena',
    guideIntro: '第一次玩？三個步驟即可開始。',
    guideStep1: '選擇英文、拼音或注音模式',
    guideStep2: '調整時間與提示',
    guideStep3: '開始輸入，查看準確率與速度',
    next: '下一步',
    back: '上一步',
    finish: '開始使用',
    skip: '跳過',
    reopen: '重新開啟新手教學',
    privacy: '紀錄存在這台裝置的瀏覽器，清除網站資料後可能遺失。',

    // Mode & Duration
    modeSelectLabel: '選擇語言模式',
    modeEn: 'English',
    modeEnDesc: '英文標準鍵盤',
    modePinyin: '簡體拼音',
    modePinyinDesc: 'Hanyu Pinyin',
    modeZhuyin: '繁體注音',
    modeZhuyinDesc: '大千式鍵盤',
    durationLabel: '挑戰時限：',
    duration30: '30 秒衝刺',
    duration60: '60 秒標準',
    duration120: '120 秒耐力',
    showHints: '顯示讀音/鍵位提示',

    // Difficulty
    difficultyLabel: '難度等級：',
    difficultyBeginner: '初級',
    difficultyIntermediate: '中級',
    difficultyAdvanced: '高級',
    difficultyBeginnerDesc: '高頻日常單詞與基礎表達',
    difficultyIntermediateDesc: '進階長詞與組合鍵位',
    difficultyAdvancedDesc: '複雜詞組與高精準度挑戰',

    // Learning Dashboard & Weak Keys
    dashboardTitle: '學習進度與弱鍵分析',
    dashboardOpenBtn: '學習進度',
    dashboardCloseBtn: '關閉進度面板',
    dashboardEmpty: '尚未有練習紀錄。完成一次挑戰即可查看分析！',
    statTotalSessions: '總練習次數',
    statRecentWpm: '近期平均 WPM',
    statRecentAccuracy: '近期平均準確率',
    statBestScore: '最佳成績',
    statMostPracticed: '最常練習模式',
    trendWpm: 'WPM 趨勢',
    trendAccuracy: '準確率趨勢',
    weakKeysTitle: '待加強鍵位分析',
    weakKeysEmpty: '表現優異！目前沒有錯誤率達 20% 的待加強鍵位。',
    weakKeysInsufficient: '數據累積中（需至少練習 10 次按鍵）',
    keyColumnKey: '按鍵 / 符號',
    keyColumnAttempts: '嘗試次數',
    keyColumnErrors: '錯誤次數',
    keyColumnRate: '錯誤率',
    reviewModeBtn: '開始弱鍵專項複習',
    reviewActiveNotice: '正在進行弱鍵專項複習模式',
    clearHistoryBtn: '清除學習紀錄',
    clearHistoryConfirm: '確定要清除所有本機學習紀錄嗎？',

    // Typing Arena
    statusIdle: '準備就緒',
    statusRunning: '挑戰進行中',
    statusPaused: '練習已暫停 (ESC)',
    statusFinished: '挑戰完成',
    targetAriaLabel: '目標字元比對序列',
    placeholderIdle: '按 Enter 或點擊「開始挑戰」進入對戰…',
    placeholderPaused: '已暫停，按 Space 或點擊「繼續」…',
    placeholderRunning: '專注敲擊鍵盤…',
    inputAriaLabel: '打字輸入框',
    btnStart: '▶ 開始挑戰 (Enter)',
    btnPause: '⏸ 暫停 (Esc)',
    btnAbandon: '↺ 放棄重試',
    btnResume: '▶ 繼續挑戰 (Space)',
    btnRestart: '↺ 重新開始',

    // Live Stats
    liveTag: '即時數據',
    livePerformance: '即時表現數據',
    statSpeed: '打字速度',
    statAccuracy: '準確率',
    statWords: '完成詞數',
    statStreak: '當前連擊',
    statBest: '本機最高得分',

    // Result Modal
    resultTag: '挑戰完成',
    resultTitle: '挑戰結束！總結算',
    scoreFinal: '最終得分',
    scoreSpeed: '速度',
    scoreAccuracy: '準確率',
    scoreWords: '正確詞數',
    scoreStreak: '最高連擊',
    wordsUnit: '詞',
    typoReview: '錯字與弱鍵複習',
    typoReviewCount: '次按鍵失誤',
    typoZero: '🎉 太完美了！本場挑戰零失誤完全命中！',
    typoMistypedAs: '誤按為',
    typoMistyped: '誤按',
    typoTimes: '次',
    btnPlayAgain: '↺ 再來一局 (Enter)',

    // Daqian Keyboard
    keyboardAriaLabel: '注音大千鍵位速查表',
    keyboardBadge: '鍵位速查',
    keyboardTitle: '標準大千鍵盤 · 實體按鍵映射',
    keyboardSubtitle: '第一聲請按空白鍵 Space；二聲 6、三聲 3、四聲 4、輕聲 7',
    keyboardGridAria: '大千鍵盤佈局',
    keyboardKeyTitle: '按鍵',
    keyboardNote: '💡 提示：本模式旨在鍛鍊實體鍵盤至注音符號之盲打肌肉記憶，與作業系統中文 IME 候選字選擇為獨立練習。',
    zhuyinSpaceHint: '第一聲請按空白鍵 Space',
    firstToneSpaceLabel: '第一聲',
    firstToneSpaceTooltip: '第一聲 (空白鍵 Space)',

    // Footer
    footerText: 'TriType Arena © 2026 · 程式碼 MIT 授權 · 詞庫授權詳見來源聲明',
    footerNotices: '第三方資料與授權聲明',
  },
  'zh-CN': {
    // Navigation & Brand
    tagline: '中英打字竞技场',
    language: '界面语言',
    local: '本地练习',
    guest: '访客模式 · 无需登录',

    // Hero
    heroEyebrow: '三种语言 · 一个竞技场',
    introTitle: '每一次敲击，都让你更快一步。',
    introTitlePrefix: '每一次敲击，',
    introTitleAccent: '都让你更快一步。',
    introText: '英语、简体拼音、繁体注音三种训练模式。',

    // How to Play & Rules
    howToPlayTag: '游戏规则',
    rulesTitle: '游戏规则说明',
    step1: '选择训练模式和挑战时间',
    step2: '按 Enter 或开始挑战',
    step3: '按照目标字符输入',
    step4: '使用 Backspace 修正错误',
    step5: '使用 Esc 暂停练习',

    // Onboarding Guide
    guide: '新手指引',
    guideTitle: '欢迎来到 TriType Arena',
    guideIntro: '第一次玩？三个步骤即可开始。',
    guideStep1: '选择英语、拼音或注音模式',
    guideStep2: '调整时间与提示',
    guideStep3: '开始输入，查看准确率与速度',
    next: '下一步',
    back: '上一步',
    finish: '开始使用',
    skip: '跳过',
    reopen: '重新打开新手教程',
    privacy: '记录存于当前设备的浏览器，清除网站数据后可能丢失。',

    // Mode & Duration
    modeSelectLabel: '选择语言模式',
    modeEn: 'English',
    modeEnDesc: '英文标准键盘',
    modePinyin: '简体拼音',
    modePinyinDesc: 'Hanyu Pinyin',
    modeZhuyin: '繁体注音',
    modeZhuyinDesc: '大千式键盘',
    durationLabel: '挑战时间：',
    duration30: '30 秒冲刺',
    duration60: '60 秒标准',
    duration120: '120 秒耐力',
    showHints: '显示读音/键位提示',

    // Difficulty
    difficultyLabel: '难度等级：',
    difficultyBeginner: '初级',
    difficultyIntermediate: '中级',
    difficultyAdvanced: '高级',
    difficultyBeginnerDesc: '高频日常单词与基础表达',
    difficultyIntermediateDesc: '进阶长词与组合键位',
    difficultyAdvancedDesc: '复杂词组与高精准度挑战',

    // Learning Dashboard & Weak Keys
    dashboardTitle: '学习进度与弱键分析',
    dashboardOpenBtn: '学习进度',
    dashboardCloseBtn: '关闭进度面板',
    dashboardEmpty: '暂无练习记录。完成一次挑战即可查看分析！',
    statTotalSessions: '总练习次数',
    statRecentWpm: '近期平均 WPM',
    statRecentAccuracy: '近期平均准确率',
    statBestScore: '最佳成绩',
    statMostPracticed: '最常练习模式',
    trendWpm: 'WPM 趋势',
    trendAccuracy: '准确率趋势',
    weakKeysTitle: '待加强键位分析',
    weakKeysEmpty: '表现优异！目前没有错误率达 20% 的待加强键位。',
    weakKeysInsufficient: '数据积累中（需至少练习 10 次按键）',
    keyColumnKey: '按键 / 符号',
    keyColumnAttempts: '尝试次数',
    keyColumnErrors: '错误次数',
    keyColumnRate: '错误率',
    reviewModeBtn: '开始弱键专项复习',
    reviewActiveNotice: '正在进行弱键专项复习模式',
    clearHistoryBtn: '清除学习记录',
    clearHistoryConfirm: '确定要清除所有本机学习记录吗？',

    // Typing Arena
    statusIdle: '准备就绪',
    statusRunning: '挑战进行中',
    statusPaused: '练习已暂停 (ESC)',
    statusFinished: '挑战完成',
    targetAriaLabel: '目标字符比对序列',
    placeholderIdle: '按 Enter 或点击“开始挑战”进入挑战…',
    placeholderPaused: '已暂停，按 Space 或点击“继续”…',
    placeholderRunning: '专注敲击键盘…',
    inputAriaLabel: '打字输入框',
    btnStart: '▶ 开始挑战 (Enter)',
    btnPause: '⏸ 暂停 (Esc)',
    btnAbandon: '↺ 放弃重试',
    btnResume: '▶ 继续挑战 (Space)',
    btnRestart: '↺ 重新开始',

    // Live Stats
    liveTag: '实时数据',
    livePerformance: '实时表现数据',
    statSpeed: '打字速度',
    statAccuracy: '准确率',
    statWords: '完成词数',
    statStreak: '当前连击',
    statBest: '本机最高得分',

    // Result Modal
    resultTag: '挑战完成',
    resultTitle: '挑战结束！总结算',
    scoreFinal: '最终得分',
    scoreSpeed: '速度',
    scoreAccuracy: '准确率',
    scoreWords: '正确词数',
    scoreStreak: '最高连击',
    wordsUnit: '词',
    typoReview: '错字与弱键复习',
    typoReviewCount: '次按键失误',
    typoZero: '🎉 太完美了！本场挑战零失误完全命中！',
    typoMistypedAs: '误按为',
    typoMistyped: '误按',
    typoTimes: '次',
    btnPlayAgain: '↺ 再来一局 (Enter)',

    // Daqian Keyboard
    keyboardAriaLabel: '注音大千键位速查表',
    keyboardBadge: '键位速查',
    keyboardTitle: '标准大千键盘 · 实体按键映射',
    keyboardSubtitle: '第一声请按空格键 Space；二声 6、三声 3、四声 4、轻声 7',
    keyboardGridAria: '大千键盘布局',
    keyboardKeyTitle: '按键',
    keyboardNote: '💡 提示：本模式旨在锻炼实体键盘至注音符号之盲打肌肉记忆，与操作系统中文 IME 候选字选择为独立练习。',
    zhuyinSpaceHint: '第一声请按空格键 Space',
    firstToneSpaceLabel: '第一声',
    firstToneSpaceTooltip: '第一声 (空格键 Space)',

    // Footer
    footerText: 'TriType Arena © 2026 · 代码 MIT 许可 · 词库许可详见来源声明',
    footerNotices: '第三方数据与许可声明',
  },
  en: {
    // Navigation & Brand
    tagline: 'Tri-language Typing Arena',
    language: 'Interface language',
    local: 'Local practice',
    guest: 'Guest mode · no sign-in',

    // Hero
    heroEyebrow: 'THREE LANGUAGES · ONE ARENA',
    introTitle: 'Every keystroke makes you faster.',
    introTitlePrefix: 'Every keystroke ',
    introTitleAccent: 'makes you faster.',
    introText: 'Practice English, Hanyu Pinyin, and Zhuyin keyboard skills.',

    // How to Play & Rules
    howToPlayTag: 'HOW TO PLAY',
    rulesTitle: 'How to play',
    step1: 'Choose a mode and a time limit',
    step2: 'Press Enter or Start',
    step3: 'Type the target characters in order',
    step4: 'Use Backspace to correct mistakes',
    step5: 'Press Esc to pause',

    // Onboarding Guide
    guide: 'Quick start',
    guideTitle: 'Welcome to TriType Arena',
    guideIntro: 'New here? Get started in three steps.',
    guideStep1: 'Choose English, Pinyin, or Zhuyin',
    guideStep2: 'Set your duration and hints',
    guideStep3: 'Start typing and track accuracy and speed',
    next: 'Next',
    back: 'Back',
    finish: 'Start playing',
    skip: 'Skip',
    reopen: 'Show beginner guide',
    privacy: 'Results stay in this browser and may be lost if site data is cleared.',

    // Mode & Duration
    modeSelectLabel: 'Select typing mode',
    modeEn: 'English',
    modeEnDesc: 'Standard Latin keyboard',
    modePinyin: 'Hanyu Pinyin',
    modePinyinDesc: 'Pinyin romanization',
    modeZhuyin: 'Zhuyin (Bopomofo)',
    modeZhuyinDesc: 'Standard Daqian layout',
    durationLabel: 'Time limit:',
    duration30: '30s Sprint',
    duration60: '60s Standard',
    duration120: '120s Endurance',
    showHints: 'Show pronunciation / key hints',

    // Difficulty
    difficultyLabel: 'Difficulty:',
    difficultyBeginner: 'Beginner',
    difficultyIntermediate: 'Intermediate',
    difficultyAdvanced: 'Advanced',
    difficultyBeginnerDesc: 'High-frequency words & simple expressions',
    difficultyIntermediateDesc: 'Longer phrases & key sequences',
    difficultyAdvancedDesc: 'Complex vocabulary & precision challenge',

    // Learning Dashboard & Weak Keys
    dashboardTitle: 'Learning Progress & Weak Keys',
    dashboardOpenBtn: 'Learning Dashboard',
    dashboardCloseBtn: 'Close Dashboard',
    dashboardEmpty: 'No practice sessions yet. Complete a challenge to view insights!',
    statTotalSessions: 'Total Sessions',
    statRecentWpm: 'Recent Avg WPM',
    statRecentAccuracy: 'Recent Avg Accuracy',
    statBestScore: 'Best Score',
    statMostPracticed: 'Most Practiced Mode',
    trendWpm: 'WPM Trend',
    trendAccuracy: 'Accuracy Trend',
    weakKeysTitle: 'Weak-Key Analysis',
    weakKeysEmpty: 'Great job! No keys currently exceed the 20% error threshold.',
    weakKeysInsufficient: 'Collecting data (requires at least 10 attempts)',
    keyColumnKey: 'Key / Symbol',
    keyColumnAttempts: 'Attempts',
    keyColumnErrors: 'Errors',
    keyColumnRate: 'Error Rate',
    reviewModeBtn: 'Start Weak-Key Review',
    reviewActiveNotice: 'Practicing in Targeted Weak-Key Review Mode',
    clearHistoryBtn: 'Clear History',
    clearHistoryConfirm: 'Are you sure you want to clear all local learning history?',

    // Typing Arena
    statusIdle: 'READY TO TYPE',
    statusRunning: 'LIVE CHALLENGE',
    statusPaused: 'SESSION PAUSED (ESC)',
    statusFinished: 'COMPLETED',
    targetAriaLabel: 'Target character sequence',
    placeholderIdle: 'Press Enter or click "Start" to begin…',
    placeholderPaused: 'Paused. Press Space or click "Resume"…',
    placeholderRunning: 'Focus and type…',
    inputAriaLabel: 'Typing input',
    btnStart: '▶ Start Challenge (Enter)',
    btnPause: '⏸ Pause (Esc)',
    btnAbandon: '↺ Restart',
    btnResume: '▶ Resume (Space)',
    btnRestart: '↺ Play Again',

    // Live Stats
    liveTag: 'LIVE PERFORMANCE',
    livePerformance: 'Live Stats',
    statSpeed: 'Speed',
    statAccuracy: 'Accuracy',
    statWords: 'Completed Words',
    statStreak: 'Current Streak',
    statBest: 'Best Score',

    // Result Modal
    resultTag: 'CHALLENGE COMPLETE',
    resultTitle: 'Challenge Complete!',
    scoreFinal: 'Final Score',
    scoreSpeed: 'Speed',
    scoreAccuracy: 'Accuracy',
    scoreWords: 'Words',
    scoreStreak: 'Max Streak',
    wordsUnit: 'words',
    typoReview: 'Mistakes & Weak Keys',
    typoReviewCount: 'key errors',
    typoZero: '🎉 Perfect! Zero errors on this round!',
    typoMistypedAs: 'typed as',
    typoMistyped: 'mistyped',
    typoTimes: 'times',
    btnPlayAgain: '↺ Play Again (Enter)',

    // Daqian Keyboard
    keyboardAriaLabel: 'Zhuyin Daqian Keyboard Reference',
    keyboardBadge: 'Quick Reference',
    keyboardTitle: 'Standard Daqian Keyboard · Physical Key Map',
    keyboardSubtitle: '1st tone: Space; 2nd: 6, 3rd: 3, 4th: 4, Neutral: 7',
    keyboardGridAria: 'Daqian keyboard layout',
    keyboardKeyTitle: 'Key',
    keyboardNote: '💡 Note: This mode builds physical keyboard muscle memory for Zhuyin symbols independently of OS IME candidate selection.',
    zhuyinSpaceHint: 'Press Space for the 1st tone',
    firstToneSpaceLabel: '1st Tone',
    firstToneSpaceTooltip: '1st Tone (Space)',

    // Footer
    footerText: 'TriType Arena © 2026 · Code: MIT · Vocabulary: see notices',
    footerNotices: 'Third-party data and license notices',
  },
} as const;

export type UIKey = keyof typeof messages['zh-TW'];

export function parseLocale(input: string | null | undefined): Locale {
  const lang = (input || '').toLowerCase().replace('_', '-');
  if (lang === 'zh-cn' || lang === 'zh-sg' || lang.startsWith('zh-hans')) return 'zh-CN';
  if (lang.startsWith('zh')) return 'zh-TW';
  return 'en';
}

export function readLocale(storage?: Pick<Storage, 'getItem'> | null, navigatorLanguage = 'en'): Locale {
  try {
    const saved = storage?.getItem('tritype.ui.locale');
    if (saved && (locales as readonly string[]).includes(saved)) return saved as Locale;
  } catch { /* disabled storage: fall back to navigator */ }
  return parseLocale(navigatorLanguage);
}

export function translate(locale: Locale, key: UIKey): string {
  return messages[locale]?.[key] ?? messages['zh-TW'][key];
}
