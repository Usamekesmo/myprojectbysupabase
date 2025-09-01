// =============================================================
// ==      الملف الرئيسي (main.js) - نسخة نهائية كاملة         ==
// =============================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';

// تعريف الصفحات المجانية التي يحصل عليها كل مستخدم جديد
const FREE_PAGES = [1, 2, 602, 603, 604];

/**
 * دالة التهيئة الرئيسية للتطبيق.
 */
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    setupEventListeners();
    await quiz.initializeQuiz(); 
    await achievements.initializeAchievements();
    ui.showScreen(ui.startScreen);
    console.log("التطبيق جاهز.");
}

/**
 * ربط جميع مستمعي الأحداث لعناصر الواجهة.
 */
function setupEventListeners() {
    ui.startButton.addEventListener('click', handleAuthentication);
    ui.startTestButton.addEventListener('click', onStartPageTestClick);
    ui.reloadButton.addEventListener('click', () => location.reload());
    ui.showFinalResultButton.addEventListener('click', () => {
        const quizState = quiz.getCurrentState();
        const oldXp = player.playerData.xp - quizState.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        ui.displayFinalResult(quizState, levelUpInfo);
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            ui.showTab(tabId);
            if (tabId === 'leaderboard-tab' && !button.dataset.loaded) {
                onLeaderboardTabClick();
                button.dataset.loaded = 'true';
            }
        });
    });
}

/**
 * معالجة عملية المصادقة (تسجيل الدخول أو إنشاء حساب).
 */
async function handleAuthentication() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return;
    }
    ui.toggleLoader(true);
    const encodedUsername = btoa(unescape(encodeURIComponent(userName)));
    const safeEncodedUsername = encodedUsername.replace(/=/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const email = `${safeEncodedUsername}@quran-quiz.app`;
    const password = `default_password_for_${safeEncodedUsername}`;

    const { error } = await api.signUpUser(email, password, userName);
    if (error) {
        ui.toggleLoader(false);
        alert(`حدث خطأ: ${error.message}`);
        return;
    }
    
    await postLoginSetup();
    ui.toggleLoader(false);
    ui.showScreen(ui.mainInterface);
}

/**
 * إعداد كل شيء بعد تسجيل دخول المستخدم بنجاح.
 */
async function postLoginSetup() {
    const playerLoaded = await player.loadPlayer();
    if (!playerLoaded) {
        alert("فشل تحميل بيانات اللاعب.");
        return;
    }

    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);

    // تحديث قائمة الصفحات المتاحة للاختبار
    updateAvailablePages();

    ui.populateQariSelect(ui.qariSelect, player.playerData.inventory);
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);

    const storeItems = await api.fetchStoreConfig();
    if (storeItems) {
        store.renderStoreItems(storeItems, player.playerData);
    }
}

/**
 * تحديث قائمة الصفحات المتاحة للاختبار بناءً على المشتريات.
 */
export function updateAvailablePages() {
    const purchasedPages = player.playerData.inventory
        .filter(id => id.startsWith('page_'))
        .map(id => parseInt(id.replace('page_', ''), 10));
    
    const availablePages = [...new Set([...FREE_PAGES, ...purchasedPages])].sort((a, b) => a - b);
    ui.populateSelect(ui.pageSelect, availablePages, 'الصفحة');
}

/**
 * بدء اختبار لصفحة محددة.
 */
function onStartPageTestClick() {
    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) {
        alert("يرجى اختيار صفحة من الصفحات المتاحة لك.");
        return;
    }
    startTestWithSettings({
        pageNumbers: [parseInt(selectedPage, 10)],
        qari: ui.qariSelect.value,
        questionsCount: parseInt(ui.questionsCountSelect.value, 10),
        testName: `الصفحة ${selectedPage}`
    });
}

/**
 * جلب وعرض بيانات لوحة الصدارة.
 */
async function onLeaderboardTabClick() {
    ui.leaderboardList.innerHTML = '<p>جاري تحميل البيانات...</p>';
    const leaderboardData = await api.fetchLeaderboard();
    if (leaderboardData) {
        ui.displayLeaderboard(leaderboardData);
    } else {
        ui.leaderboardList.innerHTML = '<p>تعذر تحميل لوحة الصدارة.</p>';
    }
}

/**
 * دالة مركزية لبدء أي اختبار.
 */
async function startTestWithSettings(settings) {
    ui.toggleLoader(true);
    let allAyahs = [];
    for (const pageNum of settings.pageNumbers) {
        const pageAyahs = await api.fetchPageData(pageNum);
        if (pageAyahs) {
            allAyahs.push(...pageAyahs);
        }
    }
    ui.toggleLoader(false);

    if (allAyahs.length > 0) {
        quiz.start({
            pageAyahs: allAyahs,
            selectedQari: settings.qari,
            totalQuestions: settings.questionsCount,
            userName: player.playerData.username,
            pageNumber: settings.pageNumbers[0]
        });
    } else {
        alert(`تعذر تحميل بيانات الاختبار لـ ${settings.testName}.`);
    }
}

// تشغيل التطبيق
initialize();
