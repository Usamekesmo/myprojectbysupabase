// =============================================================
// ==      وحدة نظام الإنجازات (Achievements) - نسخة نهائية ومبسطة  ==
// =============================================================

import * as player from './player.js';
import * as ui from './ui.js';
import * as progression from './progression.js';

// ▼▼▼ التعديل هنا: تم تعريف الإنجازات بشكل ثابت داخل الكود ▼▼▼
const achievementsConfig = [
    // إنجازات المستويات
    { id: 1, name: "الوصول للمستوى 5",    trigger_event: "login", target_property: "level", comparison: ">=", target_value: 5,  xp_reward: 50,  diamonds_reward: 25 },
    { id: 2, name: "الوصول للمستوى 10",   trigger_event: "login", target_property: "level", comparison: ">=", target_value: 10, xp_reward: 100, diamonds_reward: 50 },

    // إنجازات الاختبارات
    { id: 3, name: "أول اختبار ناجح",     trigger_event: "quiz_completed", target_property: "totalQuizzes", comparison: "===", target_value: 1, xp_reward: 20, diamonds_reward: 10 },
    { id: 4, name: "أداء مثالي!",         trigger_event: "quiz_completed", target_property: "isPerfect",    comparison: "===", target_value: true, xp_reward: 30, diamonds_reward: 15 },

    // إنجازات المتجر
    { id: 5, name: "المشتري الأول",       trigger_event: "item_purchased", target_property: "inventorySize", comparison: "===", target_value: 1, xp_reward: 10, diamonds_reward: 5 }
];
// ▲▲▲ نهاية التعديل ▲▲▲


/**
 * دالة وهمية للتهيئة (لم نعد بحاجة لجلب شيء من الشبكة).
 */
export async function initializeAchievements() {
    // ▼▼▼ التعديل هنا: تم حذف استدعاء fetchAchievementsConfig ▼▼▼
    console.log(`تم تحميل ${achievementsConfig.length} إنجاز من الإعدادات المحلية.`);
    // ▲▲▲ نهاية التعديل ▲▲▲
}

/**
 * الدالة الرئيسية التي يتم استدعاؤها للتحقق من الإنجازات.
 * @param {string} eventName - اسم الحدث الذي وقع (مثل 'login', 'quiz_completed').
 * @param {object} eventData - بيانات إضافية متعلقة بالحدث.
 */
export function checkAchievements(eventName, eventData = {}) {
    if (!achievementsConfig || achievementsConfig.length === 0) {
        return;
    }

    const relevantAchievements = achievementsConfig.filter(ach => ach.trigger_event === eventName);

    for (const achievement of relevantAchievements) {
        if (player.playerData.achievements.includes(achievement.id)) {
            continue;
        }

        if (isConditionMet(achievement, eventData)) {
            grantAchievement(achievement);
        }
    }
}

/**
 * يتحقق مما إذا كان شرط إنجاز معين قد تحقق.
 */
function isConditionMet(achievement, eventData) {
    const dataContext = {
        ...eventData,
        xp: player.playerData.xp,
        diamonds: player.playerData.diamonds,
        level: progression.getLevelInfo(player.playerData.xp).level,
        inventorySize: player.playerData.inventory.length,
        totalQuizzes: player.playerData.total_quizzes_completed
    };

    const propertyValue = dataContext[achievement.target_property];
    const targetValue = achievement.target_value;

    if (propertyValue === undefined) {
        return false;
    }

    switch (achievement.comparison) {
        case '===': return propertyValue === targetValue;
        case '>=':  return propertyValue >= targetValue;
        case '<=':  return propertyValue <= targetValue;
        default:    return false;
    }
}

/**
 * يمنح اللاعب إنجازًا ومكافآته.
 */
function grantAchievement(achievement) {
    console.log(`تهانينا! تم تحقيق الإنجاز: ${achievement.name}`);

    player.playerData.achievements.push(achievement.id);
    player.playerData.xp += achievement.xp_reward;
    player.playerData.diamonds += achievement.diamonds_reward;

    ui.showAchievementToast(achievement);
}
