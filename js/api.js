// =============================================================
// ==      وحدة الاتصالات (API) - نسخة نهائية ومُصححة        ==
// =============================================================

import { supabase } from './config.js';

const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

// --- 1. دوال المصادقة (Authentication ) ---

/**
 * يقوم بإنشاء حساب جديد للمستخدم، أو تسجيل دخوله إذا كان موجودًا بالفعل.
 * هذا هو المنطق الأكثر استقرارًا.
 * @param {string} email - البريد الإلكتروني للمستخدم.
 * @param {string} password - كلمة المرور.
 * @param {string} username - اسم المستخدم.
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signUpUser(email, password, username) {
    // الخطوة 1: محاولة إنشاء حساب جديد مباشرة
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username // إضافة اسم المستخدم مباشرة عند إنشاء الحساب
            }
        }
    });

    // الخطوة 2: التحقق من نوع الخطأ
    if (signUpError) {
        // إذا كان الخطأ هو أن المستخدم مسجل بالفعل
        if (signUpError.message.includes("User already registered")) {
            console.log("المستخدم موجود بالفعل، جاري محاولة تسجيل الدخول...");
            // قم بتسجيل دخوله بدلاً من ذلك
            return await supabase.auth.signInWithPassword({ email, password });
        }
        // إذا كان هناك أي خطأ آخر، قم بإرجاعه
        return { data: null, error: signUpError };
    }

    // إذا نجحت عملية إنشاء الحساب بدون أخطاء، قم بإرجاع البيانات
    return { data: signUpData, error: null };
}


// --- 2. دوال جلب البيانات (Read Operations) ---

/**
 * جلب بيانات اللاعب الحالي المسجل دخوله.
 * @returns {Promise<object|null>}
 */
export async function fetchPlayer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('players').select('*').eq('id', user.id).single();

    if (error) {
        console.error("خطأ في جلب بيانات اللاعب:", error);
        return null;
    }
    return data;
}

/**
 * جلب جميع عناصر المتجر من قاعدة البيانات.
 * @returns {Promise<Array|null>}
 */
export async function fetchStoreConfig() {
    const { data, error } = await supabase.from('store_config').select('*').order('sort_order', { ascending: true });
    if (error) {
        console.error(`خطأ في جلب جدول store_config:`, error);
        return null;
    }
    return data || [];
}

/**
 * جلب إعدادات الأسئلة النشطة.
 * @returns {Promise<Array|null>}
 */
export async function fetchQuestionsConfig() {
    // هذا الجدول يجب إنشاؤه في Supabase إذا كنت تريد التحكم في الأسئلة من هناك
    // حاليًا، سنرجع قائمة ثابتة إذا لم يكن الجدول موجودًا
    const { data, error } = await supabase.from('questions_config').select('*');
    if (error || !data || data.length === 0) {
        console.warn("لم يتم العثور على جدول 'questions_config'. سيتم استخدام الأسئلة الافتراضية.");
        return [
            { id: 'generateChooseNextQuestion', level_required: 1 },
            { id: 'generateLocateAyahQuestion', level_required: 1 },
            { id: 'generateCompleteLastWordQuestion', level_required: 2 },
            { id: 'generateIdentifyAyahNumberQuestion', level_required: 3 },
            { id: 'generateCompleteAyahQuestion', level_required: 4 },
            { id: 'generateIdentifyAyahEndQuestion', level_required: 5 },
            { id: 'generateFindUniqueWordQuestion', level_required: 6 },
            { id: 'generateCountWordQuestion', level_required: 7 },
            { id: 'generateChoosePreviousQuestion', level_required: 8 },
            { id: 'generateVisualMapQuestion', level_required: 10 }
        ];
    }
    return data;
}

/**
 * جلب أفضل 10 لاعبين في لوحة الصدارة.
 * @returns {Promise<Array|null>}
 */
export async function fetchLeaderboard() {
    const { data, error } = await supabase.from('players').select('username, xp').order('xp', { ascending: false }).limit(10);
    if (error) {
        console.error("خطأ في جلب لوحة الصدارة:", error);
        return null;
    }
    return data || [];
}

/**
 * جلب بيانات صفحة معينة من القرآن من واجهة برمجة تطبيقات خارجية.
 * @param {number} pageNumber - رقم الصفحة.
 * @returns {Promise<Array|null>}
 */
export async function fetchPageData(pageNumber) {
    try {
        const response = await fetch(`${QURAN_API_BASE_URL}/page/${pageNumber}/quran-uthmani`);
        if (!response.ok) throw new Error('فشل استجابة الشبكة.');
        const data = await response.json();
        return data.data.ayahs;
    } catch (error) {
        console.error("Error fetching page data:", error);
        alert('لا يمكن الوصول إلى خادم القرآن. تحقق من اتصالك بالإنترنت.');
        return null;
    }
}


// --- 3. دوال حفظ البيانات (Write Operations) ---

/**
 * حفظ بيانات اللاعب المحدثة في قاعدة البيانات.
 * @param {object} playerData - بيانات اللاعب.
 */
export async function savePlayer(playerData) {
    const { id, ...updatableData } = playerData;
    const { error } = await supabase.from('players').update(updatableData).eq('id', id);
    if (error) {
        console.error("خطأ في حفظ بيانات اللاعب:", error);
    } else {
        console.log("تم حفظ بيانات اللاعب بنجاح.");
    }
}

/**
 * حفظ نتيجة الاختبار في قاعدة البيانات.
 * @param {object} resultData - بيانات نتيجة الاختبار.
 */
export async function saveResult(resultData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSave = {
        user_id: user.id,
        page_number: resultData.pageNumber,
        score: resultData.score,
        total_questions: resultData.totalQuestions,
        xp_earned: resultData.xpEarned,
        errors: resultData.errorLog
    };
    const { error } = await supabase.from('quiz_results').insert([dataToSave]);
    if (error) {
        console.error("خطأ في حفظ نتيجة الاختبار:", error);
    }
}
