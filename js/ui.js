// =============================================================
// ==      وحدة واجهة المستخدم (UI) - نسخة نهائية كاملة        ==
// =============================================================

// --- 1. استيراد العناصر من DOM ---
// تم تحديث القائمة لتعكس الهيكل الجديد القائم على التبويبات
export const startScreen = document.getElementById('start-screen');
export const mainInterface = document.getElementById('main-interface');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');

export const userNameInput = document.getElementById('userName');
export const startButton = document.getElementById('startButton');
export const loader = document.getElementById('loader');

export const playerInfoHeader = document.getElementById('player-info-header');
export const pageSelect = document.getElementById('pageSelect');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');
export const startTestButton = document.getElementById('startTestButton');

export const leaderboardList = document.getElementById('leaderboard-list');

export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');

export const errorListDiv = document.getElementById('error-list');
export const showFinalResultButton = document.getElementById('show-final-result-button');

export const resultNameSpan = document.getElementById('resultName');
export const finalScoreSpan = document.getElementById('finalScore');
export const xpGainedSpan = document.getElementById('xpGained');
export const levelUpMessage = document.getElementById('level-up-message');
export const saveStatus = document.getElementById('save-status');
export const reloadButton = document.getElementById('reloadButton');

export const achievementToast = document.getElementById('achievement-toast');
export const achievementToastName = document.getElementById('achievement-toast-name');
export const achievementToastReward = document.getElementById('achievement-toast-reward');


// --- 2. دوال التحكم في الواجهة ---

/**
 * تعرض شاشة محددة (مثل شاشة البداية أو الاختبار) وتخفي البقية.
 * @param {HTMLElement} screenToShow - العنصر الذي سيتم إظهاره.
 */
export function showScreen(screenToShow) {
    const allScreens = [startScreen, mainInterface, quizScreen, errorReviewScreen, resultScreen];
    allScreens.forEach(s => {
        if (s) s.classList.add('hidden'); // التحقق من أن العنصر ليس null قبل التعامل معه
    });
    if (screenToShow) screenToShow.classList.remove('hidden');
}

/**
 * تعرض تبويبًا محددًا داخل الواجهة الرئيسية وتخفي البقية.
 * @param {string} tabIdToShow - معرف التبويب الذي سيتم إظهاره.
 */
export function showTab(tabIdToShow) {
    // إخفاء جميع محتويات التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    // إزالة التحديد من جميع أزرار التبويبات
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // إظهار المحتوى والزر المطلوبين
    const activeTabContent = document.getElementById(tabIdToShow);
    const activeTabButton = document.querySelector(`.tab-button[data-tab="${tabIdToShow}"]`);

    if (activeTabContent) activeTabContent.classList.remove('hidden');
    if (activeTabButton) activeTabButton.classList.add('active');
}

/**
 * تظهر أو تخفي دائرة التحميل.
 * @param {boolean} show - `true` للإظهار، `false` للإخفاء.
 */
export function toggleLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}


// --- 3. دوال تحديث بيانات اللاعب والاختبار ---

/**
 * تحديث معلومات اللاعب في رأس الصفحة.
 */
export function updatePlayerHeader(playerData, levelInfo) {
    if (!playerInfoHeader) return;
    playerInfoHeader.innerHTML = `
        <p>مرحباً بك يا <strong>${playerData.username}</strong>!</p>
        <p>المستوى: ${levelInfo.level} (${levelInfo.title}) | الخبرة: ${playerData.xp} | الألماس: ${playerData.diamonds} 💎</p>
    `;
}

/**
 * تملأ قائمة اختيار (select) بالخيارات.
 */
export function populateSelect(selectElement, optionsArray, prefix = '') {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    if (optionsArray.length === 0) {
        selectElement.innerHTML = `<option value="">لا توجد ${prefix} متاحة</option>`;
        return;
    }
    optionsArray.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = `${prefix} ${optionValue}`;
        selectElement.appendChild(option);
    });
}

/**
 * تملأ قائمة اختيار القراء بالخيارات الافتراضية والمشتراة.
 */
export function populateQariSelect(selectElement, inventory) {
    if (!selectElement) return;
    const defaultQaris = [
        { value: 'ar.alafasy', text: 'مشاري العفاسي' },
        { value: 'ar.abdulbasitmurattal', text: 'عبد الباسط (مرتل)' },
        { value: 'ar.minshawi', text: 'محمد صديق المنشاوي' }
    ];
    const purchasableQaris = [
        { id: 'qari_husary', value: 'ar.husary', text: 'محمود خليل الحصري' },
        { id: 'qari_sudais', value: 'ar.sudais', text: 'عبد الرحمن السديس' },
        { id: 'qari_ajmy', value: 'ar.ajmy', text: 'أحمد العجمي' }
    ];

    selectElement.innerHTML = '';
    defaultQaris.forEach(q => {
        const option = document.createElement('option');
        option.value = q.value;
        option.textContent = q.text;
        selectElement.appendChild(option);
    });

    purchasableQaris.forEach(q => {
        if (inventory.includes(q.id)) {
            const option = document.createElement('option');
            option.value = q.value;
            option.textContent = `${q.text} (تم شراؤه)`;
            selectElement.appendChild(option);
        }
    });
}

