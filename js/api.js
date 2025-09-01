// =============================================================
// ==      وحدة الاتصالات (API) - نسخة نهائية ومُصححة        ==
// =============================================================

import { supabase } from './config.js';

const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

// --- 1. دوال المصادقة (Authentication ) ---

// في ملف js/api.js

/**
 * يقوم بإنشاء حساب جديد للمستخدم، أو تسجيل دخوله إذا كان موجودًا بالفعل.
 * هذا هو المنطق الأكثر استقرارًا وموثوقية.
 * @param {string} email - البريد الإلكتروني للمستخدم.
 * @param {string} password - كلمة المرور.
 * @param {string} username - اسم المستخدم.
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signUpUser(email, password, username) {
    // الخطوة 1: محاولة تسجيل الدخول أولاً. هذا هو النهج الأكثر أمانًا.
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // إذا نجح تسجيل الدخول، فهذا يعني أن المستخدم موجود. أرجع البيانات.
    if (!error && data.user) {
        console.log("تم تسجيل دخول المستخدم الموجود بنجاح.");
        return { data, error: null };
    }

    // إذا فشل تسجيل الدخول، تحقق من سبب الفشل.
    if (error && error.message.includes("Invalid login credentials")) {
        // السبب هو أن المستخدم غير موجود. الآن، قم بإنشاء حساب جديد.
        console.log("المستخدم غير موجود، جاري إنشاء حساب جديد...");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username: username } }
        });

        // إذا حدث خطأ أثناء إنشاء الحساب (مثل خطأ 422 بسبب تفعيل تأكيد البريد)
        if (signUpError) {
            console.error("فشل إنشاء الحساب:", signUpError.message);
            // أرجع الخطأ الجديد لكي يراه المستخدم
            return { data: null, error: signUpError };
        }

        // إذا نجح إنشاء الحساب، أرجع البيانات الجديدة
        console.log("تم إنشاء الحساب بنجاح.");
        return { data: signUpData, error: null };
    }

    // إذا كان هناك أي خطأ آخر غير "Invalid login credentials"، أرجعه
    return { data, error };
}



// --- 2. دوال جلب البيانات (Read Operations) ---

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
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

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
export async function fetchStoreConfig() {
    const { data, error } = await supabase.from('store_config').select('*').order('sort_order', { ascending: true });
    if (error) {
        console.error(`خطأ في جلب جدول store_config:`, error);
        return null;
    }
    return data || [];
}

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
export async function fetchQuestionsConfig() {
    const { data, error } = await supabase.from('questions_config').select('*');
    if (error || !data || data.length === 0) {
        console.warn("لم يتم العثور على جدول 'questions_config'. سيتم استخدام الأسئلة الافتراضية.");
        return [
            { id: 'generateChooseNextQuestion', level_required: 1 },
            { id: 'generateLocateAyahQuestion', level_required: 1 },
            { id: 'generateCompleteLastWordQuestion', level_required: 2 },
            { id: 'generateIdentifyAyahNumberQuestion', level_required: 3 }
        ];
    }
    return data;
}

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
export async function fetchProgressionConfig() {
    const { data, error } = await supabase.from('progression_config').select('settings').eq('id', 1).single();
    if (error) {
        console.error("خطأ في جلب إعدادات التقدم:", error);
        return null;
    }
    return data ? data.settings : null;
}

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
export async function fetchLeaderboard() {
    const { data, error } = await supabase.from('players').select('username, xp').order('xp', { ascending: false }).limit(10);
    if (error) {
        console.error("خطأ في جلب لوحة الصدارة:", error);
        return null;
    }
    return data || [];
}

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
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

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
export async function savePlayer(playerData) {
    const { id, ...updatableData } = playerData;
    const { error } = await supabase.from('players').update(updatableData).eq('id', id);
    if (error) console.error("خطأ في حفظ بيانات اللاعب:", error);
    else console.log("تم حفظ بيانات اللاعب بنجاح.");
}

// ▼▼▼ تأكد من وجود كلمة "export" هنا ▼▼▼
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
    if (error) console.error("خطأ في حفظ نتيجة الاختبار:", error);
}
