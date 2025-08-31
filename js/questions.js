// =============================================================
// ==      وحدة مصنع الأسئلة (تحتوي على كل أنواع الأسئلة)     ==
// ==      (النسخة النهائية - لا تغييرات جوهرية)             ==
// =============================================================

// دالة مساعدة لخلط عناصر مصفوفة، تستخدمها معظم دوال الأسئلة
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

// --- دوال توليد الأسئلة ---

/**
 * 1. اختر الآية التالية
 */
function generateChooseNextQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 2) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    
    const questionHTML = `<h3>السؤال: استمع واختر الآية التالية</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`  ).join('')}`;
    const correctAnswer = correctNextAyah.text;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctNextAyah.number, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 2. حدد موقع الآية
 */
function generateLocateAyahQuestion(pageAyahs, qari, handleResultCallback) {
    const ayahIndex = Math.floor(Math.random() * pageAyahs.length);
    const questionAyah = pageAyahs[ayahIndex];
    const totalAyahs = pageAyahs.length;
    let correctLocation;
    if (ayahIndex < totalAyahs / 3) correctLocation = 'بداية';
    else if (ayahIndex < (totalAyahs * 2) / 3) correctLocation = 'وسط';
    else correctLocation = 'نهاية';
    
    const questionHTML = `<h3>السؤال: أين يقع موضع هذه الآية في الصفحة؟</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio><div class="interactive-area">${['بداية', 'وسط', 'نهاية'].map(loc => `<div class="choice-box" data-loc="${loc}">${loc} الصفحة</div>`  ).join('')}</div>`;
    const correctAnswer = `${correctLocation} الصفحة`;
    const setupListeners = (area) => area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.loc === correctLocation, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 3. أكمل الكلمة الأخيرة
 */
function generateCompleteLastWordQuestion(pageAyahs, qari, handleResultCallback) {
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 3);
    if (suitableAyahs.length < 4) return null;
    const questionAyah = shuffleArray(suitableAyahs)[0];
    const words = questionAyah.text.split(' ');
    const correctLastWord = words.pop();
    const incompleteAyahText = words.join(' ');
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number)).slice(0, 3).map(a => a.text.split(' ').pop());
    const options = shuffleArray([correctLastWord, ...wrongOptions]);
    
    const questionHTML = `<h3>السؤال: اختر الكلمة الصحيحة لإكمال الآية:</h3><p style="font-family: 'Amiri', serif; font-size: 22px;">${incompleteAyahText} (...)</p><div class="interactive-area">${options.map(opt => `<div class="choice-box" data-word="${opt}">${opt}</div>`).join('')}</div>`;
    const correctAnswer = correctLastWord;
    const setupListeners = (area) => area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.word === correctLastWord, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 4. الآية الدخيلة (صوتي)
 */
function generateAudioIntruderQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 4) return null;
    let allFourAyahs = shuffleArray(pageAyahs.slice(0, 4));
    const intruderAyah = allFourAyahs[0];
    const audioQueue = allFourAyahs.map(a => `https://cdn.islamic.network/quran/audio/128/${qari}/${a.number}.mp3`  );
    const playAudioQueue = () => { let p = new Audio(), i = 0; p.src = audioQueue[i]; p.play(); p.onended = () => { i++; if (i < audioQueue.length) { p.src = audioQueue[i]; p.play(); } }; };
    const questionHTML = `<h3>السؤال: استمع للآيات وحدد الآية الدخيلة</h3><button id="play-audio-btn">▶️ تشغيل الآيات</button><div class="interactive-area">${allFourAyahs.map((ayah, i) => `<div class="number-box" data-number="${ayah.number}">${i + 1}</div>`).join('')}</div>`;
    const correctAnswer = `الآية رقم 1 (النص: ${intruderAyah.text.substring(0, 50)}...)`;
    const setupListeners = (area) => { area.querySelector('#play-audio-btn').addEventListener('click', playAudioQueue); area.querySelectorAll('.number-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == intruderAyah.number, correctAnswer, el))); };
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 5. تحديد رقم الآية
 */
function generateIdentifyAyahNumberQuestion(pageAyahs, qari, handleResultCallback) {
    const questionAyah = shuffleArray(pageAyahs)[0];
    const correctNumber = questionAyah.numberInSurah;
    let options = [correctNumber];
    while (options.length < 4) { const wrongNumber = correctNumber + Math.floor(Math.random() * 5) - 2; if (wrongNumber > 0 && !options.includes(wrongNumber)) options.push(wrongNumber); }
    const questionHTML = `<h3>السؤال: استمع للآية، ثم اختر رقمها الصحيح في السورة</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio><div class="interactive-area">${shuffleArray(options  ).map(opt => `<div class="choice-box" data-number="${opt}">${opt}</div>`).join('')}</div>`;
    const correctAnswer = String(correctNumber);
    const setupListeners = (area) => area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctNumber, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 6. الخريطة البصرية للسطر
 */
function generateVisualMapQuestion(pageAyahs, qari, handleResultCallback) {
    const ayahsWithLines = pageAyahs.filter(a => a.line);
    if (ayahsWithLines.length < 3) return null;
    const questionAyah = shuffleArray(ayahsWithLines)[0];
    const correctLine = questionAyah.line;
    const wrongOptions = shuffleArray(ayahsWithLines.filter(a => a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([questionAyah, ...wrongOptions]);
    let mapHTML = '';
    for (let i = 1; i <= 15; i++) { mapHTML += `<div class="map-line ${i === correctLine ? 'highlighted' : ''}"></div>`; }
    const questionHTML = `<h3>السؤال: أي من الآيات التالية تبدأ في السطر الملون؟</h3><style>#page-map{display:grid;grid-template-columns:repeat(15,1fr);gap:2px;height:40px;margin:20px auto;border:1px solid #ccc;padding:5px;direction:rtl;}.map-line{background-color:#eee;border:1px solid #fff;}.map-line.highlighted{background-color:#00796b;}</style><div id="page-map">${mapHTML}</div>${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`).join('')}`;
    const correctAnswer = questionAyah.text;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == questionAyah.number, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 7. أكمل نصف الآية
 */
function generateCompleteAyahQuestion(pageAyahs, qari, handleResultCallback) {
    const longAyahs = pageAyahs.filter(a => a.text.split(' ').length > 8);
    if (longAyahs.length < 3) return null;
    const questionAyah = shuffleArray(longAyahs)[0];
    const words = questionAyah.text.split(' ');
    const splitPoint = Math.floor(words.length / 2);
    const firstHalfText = words.slice(0, splitPoint).join(' ');
    const correctSecondHalf = words.slice(splitPoint).join(' ');
    const wrongAyahs = pageAyahs.filter(a => a.number !== questionAyah.number);
    const wrongOptions = shuffleArray(wrongAyahs).slice(0, 2).map(a => a.text.split(' ').slice(Math.floor(a.text.split(' ').length / 2)).join(' '));
    const options = shuffleArray([correctSecondHalf, ...wrongOptions]);
    const questionHTML = `<h3>السؤال: اختر التكملة الصحيحة للآية التالية:</h3><p style="font-family: 'Amiri', serif; font-size: 22px;">"${firstHalfText}..."</p>${options.map(opt => `<div class="option-div" data-text="${escape(opt)}">${opt}</div>`).join('')}`;
    const correctAnswer = correctSecondHalf;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => el.addEventListener('click', () => handleResultCallback(unescape(el.dataset.text) === correctSecondHalf, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 8. تحديد فاصل الآية
 */
function generateIdentifyAyahEndQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 2) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const firstAyah = pageAyahs[startIndex];
    const secondAyah = pageAyahs[startIndex + 1];
    const firstAyahWords = firstAyah.text.split(' ');
    if (firstAyahWords.length < 2) return null;
    const correctWord = firstAyahWords[firstAyahWords.length - 1];
    const options = shuffleArray([correctWord, firstAyahWords[firstAyahWords.length - 2], secondAyah.text.split(' ')[0]]);
    const audioQueue = [`https://cdn.islamic.network/quran/audio/128/${qari}/${firstAyah.number}.mp3`, `https://cdn.islamic.network/quran/audio/128/${qari}/${secondAyah.number}.mp3`];
    const playAudioQueue = (  ) => { let p = new Audio(), i = 0; p.src = audioQueue[i]; p.play(); p.onended = () => { i++; if (i < audioQueue.length) { p.src = audioQueue[i]; p.play(); } }; };
    const questionHTML = `<h3>السؤال: استمع للتلاوة المتصلة، ثم حدد الكلمة التي انتهت بها الآية الأولى</h3><button id="play-audio-btn">▶️ تشغيل الآيات</button><div class="interactive-area">${options.map(opt => `<div class="choice-box" data-word="${opt}">${opt}</div>`).join('')}</div>`;
    const correctAnswer = correctWord;
    const setupListeners = (area) => { area.querySelector('#play-audio-btn').addEventListener('click', playAudioQueue); area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.word === correctWord, correctAnswer, el))); };
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 9. الكلمة الفريدة في الصفحة
 */
function generateFindUniqueWordQuestion(pageAyahs, qari, handleResultCallback) {
    const allText = pageAyahs.map(a => a.text).join(' ');
    const words = allText.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').split(' ');
    const wordCounts = words.reduce((acc, word) => { if (word.length > 2) acc[word] = (acc[word] || 0) + 1; return acc; }, {});
    let questionAyah = null, uniqueWord = null, repeatedWords = [];
    for (const ayah of shuffleArray(pageAyahs)) {
        const ayahWords = new Set(ayah.text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').split(' '));
        const uniqueInAyah = [...ayahWords].filter(w => wordCounts[w] === 1);
        const repeatedInAyah = [...ayahWords].filter(w => wordCounts[w] > 1);
        if (uniqueInAyah.length > 0 && repeatedInAyah.length >= 2) { questionAyah = ayah; uniqueWord = uniqueInAyah[0]; repeatedWords = shuffleArray(repeatedInAyah).slice(0, 2); break; }
    }
    if (!questionAyah) return null;
    const options = shuffleArray([uniqueWord, ...repeatedWords]);
    const questionHTML = `<h3>السؤال: أي من كلمات الآية التالية لم تتكرر في هذه الصفحة؟</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio><div class="interactive-area">${options.map(opt => `<div class="choice-box" data-word="${opt}">${opt}</div>`  ).join('')}</div>`;
    const correctAnswer = uniqueWord;
    const setupListeners = (area) => area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.word === uniqueWord, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 10. عدّ تكرار كلمة
 */
function generateCountWordQuestion(pageAyahs, qari, handleResultCallback) {
    const allText = pageAyahs.map(a => a.text).join(' ');
    const words = allText.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').split(' ');
    const wordCounts = words.reduce((acc, word) => { if (word.length > 3) acc[word] = (acc[word] || 0) + 1; return acc; }, {});
    const frequentWords = Object.keys(wordCounts).filter(word => wordCounts[word] >= 2 && wordCounts[word] <= 4);
    if (frequentWords.length === 0) return null;
    const targetWord = shuffleArray(frequentWords)[0];
    const correctCount = wordCounts[targetWord];
    const options = shuffleArray([correctCount, correctCount + 1, Math.max(1, correctCount - 1)]);
    const questionHTML = `<h3>السؤال: كم مرة وردت كلمة "${targetWord}" في هذه الصفحة؟</h3><div class="interactive-area">${options.map(opt => `<div class="choice-box" data-count="${opt}">${opt}</div>`).join('')}</div>`;
    const correctAnswer = String(correctCount);
    const setupListeners = (area) => area.querySelectorAll('.choice-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.count == correctCount, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 11. أي آية تنتمي للصفحة؟
 */
function generateFindPageAyahQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 4) return null;
    const correctAyah = shuffleArray(pageAyahs)[0];
    const intruderAyahs = pageAyahs.filter(a => a.number !== correctAyah.number).slice(0, 3);
    const allFourAyahs = shuffleArray([correctAyah, ...intruderAyahs]);
    const audioQueue = allFourAyahs.map(a => `https://cdn.islamic.network/quran/audio/128/${qari}/${a.number}.mp3`  );
    const playAudioQueue = () => { let p = new Audio(), i = 0; p.src = audioQueue[i]; p.play(); p.onended = () => { i++; if (i < audioQueue.length) { p.src = audioQueue[i]; p.play(); } }; };
    const questionHTML = `<h3>السؤال: استمع للآيات وحدد أي منها ينتمي لهذه الصفحة</h3><button id="play-audio-btn">▶️ تشغيل الآيات</button><div class="interactive-area">${allFourAyahs.map((ayah, i) => `<div class="number-box" data-number="${ayah.number}">${i + 1}</div>`).join('')}</div>`;
    const correctAnswer = `الآية التي نصها: ${correctAyah.text.substring(0, 50)}...`;
    const setupListeners = (area) => { area.querySelector('#play-audio-btn').addEventListener('click', playAudioQueue); area.querySelectorAll('.number-box').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctAyah.number, correctAnswer, el))); };
    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * 12. اختر الآية السابقة
 */
function generateChoosePreviousQuestion(pageAyahs, qari, handleResultCallback) {
    if (pageAyahs.length < 2) return null;
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1)) + 1;
    const questionAyah = pageAyahs[startIndex];
    const correctPreviousAyah = pageAyahs[startIndex - 1];
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctPreviousAyah.number && a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([correctPreviousAyah, ...wrongOptions]);
    const questionHTML = `<h3>السؤال: استمع واختر الآية السابقة لهذه الآية</h3><audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>`  ).join('')}`;
    const correctAnswer = correctPreviousAyah.text;
    const setupListeners = (area) => area.querySelectorAll('.option-div').forEach(el => el.addEventListener('click', () => handleResultCallback(el.dataset.number == correctPreviousAyah.number, correctAnswer, el)));
    return { questionHTML, correctAnswer, setupListeners };
}


// --- كتالوج الأسئلة ---
// هذا الكائن يجمع كل دوال الأسئلة ليسهل الوصول إليها من أي مكان آخر.
export const allQuestionGenerators = {
    generateChooseNextQuestion,
    generateLocateAyahQuestion,
    generateCompleteLastWordQuestion,
    generateAudioIntruderQuestion,
    generateIdentifyAyahNumberQuestion,
    generateVisualMapQuestion,
    generateCompleteAyahQuestion,
    generateIdentifyAyahEndQuestion,
    generateFindUniqueWordQuestion,
    generateCountWordQuestion,
    generateFindPageAyahQuestion,
    generateChoosePreviousQuestion,
};
