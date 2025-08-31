// =============================================================
// ==      وحدة إدارة بيانات اللاعب (مع Supabase) (النسخة النهائية) ==
// =============================================================

import { fetchPlayer as fetchPlayerFromApi, savePlayer as savePlayerToApi } from './api.js';
import * as achievements from './achievements.js';

// هذا هو "مصدر الحقيقة" لبيانات اللاعب داخل التطبيق.
// يتم ملؤه عند استدعاء loadPlayer().
export let playerData = {};

/**
 * دالة مساعدة للحصول على تاريخ اليوم بصيغة موحدة (YYYY-MM-DD).
 * @returns {string}
 */
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * يقوم بتحميل بيانات اللاعب الحالي من قاعدة البيانات ويجهزها للاستخدام.
 * @returns {Promise<boolean>} - `true` عند النجاح، `false` عند الفشل.
 */
export async function loadPlayer() {
    const fetchedData = await fetchPlayerFromApi();

    if (!fetchedData) {
        console.error("فشل جلب بيانات اللاعب من الواجهة الخلفية.");
        return false;
    }

    // دمج البيانات التي تم جلبها مع الحالة الافتراضية
    // هذا يضمن وجود الحقول التي تدار محليًا مثل dailyQuizzes
    playerData = {
        ...fetchedData, // بيانات اللاعب من قاعدة البيانات (id, username, xp, etc.)
        isNew: false, // بما أننا جلبنا البيانات، فاللاعب ليس جديدًا
        dailyQuizzes: { // تتم إدارة هذا الكائن محليًا
            count: 0,
            lastPlayedDate: ''
        }
    };

    console.log(`تم تحميل بيانات اللاعب: ${playerData.username}`);
    
    // التحقق من الإنجازات التي قد تتحقق عند تسجيل الدخول (مثل إنجازات المستويات)
    achievements.checkAchievements('login');

    // التحقق من عداد الاختبارات اليومية
    const today = getTodayDateString();
    // ملاحظة: في المستقبل، يمكن تخزين lastPlayedDate في قاعدة البيانات لتكون متزامنة عبر الأجهزة.
    // حاليًا، سيعاد تعيينه في كل مرة يتم فيها تحميل التطبيق على جهاز جديد.
    if (playerData.dailyQuizzes.lastPlayedDate !== today) {
        playerData.dailyQuizzes = { count: 0, lastPlayedDate: today };
        console.log("يوم جديد! تم إعادة تعيين عداد الاختبارات اليومية.");
    }
    
    return true;
}

/**
 * يحفظ بيانات اللاعب الحالية في قاعدة البيانات.
 * هذه الدالة تقوم باستدعاء دالة الحفظ في api.js.
 */
export async function savePlayer() {
    // لا نرسل كل بيانات اللاعب، فقط ما هو موجود في قاعدة البيانات
    // `isNew` و `dailyQuizzes` تتم إدارتهما محليًا فقط
    // `id`, `created_at`, `email` لا يجب تحديثها
    const { id, created_at, email, isNew, dailyQuizzes, ...updatableData } = playerData;

    await savePlayerToApi(updatableData);
    console.log("تم إرسال طلب حفظ بيانات اللاعب إلى الواجهة الخلفية.");
}