/**
 * تحديث خيارات عدد الأسئلة المتاحة بناءً على مستوى اللاعب.
 */
export function updateQuestionsCountOptions(maxQuestions) {
    if (!questionsCountSelect) return;
    questionsCountSelect.innerHTML = '';
    for (let i = 5; i <= maxQuestions; i += 5) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} ${i <= 10 ? 'أسئلة' : 'سؤالاً'}`;
        questionsCountSelect.appendChild(option);
    }
}

/**
 * تحديث شريط تقدم الاختبار.
 */
export function updateProgress(current, total) {
    if (progressCounter) progressCounter.textContent = `السؤال ${current} من ${total}`;
    if (progressBar) {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

// في ملف js/ui.js، أضف هذا المقطع

// ... (بعد دالة updateProgress)

export function disableQuestionInteraction() {
    if (questionArea) {
        questionArea.querySelectorAll('button, .choice-box, .number-box, .option-div').forEach(el => {
            el.style.pointerEvents = 'none';
        });
    }
}

export function markAnswer(element, isCorrect) {
    if (element) {
        element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    }
}

export function showFeedback(isCorrect, correctAnswerText) {
    if (!feedbackArea) return;
    feedbackArea.classList.remove('hidden', 'correct-answer', 'wrong-answer');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.classList.add('correct-answer');
    } else {
        feedbackArea.innerHTML = `إجابة خاطئة. الإجابة الصحيحة هي: <strong>${correctAnswerText}</strong>`;
        feedbackArea.classList.add('wrong-answer');
    }
}

// ... (قبل دالة displayLeaderboard)

// --- 4. دوال عرض النتائج والملاحظات ---

/**
 * عرض بيانات لوحة الصدارة.
 */
export function displayLeaderboard(leaderboardData) {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<p>لا توجد بيانات لعرضها حاليًا.</p>';
        return;
    }
    leaderboardData.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${player.username}</span>
            <span class="leaderboard-xp">${player.xp} XP</span>
        `;
        leaderboardList.appendChild(item);
    });
}

/**
 * عرض النتيجة النهائية للاختبار.
 */
export function displayFinalResult(quizState, levelUpInfo) {
    if (resultNameSpan) resultNameSpan.textContent = quizState.userName;
    if (finalScoreSpan) finalScoreSpan.textContent = `${quizState.score} / ${quizState.totalQuestions}`;
    if (xpGainedSpan) xpGainedSpan.textContent = quizState.xpEarned;
    
    if (levelUpMessage) {
        if (levelUpInfo) {
            levelUpMessage.innerHTML = `🎉 تهانينا! لقد ارتقيت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وكسبت ${levelUpInfo.reward} ألماسة!`;
            levelUpMessage.classList.remove('hidden');
        } else {
            levelUpMessage.classList.add('hidden');
        }
    }
    
    updateSaveMessage(true); // تم الحفظ قبل عرض هذه الشاشة
    showScreen(resultScreen);
}

/**
 * عرض شاشة مراجعة الأخطاء.
 */
export function displayErrorReview(errorLog) {
    if (!errorListDiv) return;
    errorListDiv.innerHTML = errorLog.map(error => `
        <div class="error-review-item">
            <h4>السؤال الذي أخطأت فيه:</h4>
            ${error.questionHTML}
            <hr>
            <p><strong>الإجابة الصحيحة كانت:</strong> <span class="correct-text">${error.correctAnswer}</span></p>
        </div>
    `).join('');
    showScreen(errorReviewScreen);
}

/**
 * تحديث رسالة حفظ التقدم.
 */
export function updateSaveMessage(isSaved) {
    if (!saveStatus) return;
    if (isSaved) {
        saveStatus.textContent = 'تم حفظ تقدمك بنجاح!';
        saveStatus.style.color = '#004d40';
    } else {
        saveStatus.textContent = 'جاري حفظ تقدمك...';
        saveStatus.style.color = '#555';
    }
}

/**
 * إظهار إشعار عند تحقيق إنجاز جديد.
 */
export function showAchievementToast(achievement) {
    if (!achievementToast) return;
    if (achievementToastName) achievementToastName.textContent = achievement.name;
    if (achievementToastReward) achievementToastReward.textContent = `+${achievement.xp_reward} XP, +${achievement.diamonds_reward} 💎`;
    
    achievementToast.classList.add('show');
    setTimeout(() => {
        achievementToast.classList.remove('show');
    }, 4000);
}
