// =============================================================
// ==      وحدة محرك التقدم (Progression) - نسخة نهائية ومنقحة   ==
// =============================================================

// ▼▼▼ التعديل هنا: تم حذف fetchGameRules من الاستيراد ▼▼▼
import { fetchProgressionConfig } from './api.js';
// ▲▲▲ نهاية التعديل ▲▲▲

// هذا الكائن سيحتفظ بكل الإعدادات التي تم جلبها
let config = {
    levels: [],
    questionRewards: [],
    // ▼▼▼ التعديل هنا: تم حذف rules ▼▼▼
    xp_per_correct_answer: 10, // قيمة افتراضية
    xp_bonus_all_correct: 50,  // قيمة افتراضية
    // ▲▲▲ نهاية التعديل ▲▲▲
};

let isInitialized = false;

/**
 * دالة التهيئة، تقوم بجلب كل إعدادات التقدم.
 * @returns {Promise<boolean>} - true عند النجاح, false عند الفشل.
 */
export async function initializeProgression() {
    if (isInitialized) return true;

    console.log("جاري جلب إعدادات التقدم...");

    // ▼▼▼ التعديل هنا: تم تبسيط الكود ليعتمد على دالة واحدة فقط ▼▼▼
    const progData = await fetchProgressionConfig();

    if (!progData) {
        console.error("فشل جلب إعدادات التقدم. سيتم استخدام القيم الافتراضية.");
        // في حالة الفشل، يمكننا الاعتماد على القيم الافتراضية أعلاه
        isInitialized = true;
        return true;
    }

    config.levels = progData.levels || [];
    config.questionRewards = progData.question_rewards || [];
    config.xp_per_correct_answer = progData.xp_per_correct_answer || 10;
    config.xp_bonus_all_correct = progData.xp_bonus_all_correct || 50;
    config.levels.sort((a, b) => a.level - b.level);
    
    console.log("تم جلب إعدادات التقدم بنجاح.");
    isInitialized = true;
    return true;
    // ▲▲▲ نهاية التعديل ▲▲▲
}

/**
 * دالة للحصول على قواعد اللعبة (الآن من الكائن المحلي).
 * @returns {object}
 */
export function getGameRules() {
    // ▼▼▼ التعديل هنا: إرجاع القيم من الكائن المحلي بدلاً من متغير منفصل ▼▼▼
    return {
        xp_per_correct_answer: config.xp_per_correct_answer,
        xp_bonus_all_correct: config.xp_bonus_all_correct,
    };
    // ▲▲▲ نهاية التعديل ▲▲▲
}

/**
 * دالة للحصول على معلومات المستوى الحالي للاعب.
 * @param {number} currentXp - نقاط الخبرة الحالية للاعب.
 * @returns {object}
 */
export function getLevelInfo(currentXp) {
    if (!isInitialized || !config.levels || config.levels.length === 0) {
        return { level: 1, title: 'مبتدئ', progress: 0, nextLevelXp: 100, currentLevelXp: 0 };
    }

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

/**
 * يتحقق مما إذا كان اللاعب قد ارتقى في المستوى.
 * @param {number} oldXp - نقاط الخبرة القديمة.
 * @param {number} newXp - نقاط الخبرة الجديدة.
 * @returns {object|null}
 */
export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        const newLevelData = config.levels.find(l => l.level === newLevelInfo.level);
        return { ...newLevelInfo, reward: newLevelData ? newLevelData.diamonds_reward : 0 };
    }
    return null;
}

/**
 * يحدد الحد الأقصى لعدد الأسئلة المتاحة للاعب.
 * @param {number} playerLevel - مستوى اللاعب الحالي.
 * @returns {number}
 */
export function getMaxQuestionsForLevel(playerLevel) {
    const baseQuestions = 5;
    if (!isInitialized || !config.questionRewards || config.questionRewards.length === 0) {
        return baseQuestions;
    }

    const sortedRewards = [...config.questionRewards].sort((a, b) => a.level - b.level);
    let questionsToAdd = 0;
    for (const reward of sortedRewards) {
        if (playerLevel >= reward.level) {
            questionsToAdd = reward.is_cumulative ? (questionsToAdd + reward.questions_to_add) : reward.questions_to_add;
        }
    }
    return baseQuestions + questionsToAdd;
}
