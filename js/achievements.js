// =============================================================
// ==      وحدة نظام الإنجازات (مع Supabase) (النسخة النهائية)  ==
// =============================================================

import { fetchAchievementsConfig } from './api.js';
import * as player from './player.js';
import * as ui from './ui.js';
import * as progression from './progression.js';

let achievementsConfig = [];

/**
 * يقوم بتهيئة الوحدة عن طريق جلب إعدادات الإنجازات من قاعدة البيانات.
 */
export async function initializeAchievements() {
    achievementsConfig = await fetchAchievementsConfig();
    if (achievementsConfig && achievementsConfig.length > 0) {
        console.log(`تم تحميل ${achievementsConfig.length} إنجاز من قاعدة البيانات.`);
    } else {
        console.warn("لم يتم العثور على إعدادات للإنجازات أو فشل في جلبها.");
    }
}

/**
 * الدالة الرئيسية التي يتم استدعاؤها من أجزاء مختلفة من التطبيق للتحقق من الإنجازات.
 * @param {string} eventName - اسم الحدث الذي وقع (مثل 'login', 'quiz_completed').
 * @param {object} eventData - بيانات إضافية متعلقة بالحدث (مثل نتيجة الاختبار).
 */
export function checkAchievements(eventName, eventData = {}) {
    if (!achievementsConfig || achievementsConfig.length === 0) {
        return;
    }

    // فلترة الإنجازات التي تستجيب لهذا الحدث المحدد
    const relevantAchievements = achievementsConfig.filter(ach => ach.trigger_event === eventName);

    for (const achievement of relevantAchievements) {
        // التأكد من أن اللاعب لم يحصل على هذا الإنجاز من قبل
        if (player.playerData.achievements.includes(achievement.id)) {
            continue;
        }

        // التحقق من شرط الإنجاز
        if (isConditionMet(achievement, eventData)) {
            grantAchievement(achievement);
        }
    }
}

/**
 * يتحقق مما إذا كان شرط إنجاز معين قد تحقق.
 * @param {object} achievement - كائن إعدادات الإنجاز.
 * @param {object} eventData - بيانات الحدث.
 * @returns {boolean} - `true` إذا تحقق الشرط.
 */
function isConditionMet(achievement, eventData) {
    // بناء كائن بيانات شامل للتحقق منه
    const dataContext = {
        ...eventData, // بيانات الحدث المباشرة (score, errors, etc.)
        xp: player.playerData.xp,
        diamonds: player.playerData.diamonds,
        level: progression.getLevelInfo(player.playerData.xp).level,
        inventorySize: player.playerData.inventory.length,
        totalQuizzes: player.playerData.total_quizzes_completed
    };

    const propertyValue = dataContext[achievement.target_property];
    const targetValue = achievement.target_value;

    // إذا كانت الخاصية المستهدفة غير موجودة، فالشرط لم يتحقق
    if (propertyValue === undefined) {
        return false;
    }

    // تحويل القيمة المستهدفة إلى رقم إذا كانت الخاصية رقمية
    const numericTargetValue = !isNaN(Number(targetValue)) ? Number(targetValue) : targetValue;

    switch (achievement.comparison) {
        case '===':
            return propertyValue === numericTargetValue;
        case '>=':
            return propertyValue >= numericTargetValue;
        case '<=':
            return propertyValue <= numericTargetValue;
        case 'includes':
            return Array.isArray(propertyValue) && propertyValue.includes(numericTargetValue);
        case '!==':
            return propertyValue !== numericTargetValue;
        default:
            return false;
    }
}

/**
 * يمنح اللاعب إنجازًا ومكافآته.
 * @param {object} achievement - كائن الإنجاز الذي تم تحقيقه.
 */
function grantAchievement(achievement) {
    console.log(`تهانينا! تم تحقيق الإنجاز: ${achievement.name}`);

    // 1. إضافة الإنجاز إلى بيانات اللاعب
    player.playerData.achievements.push(achievement.id);

    // 2. إضافة المكافآت
    player.playerData.xp += achievement.xp_reward;
    player.playerData.diamonds += achievement.diamonds_reward;

    // 3. إظهار إشعار مرئي للمستخدم
    ui.showAchievementToast(achievement);

    // ملاحظة: لا يتم استدعاء savePlayer() هنا.
    // يجب أن يتم الحفظ في نهاية العملية الرئيسية (مثل نهاية الاختبار)
    // لضمان حفظ كل التغييرات مرة واحدة.
}
