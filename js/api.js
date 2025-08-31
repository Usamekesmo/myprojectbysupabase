// =============================================================
// ==   وحدة الاتصالات الخارجية (API) - النسخة الكاملة والشاملة   ==
// ==   (تجمع بين منطق المستخدمين ومنطق المشرف)                ==
// =============================================================

// ▼▼▼ هذا هو السطر الذي تم التأكد من صحته ▼▼▼
// المسار './config.js' يعني: "ابحث عن config.js في نفس المجلد الحالي (js)"
import { supabase, QURAN_API_BASE_URL } from './config.js';


// --- 1. دوال المصادقة (Authentication) ---
export async function signUpUser(email, password, username) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined }
    });

    if (authError) {
        if (authError.message.includes("User already registered")) {
            return signInUser(email, password);
        }
        return { data: null, error: authError };
    }

    const { error: updateError } = await supabase
        .from('players')
        .update({ username: username })
        .eq('id', authData.user.id);

    if (updateError) {
        console.error("نجح إنشاء الحساب ولكن فشل تحديث اسم المستخدم:", updateError);
    }

    return { data: authData, error: null };
}

export async function signInUser(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

// --- 2. دوال جلب البيانات (Read Operations) ---
export async function fetchPlayer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const tryFetch = async () => supabase.from('players').select('*').eq('id', user.id).single();
    let { data, error } = await tryFetch();

    if (error && error.code === 'PGRST116') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: retryData, error: retryError } = await tryFetch();
        data = retryData;
        error = retryError;
    }

    if (error) {
        console.error("خطأ في جلب بيانات اللاعب:", error);
        return null;
    }
    return data;
}

async function fetchConfigTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`خطأ في جلب جدول ${tableName}:`, error);
        return null;
    }
    return data || [];
}

export async function fetchQuestionsConfig() {
    return fetchConfigTable('questions_config');
}

export async function fetchProgressionConfig() {
    const { data, error } = await supabase.rpc('get_progression_config');
    if (error) {
        console.error("خطأ في جلب إعدادات التقدم:", error);
        return null;
    }
    return data ? data[0] : null;
}

export async function fetchGameRules() {
    const { data, error } = await supabase.from('game_rules').select('*').single();
    if (error) {
        console.error("خطأ في جلب قواعد اللعبة:", error);
        return null;
    }
    return data;
}

export async function fetchAchievementsConfig() {
    return fetchConfigTable('achievements_config');
}

export async function fetchLeaderboard() {
    const { data, error } = await supabase.from('players').select('username, xp').order('xp', { ascending: false }).limit(10);
    if (error) {
        console.error("خطأ في جلب لوحة الصدارة:", error);
        return null;
    }
    return data || [];
}

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
export async function savePlayer(playerData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { id, created_at, email, isNew, dailyQuizzes, ...updatableData } = playerData;
    const { error } = await supabase.from('players').update(updatableData).eq('id', user.id);
    if (error) console.error("خطأ في حفظ بيانات اللاعب:", error);
}

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


// =============================================================
// ==      دوال المشرف (Admin Operations)                     ==
// =============================================================

export async function fetchAllPlayers() {
    const { data, error } = await supabase.rpc('get_all_players');
    if (error) {
        console.error("خطأ في جلب كل اللاعبين:", error);
        return null;
    }
    return data;
}

export async function fetchAllStoreItems() {
    return fetchConfigTable('store_config');
}

export async function addStoreItem(item) {
    const { error } = await supabase.from('store_config').insert([item]);
    if (error) console.error("خطأ في إضافة عنصر للمتجر:", error);
}

export async function deleteStoreItem(itemId) {
    const { error } = await supabase.from('store_config').delete().eq('id', itemId);
    if (error) console.error("خطأ في حذف عنصر من المتجر:", error);
}

export async function getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
        console.error("خطأ في جلب إحصائيات لوحة التحكم:", error);
        return null;
    }
    return data ? data[0] : null;
}

export async function updatePlayerByAdmin(playerId, updates) {
    const { error } = await supabase.rpc('update_player_by_admin', {
        player_id: playerId,
        new_username: updates.username,
        new_xp: updates.xp,
        new_diamonds: updates.diamonds
    });
    if (error) {
        console.error("خطأ في تحديث اللاعب بواسطة المشرف:", error);
    }
    return { error };
}
