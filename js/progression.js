// =============================================================
// ==      وحدة محرك التقدم (النسخة النهائية - معدلة للتوقيت)   ==
// =============================================================

import { fetchProgressionConfig, fetchGameRules } from './api.js';

// هذا الكائن سيحتفظ بكل الإعدادات التي تم جلبها
let config = {
    levels: [],
    store: [],
    rules: {},
    questionRewards: []
};

// متغير لتتبع ما إذا تم جلب الإعدادات بنجاح
let isInitialized = false;

/**
 * دالة التهيئة، تقوم بجلب كل الإعدادات. يمكن استدعاؤها بعد تسجيل الدخول.
 * @returns {Promise<boolean>} - true عند النجاح, false عند الفشل.
 */
export async function initializeProgression() {
    // إذا تم جلب الإعدادات من قبل، لا تفعل شيئًا مرة أخرى
    if (isInitialized) return true;

    console.log("جاري جلب إعدادات التقدم (بعد تسجيل الدخول)...");

    const [progData, rulesData] = await Promise.all([
        fetchProgressionConfig(),
        fetchGameRules()
    ]);

    if (!progData || !rulesData) {
        console.error("فشل فادح: لم يتم جلب إعدادات التقدم أو قواعد اللعبة.");
        return false; // فشل التهيئة
    }

    config.levels = progData.levels || [];
    config.store = progData.store || [];
    config.questionRewards = progData.question_rewards || [];
    config.levels.sort((a, b) => a.level - b.level);
    
    config.rules = rulesData;
    
    console.log("تم جلب إعدادات التقدم وقواعد اللعبة بنجاح.");
    isInitialized = true; // وضع علامة بأن التهيئة نجحت
    return true; // نجحت التهيئة
}

// --- بقية الدوال تبقى كما هي بدون أي تغيير ---

export function getGameRules() {
    return config.rules;
}

export function getStoreItems() {
    if (config.store && Array.isArray(config.store)) {
        return [...config.store].sort((a, b) => a.sort_order - b.sort_order);
    }
    return [];
}

export function getLevelInfo(currentXp) {
    if (!isInitialized || config.levels.length === 0) {
        return { level: 1, title: 'لاعب جديد', progress: 0, nextLevelXp: 100, currentLevelXp: 0 };
    }
    // ... (بقية الكود كما هو)
    let currentLevelInfo = config.levels[0];
    for (let i = config.levels.length - 1; i >= 0; i--) {
        if (currentXp >= config.levels[i].xp_required) {
            currentLevelInfo = config.levels[i];
            break;
        }
    }
    const nextLevelIndex = config.levels.findIndex(l => l.level === currentLevelInfo.level + 1);
    const nextLevelInfo = nextLevelIndex !== -1 ? config.levels[nextLevelIndex] : null;
    const xpForCurrentLevel = currentLevelInfo.xp_required;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xp_required : currentXp;
    let progressPercentage = 100;
    if (nextLevelInfo && xpForNextLevel > xpForCurrentLevel) {
        progressPercentage = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    }
    return {
        level: currentLevelInfo.level,
        title: currentLevelInfo.title,
        progress: Math.min(100, progressPercentage),
        nextLevelXp: xpForNextLevel,
        currentLevelXp: xpForCurrentLevel
    };
}

export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);
    if (newLevelInfo.level > oldLevelInfo.level) {
        const newLevelData = config.levels.find(l => l.level === newLevelInfo.level);
        return { ...newLevelInfo, reward: newLevelData ? newLevelData.diamonds_reward : 0 };
    }
    return null;
}

export function getMaxQuestionsForLevel(playerLevel) {
    const baseQuestions = 5;
    if (!isInitialized || !config.questionRewards || config.questionRewards.length === 0) {
        return baseQuestions;
    }
    const sortedRewards = [...config.questionRewards].sort((a, b) => a.level - b.level);
    let questionsToAdd = 0;
    for (const reward of sortedRewards) {
        if (playerLevel >= reward.level) {
            if (reward.is_cumulative) {
                questionsToAdd += reward.questions_to_add;
            } else {
                questionsToAdd = reward.questions_to_add;
            }
        }
    }
    return baseQuestions + questionsToAdd;
}
