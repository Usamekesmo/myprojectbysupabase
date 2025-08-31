// =============================================================
// ==      الملف الرئيسي (النسخة المستقرة بعد حل مشاكل المصادقة)      ==
// =============================================================

import * as ui from './ui.js';
import { fetchPageData, fetchLeaderboard, signUpUser, signInUser } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل (وضع Supabase)...");
    setupEventListeners();
    ui.initializeLockedOptions();
    await achievements.initializeAchievements();
    await quiz.initializeQuiz();
    ui.showScreen(ui.startScreen);
    console.log("التطبيق جاهز لتسجيل دخول المستخدم.");
}

// --- 2. ربط الأحداث (Event Listeners) ---
function setupEventListeners() {
    console.log("جاري ربط مستمعي الأحداث...");
    if (ui.startButton) {
        ui.startButton.addEventListener('click', handleAuthentication);
        console.log("تم ربط زر 'startButton' بنجاح.");
    } else {
        console.error("خطأ فادح: زر 'startButton' غير موجود في واجهة المستخدم (ui.js).");
    }
    ui.startTestButton.addEventListener('click', onStartTestButtonClick);
    ui.reloadButton.addEventListener('click', () => location.reload());
    ui.storeButton.addEventListener('click', onStoreButtonClick);
    ui.closeStoreButton.addEventListener('click', () => ui.showScreen(ui.startScreen));
    ui.leaderboardButton.addEventListener('click', onLeaderboardButtonClick);
    ui.closeLeaderboardButton.addEventListener('click', () => ui.showScreen(ui.startScreen));
    ui.showFinalResultButton.addEventListener('click', () => {
        const quizState = quiz.getCurrentState();
        const oldXp = player.playerData.xp - quizState.xpEarned;
        const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
        ui.displayFinalResult(quizState, levelUpInfo);
    });
}

// --- 3. دوال التحكم الرئيسية ---
async function handleAuthentication(event) {
    if (event) event.preventDefault();
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert("يرجى إدخال اسمك للمتابعة.");
        return;
    }
    console.log("بدء عملية المصادقة لـ:", userName);
    const encodedUsername = btoa(unescape(encodeURIComponent(userName)));
    const safeEncodedUsername = encodedUsername.replace(/=/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const email = `${safeEncodedUsername}@quran-quiz.app`;
    const password = `default_password`;
    ui.toggleLoader(true);
    const { error: signInError } = await signInUser(email, password);
    if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
            console.log("المستخدم غير موجود، جاري إنشاء حساب جديد...");
            const { error: signUpError } = await signUpUser(email, password, userName);
            if (signUpError) {
                ui.toggleLoader(false);
                alert(`حدث خطأ أثناء إنشاء الحساب: ${signUpError.message}`);
                return;
            }
            console.log("تم إنشاء الحساب بنجاح.");
        } else {
            ui.toggleLoader(false);
            alert(`حدث خطأ أثناء تسجيل الدخول: ${signInError.message}`);
            return;
        }
    } else {
        console.log("تم تسجيل الدخول بنجاح.");
    }
    console.log("جاري جلب إعدادات اللعبة...");
    const progressionInitialized = await progression.initializeProgression();
    if (!progressionInitialized) {
        ui.toggleLoader(false);
        alert("فشل تحميل إعدادات اللعبة. يرجى المحاولة مرة أخرى.");
        return;
    }
    console.log("جاري إعداد واجهة ما بعد تسجيل الدخول...");
    await postLoginSetup();
    ui.toggleLoader(false);
    console.log("اكتمل الإعداد.");
}

async function postLoginSetup() {
    const playerLoaded = await player.loadPlayer();
    if (!playerLoaded) {
        alert("فشل تحميل بيانات اللاعب. يرجى المحاولة مرة أخرى.");
        return;
    }
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);
    const rules = progression.getGameRules();
    const allowedPages = rules.allowedPages || [];
    const purchasedPages = player.playerData.inventory
        .map(id => progression.getStoreItems().find(item => item.id === id))
        .filter(item => item && item.type === 'page')
        .map(item => parseInt(item.value, 10));
    ui.populatePageSelect(allowedPages, purchasedPages);
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);
    ui.postLoginControls.classList.remove('hidden');
    ui.startButton.textContent = "تغيير المستخدم";
    ui.userNameInput.disabled = true;
}

function onStartTestButtonClick() {
    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) {
        alert("يرجى اختيار صفحة لبدء الاختبار.");
        return;
    }
    startTestWithSettings({
        pageNumber: parseInt(selectedPage, 10),
        qari: ui.qariSelect.value,
        questionsCount: parseInt(ui.questionsCountSelect.value, 10),
        userName: player.playerData.username
    });
}

function onStoreButtonClick() {
    if (!player.playerData.username) {
        alert("يرجى تسجيل الدخول أولاً لزيارة المتجر.");
        return;
    }
    store.openStore();
}

async function onLeaderboardButtonClick() {
    if (!player.playerData.username) {
        alert("يرجى تسجيل الدخول أولاً لعرض لوحة الصدارة.");
        return;
    }
    ui.toggleLoader(true);
    const leaderboardData = await fetchLeaderboard();
    ui.toggleLoader(false);
    if (leaderboardData) {
        ui.displayLeaderboard(leaderboardData);
        ui.showScreen(ui.leaderboardScreen);
    } else {
        alert("تعذر تحميل لوحة الصدارة. يرجى المحاولة مرة أخرى.");
    }
}

async function startTestWithSettings(settings) {
    if (!settings.pageNumber || isNaN(settings.pageNumber)) {
        alert("رقم الصفحة غير صالح. يرجى تحديد صفحة من القائمة.");
        return;
    }
    ui.toggleLoader(true);
    const pageAyahs = await fetchPageData(settings.pageNumber);
    ui.toggleLoader(false);
    if (pageAyahs && pageAyahs.length > 0) {
        quiz.start({
            pageAyahs: pageAyahs,
            selectedQari: settings.qari,
            totalQuestions: settings.questionsCount,
            userName: settings.userName,
            pageNumber: settings.pageNumber
        });
    } else {
        alert(`تعذر تحميل بيانات الصفحة ${settings.pageNumber}. قد تكون الصفحة غير موجودة أو هناك مشكلة في الشبكة.`);
    }
}

// --- 4. تشغيل التطبيق ---
initialize();
