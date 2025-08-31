// =============================================================
// ==      وحدة إدارة ومنطق الاختبار (مع Supabase) (النسخة النهائية) ==
// =============================================================

import * as ui from './ui.js';
import { saveResult } from './api.js';
import { fetchQuestionsConfig } from './api.js';
import { allQuestionGenerators } from './questions.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js';

// --- حالة الاختبار (State) ---
let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0,
    xpEarned: 0
};

let allActiveQuestions = [];
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * تهيئة وحدة الاختبار عن طريق جلب إعدادات الأسئلة النشطة.
 */
export async function initializeQuiz() {
    console.log("جاري تهيئة وحدة الاختبار وجلب إعدادات الأسئلة...");
    const config = await fetchQuestionsConfig();
    
    if (config && config.length > 0) {
        allActiveQuestions = config.map(q => ({
            ...q,
            generator: allQuestionGenerators[q.id] // q.id هو اسم الدالة المولدة
        })).filter(q => typeof q.generator === 'function');

        console.log(`تم تحميل ${allActiveQuestions.length} نوع من الأسئلة النشطة.`);
    } else {
        console.error("فشل فادح: لم يتم جلب أي إعدادات للأسئلة!");
        alert("خطأ: لا توجد أي أسئلة مفعّلة! يرجى مراجعة لوحة التحكم.");
    }
}

/**
 * بدء اختبار جديد بالإعدادات المحددة.
 * @param {object} settings - إعدادات الاختبار.
 */
export function start(settings) {
    state = {
        ...state,
        ...settings,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0
    };
    
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

/**
 * عرض السؤال التالي في الاختبار.
 */
function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    const playerLevel = progression.getLevelInfo(player.playerData.xp).level;
    // فلترة الأسئلة التي يتطلب مستواها أن يكون أقل من أو يساوي مستوى اللاعب
    const availableQuestions = allActiveQuestions.filter(q => playerLevel >= q.level_required);

    if (availableQuestions.length === 0) {
        alert("عفواً، لا توجد أسئلة متاحة لمستواك الحالي. استمر في اللعب لفتح المزيد!");
        console.error("لا توجد أسئلة متاحة لمستوى اللاعب:", playerLevel);
        ui.showScreen(ui.startScreen);
        return;
    }

    const randomQuestionData = shuffleArray(availableQuestions)[0];
    const randomGenerator = randomQuestionData.generator;
    
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        console.warn(`فشل مولد الأسئلة ${randomGenerator.name} في إنشاء سؤال. يتم المحاولة مرة أخرى.`);
        displayNextQuestion(); // حاول مرة أخرى بسؤال مختلف
    }
}

/**
 * معالجة نتيجة إجابة اللاعب على السؤال.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - نص الإجابة الصحيحة.
 * @param {HTMLElement} clickedElement - العنصر الذي تم النقر عليه.
 */
function handleResult(isCorrect, correctAnswerText, clickedElement) {
    ui.disableQuestionInteraction();
    const rules = progression.getGameRules();

    if (isCorrect) {
        state.score++;
        state.xpEarned += rules.xp_per_correct_answer || 0;
        ui.markAnswer(clickedElement, true);
    } else {
        state.errorLog.push({
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        ui.markAnswer(clickedElement, false);
    }

    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

/**
 * إنهاء الاختبار، حساب المكافآت، وحفظ النتائج.
 */
async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    const rules = progression.getGameRules();

    // زيادة عدادات اللاعب
    player.playerData.total_quizzes_completed = (player.playerData.total_quizzes_completed || 0) + 1;
    player.playerData.dailyQuizzes.count++;

    // حساب المكافآت الإضافية
    if (state.score === state.totalQuestions) {
        state.xpEarned += rules.xp_bonus_all_correct || 0;
        player.playerData.diamonds += rules.diamonds_bonus_all_correct || 0;
        console.log("مكافأة الأداء المثالي: تم إضافة نقاط وألماس.");
    }
    if (player.playerData.dailyQuizzes.count === rules.daily_quizzes_goal) {
        state.xpEarned += rules.daily_quizzes_bonus_xp || 0;
        console.log("مكافأة الهدف اليومي: تم إضافة نقاط خبرة إضافية.");
    }
    
    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;

    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
    }

    // التحقق من الإنجازات بعد اكتمال كل الحسابات
    achievements.checkAchievements('quiz_completed', {
        score: state.score,
        totalQuestions: state.totalQuestions,
        errors: state.errorLog.length,
        isPerfect: state.score === state.totalQuestions,
        pageNumber: state.pageNumber
    });

    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        ui.displayFinalResult(state, levelUpInfo);
    }

    // حفظ كل التغييرات في قاعدة البيانات
    await player.savePlayer();
    await saveResult(state);
    ui.updateSaveMessage(true);
}

/**
 * إرجاع الحالة الحالية للاختبار.
 * @returns {object}
 */
export function getCurrentState() {
    return state;
}
