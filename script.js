const state = {
  settings: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  userAnswers: [],
  timerId: null,
  timeLeft: 0,
  allAtOnceExpired: false,
};

const els = {
  questionCount: document.getElementById("questionCount"),
  decimalPlaces: document.getElementById("decimalPlaces"),
  timedOptions: document.getElementById("timedOptions"),
  perQuestionSeconds: document.getElementById("perQuestionSeconds"),
  totalSeconds: document.getElementById("totalSeconds"),
  startBtn: document.getElementById("startBtn"),
  quizPanel: document.getElementById("quizPanel"),
  resultPanel: document.getElementById("resultPanel"),
  quizContent: document.getElementById("quizContent"),
  progressText: document.getElementById("progressText"),
  scoreText: document.getElementById("scoreText"),
  timerBox: document.getElementById("timerBox"),
  timerText: document.getElementById("timerText"),
  submitBtn: document.getElementById("submitBtn"),
  nextBtn: document.getElementById("nextBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resultSummary: document.getElementById("resultSummary"),
  reviewList: document.getElementById("reviewList"),
  restartBtn: document.getElementById("restartBtn"),
};

function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a);
}

function simplifyFraction(n, d) {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function denominatorToPowerOf10(d) {
  let temp = d;
  let c2 = 0;
  let c5 = 0;
  while (temp % 2 === 0) {
    temp /= 2;
    c2++;
  }
  while (temp % 5 === 0) {
    temp /= 5;
    c5++;
  }
  if (temp !== 1) return null;
  const power = Math.max(c2, c5);
  return 10 ** power;
}

function multiplierToPower10(d) {
  const target = denominatorToPowerOf10(d);
  return target / d;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getSelectedFractionTypes() {
  return Array.from(document.querySelectorAll(".fraction-type:checked")).map((el) => el.value);
}

function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function getTimedType() {
  return document.querySelector('input[name="timedType"]:checked').value;
}

function generateAllowedDenominators() {
  const set = new Set();
  for (let a = 0; a <= 4; a++) {
    for (let b = 0; b <= 3; b++) {
      const value = 2 ** a * 5 ** b;
      if (value >= 2 && value <= 100) set.add(value);
    }
  }
  return [...set].sort((x, y) => x - y);
}

const ALLOWED_DENOMINATORS = generateAllowedDenominators();

function toDecimalString(value, maxPlaces = 6) {
  let text = value.toFixed(maxPlaces);
  text = text.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return text;
}

function buildQuestion(type, decimalPlaces) {
  const denominator = ALLOWED_DENOMINATORS[randomInt(0, ALLOWED_DENOMINATORS.length - 1)];
  const targetDenominator = denominatorToPowerOf10(denominator);
  const multiplier = multiplierToPower10(denominator);
  let numerator;
  let whole = 0;
  let display = "";
  let improperNumerator = 0;
  let properNumerator = 0;

  if (type === "proper") {
    numerator = randomInt(1, denominator - 1);
    const simple = simplifyFraction(numerator, denominator);
    numerator = simple.n;
    const finalD = simple.d;
    const finalTarget = denominatorToPowerOf10(finalD);
    const finalMultiplier = finalTarget / finalD;
    const decimal = simple.n / finalD;
    display = renderFraction(simple.n, finalD);
    return {
      kind: "proper",
      numerator: simple.n,
      denominator: finalD,
      targetDenominator: finalTarget,
      multiplier: finalMultiplier,
      convertedNumerator: simple.n * finalMultiplier,
      decimal,
      answerText: toDecimalString(decimal, decimalPlaces),
      display,
    };
  }

  if (type === "improper") {
    whole = randomInt(1, 5);
    properNumerator = randomInt(1, denominator - 1);
    improperNumerator = whole * denominator + properNumerator;
    const simple = simplifyFraction(improperNumerator, denominator);
    if (simple.n <= simple.d) {
      return buildQuestion(type, decimalPlaces);
    }
    const finalWhole = Math.floor(simple.n / simple.d);
    const remainder = simple.n % simple.d;
    const remSimple = simplifyFraction(remainder, simple.d);
    const finalTarget = denominatorToPowerOf10(remSimple.d);
    const finalMultiplier = finalTarget / remSimple.d;
    const decimal = simple.n / simple.d;
    display = renderFraction(simple.n, simple.d);
    return {
      kind: "improper",
      numerator: simple.n,
      denominator: simple.d,
      mixedWhole: finalWhole,
      mixedNumerator: remSimple.n,
      mixedDenominator: remSimple.d,
      targetDenominator: finalTarget,
      multiplier: finalMultiplier,
      convertedNumerator: remSimple.n * finalMultiplier,
      decimal,
      answerText: toDecimalString(decimal, decimalPlaces),
      display,
    };
  }

  if (type === "mixed") {
    whole = randomInt(1, 5);
    numerator = randomInt(1, denominator - 1);
    const simple = simplifyFraction(numerator, denominator);
    const decimal = whole + simple.n / simple.d;
    const finalTarget = denominatorToPowerOf10(simple.d);
    const finalMultiplier = finalTarget / simple.d;
    display = `${whole}${renderFraction(simple.n, simple.d)}`;
    return {
      kind: "mixed",
      whole,
      numerator: simple.n,
      denominator: simple.d,
      targetDenominator: finalTarget,
      multiplier: finalMultiplier,
      convertedNumerator: simple.n * finalMultiplier,
      decimal,
      answerText: toDecimalString(decimal, decimalPlaces),
      display,
    };
  }
}

function generateQuestions(settings) {
  const questions = [];
  for (let i = 0; i < settings.questionCount; i++) {
    const type = settings.fractionTypes[randomInt(0, settings.fractionTypes.length - 1)];
    questions.push(buildQuestion(type, settings.decimalPlaces));
  }
  return questions;
}

function renderFraction(n, d) {
  return `<span class="fraction-inline"><span>${n}</span><span class="bar"></span><span>${d}</span></span>`;
}

function renderInputFraction(prefix) {
  return `<span class="fraction-inline"><input class="small-input" type="text" id="${prefix}_num" /><span class="bar"></span><input class="small-input" type="text" id="${prefix}_den" /></span>`;
}

function renderQuestion() {
  if (state.settings.mode === "timed" && state.settings.timedType === "allAtOnce") {
    renderAllAtOnceQuestions();
    return;
  }

  const q = state.questions[state.currentIndex];
  els.progressText.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
  els.scoreText.textContent = String(state.score);
  els.quizContent.innerHTML = "";
  els.nextBtn.classList.add("hidden");
  els.submitBtn.classList.remove("hidden");

  const box = document.createElement("div");
  box.className = "question-box";

  if (state.settings.mode === "guided") {
    box.innerHTML = renderGuidedQuestionHTML(q);
  } else {
    box.innerHTML = renderDirectQuestionHTML(q);
  }

  els.quizContent.appendChild(box);

  if (state.settings.mode === "timed" && state.settings.timedType === "perQuestion") {
    startPerQuestionTimer();
  }
}

function renderGuidedQuestionHTML(q) {
  if (q.kind === "proper") {
    return `
      <div class="expression">
        ${q.display} = ${renderInputFraction("step1")} = <input type="text" class="decimal-input" id="finalDecimal" />
      </div>
      <p class="muted">請先把分母化成 10 100 1000，再寫成小數。</p>
      <div id="feedback"></div>
    `;
  }

  if (q.kind === "improper") {
    return `
      <div class="expression">
        ${q.display} = <input type="text" class="small-input" id="wholePart" />${renderInputFraction("step1")} = <input type="text" class="decimal-input" id="finalDecimal" />
      </div>
      <p class="muted">請先化成帶分數，再把分母化成 10 100 1000，最後寫成小數。</p>
      <div id="feedback"></div>
    `;
  }

  return `
    <div class="expression">
      ${q.display} = <input type="text" class="small-input" id="wholePart" />${renderInputFraction("step1")} = <input type="text" class="decimal-input" id="finalDecimal" />
    </div>
    <p class="muted">請把分數部分的分母化成 10 100 1000，最後寫成小數。</p>
    <div id="feedback"></div>
  `;
}

function renderDirectQuestionHTML(q) {
  return `
    <div class="expression">
      ${q.display} = <input type="text" class="decimal-input" id="finalDecimal" />
    </div>
    <div id="feedback"></div>
  `;
}

function normalizeDecimalInput(text) {
  return String(text).trim().replace(/。/g, ".");
}

function isSameDecimal(userText, answerText) {
  const a = Number(answerText);
  const b = Number(normalizeDecimalInput(userText));
  if (Number.isNaN(b)) return false;
  return Math.abs(a - b) < 1e-9;
}

function evaluateCurrentQuestion(autoSubmit = false) {
  if (state.settings.mode === "timed" && state.settings.timedType === "allAtOnce") {
    evaluateAllAtOnceQuestions(autoSubmit);
    return;
  }

  clearPerQuestionTimer();
  const q = state.questions[state.currentIndex];
  const feedback = document.getElementById("feedback");
  let correct = false;
  let userRecord = {};

  const decimalInput = document.getElementById("finalDecimal")?.value ?? "";

  if (state.settings.mode === "guided") {
    if (q.kind === "proper") {
      const num = document.getElementById("step1_num")?.value ?? "";
      const den = document.getElementById("step1_den")?.value ?? "";
      const stepOK = Number(num) === q.convertedNumerator && Number(den) === q.targetDenominator;
      const decimalOK = isSameDecimal(decimalInput, q.answerText);
      correct = stepOK && decimalOK;
      userRecord = { stepNum: num, stepDen: den, decimal: decimalInput };
    } else {
      const whole = document.getElementById("wholePart")?.value ?? "";
      const num = document.getElementById("step1_num")?.value ?? "";
      const den = document.getElementById("step1_den")?.value ?? "";
      const expectedWhole = q.kind === "improper" ? q.mixedWhole : q.whole;
      const stepOK = Number(whole) === expectedWhole && Number(num) === q.convertedNumerator && Number(den) === q.targetDenominator;
      const decimalOK = isSameDecimal(decimalInput, q.answerText);
      correct = stepOK && decimalOK;
      userRecord = { whole, stepNum: num, stepDen: den, decimal: decimalInput };
    }
  } else {
    correct = isSameDecimal(decimalInput, q.answerText);
    userRecord = { decimal: decimalInput };
  }

  if (autoSubmit && !decimalInput && state.settings.mode !== "guided") {
    correct = false;
  }

  state.userAnswers[state.currentIndex] = {
    question: q,
    user: userRecord,
    correct,
    timedOut: autoSubmit,
  };

  if (correct) {
    state.score += 1;
    els.scoreText.textContent = String(state.score);
    feedback.className = "feedback ok";
    feedback.textContent = "答對了！";
  } else {
    feedback.className = "feedback bad";
    feedback.innerHTML = `答錯了。正確答案：${buildCorrectAnswerText(q)}`;
  }

  els.submitBtn.classList.add("hidden");

  const isLast = state.currentIndex === state.questions.length - 1;
  if (isLast) {
    els.finishBtn.classList.remove("hidden");
  } else {
    els.nextBtn.classList.remove("hidden");
  }
}

function buildCorrectAnswerText(q) {
  if (q.kind === "proper") {
    return `${q.display} = ${renderFraction(q.convertedNumerator, q.targetDenominator)} = ${q.answerText}`;
  }
  if (q.kind === "improper") {
    return `${q.display} = ${q.mixedWhole}${renderFraction(q.convertedNumerator, q.targetDenominator)} = ${q.answerText}`;
  }
  return `${q.display} = ${q.whole}${renderFraction(q.convertedNumerator, q.targetDenominator)} = ${q.answerText}`;
}

function goNextQuestion() {
  state.currentIndex += 1;
  if (state.currentIndex >= state.questions.length) {
    finishQuiz();
    return;
  }
  renderQuestion();
}

function finishQuiz() {
  clearAllTimers();
  els.quizPanel.classList.add("hidden");
  els.resultPanel.classList.remove("hidden");
  els.finishBtn.classList.add("hidden");
  const total = state.questions.length;
  els.resultSummary.textContent = `你答對 ${state.score} / ${total} 題。`;
  renderReview();
}

function renderReview() {
  els.reviewList.innerHTML = "";
  state.userAnswers.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `review-item ${item.correct ? "correct" : "wrong"}`;
    div.innerHTML = `
      <div><strong>第 ${index + 1} 題：</strong> ${item.question.display}</div>
      <div>正確答案：${item.question.answerText}</div>
      <div>${item.correct ? "✅ 正確" : "❌ 錯誤"}${item.timedOut ? "（時間到）" : ""}</div>
    `;
    els.reviewList.appendChild(div);
  });
}

function resetState() {
  clearAllTimers();
  state.settings = null;
  state.questions = [];
  state.currentIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  state.allAtOnceExpired = false;
  els.scoreText.textContent = "0";
  els.progressText.textContent = "0 / 0";
  els.quizContent.innerHTML = "";
  els.resultPanel.classList.add("hidden");
  els.quizPanel.classList.add("hidden");
  els.finishBtn.classList.add("hidden");
  els.timerBox.classList.add("hidden");
}

function startQuiz() {
  const fractionTypes = getSelectedFractionTypes();
  if (fractionTypes.length === 0) {
    alert("請至少勾選一種題型。");
    return;
  }

  const settings = {
    questionCount: Number(els.questionCount.value),
    decimalPlaces: Number(els.decimalPlaces.value),
    fractionTypes,
    mode: getSelectedMode(),
    timedType: getTimedType(),
    perQuestionSeconds: Number(els.perQuestionSeconds.value),
    totalSeconds: Number(els.totalSeconds.value),
  };

  state.settings = settings;
  state.questions = generateQuestions(settings);
  state.currentIndex = 0;
  state.score = 0;
  state.userAnswers = [];
  state.allAtOnceExpired = false;

  els.resultPanel.classList.add("hidden");
  els.quizPanel.classList.remove("hidden");
  els.finishBtn.classList.add("hidden");

  if (settings.mode === "timed") {
    els.timerBox.classList.remove("hidden");
    if (settings.timedType === "allAtOnce") {
      startAllAtOnceTimer();
    }
  } else {
    els.timerBox.classList.add("hidden");
  }

  renderQuestion();
}

function updateModeUI() {
  const mode = getSelectedMode();
  els.timedOptions.classList.toggle("hidden", mode !== "timed");
}

function startPerQuestionTimer() {
  clearPerQuestionTimer();
  state.timeLeft = state.settings.perQuestionSeconds;
  els.timerText.textContent = `${state.timeLeft} 秒`;
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    els.timerText.textContent = `${state.timeLeft} 秒`;
    if (state.timeLeft <= 0) {
      clearPerQuestionTimer();
      if (!document.getElementById("feedback")?.textContent) {
        evaluateCurrentQuestion(true);
      }
    }
  }, 1000);
}

function startAllAtOnceTimer() {
  clearAllTimers();
  state.timeLeft = state.settings.totalSeconds;
  els.timerText.textContent = `${state.timeLeft} 秒`;
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    els.timerText.textContent = `${state.timeLeft} 秒`;
    if (state.timeLeft <= 0) {
      clearAllTimers();
      state.allAtOnceExpired = true;
      autoFinishAllAtOnce();
    }
  }, 1000);
}

function autoFinishAllAtOnce() {
  if (state.settings.mode === "timed" && state.settings.timedType === "allAtOnce") {
    evaluateAllAtOnceQuestions(true);
  }
  finishQuiz();
}

function clearPerQuestionTimer() {
  if (state.settings?.mode === "timed" && state.settings?.timedType === "perQuestion" && state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function clearAllTimers() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

els.startBtn.addEventListener("click", startQuiz);
els.submitBtn.addEventListener("click", () => evaluateCurrentQuestion(false));
els.nextBtn.addEventListener("click", goNextQuestion);
els.finishBtn.addEventListener("click", finishQuiz);
els.restartBtn.addEventListener("click", resetState);
document.querySelectorAll('input[name="mode"]').forEach((el) => el.addEventListener("change", updateModeUI));

updateModeUI();
resetState();


function renderAllAtOnceQuestions() {
  els.progressText.textContent = `全部 ${state.questions.length} 題`;
  els.scoreText.textContent = String(state.score);
  els.quizContent.innerHTML = "";
  els.nextBtn.classList.add("hidden");
  els.finishBtn.classList.add("hidden");
  els.submitBtn.classList.remove("hidden");

  state.questions.forEach((q, index) => {
    const box = document.createElement("div");
    box.className = "question-box";
    box.innerHTML = `
      <div><strong>第 ${index + 1} 題</strong></div>
      <div class="expression">${q.display} = <input type="text" class="decimal-input all-at-once-input" data-index="${index}" /></div>
      <div id="feedback_${index}"></div>
    `;
    els.quizContent.appendChild(box);
  });
}


function evaluateAllAtOnceQuestions(autoSubmit = false) {
  clearAllTimers();
  state.score = 0;
  state.userAnswers = [];
  state.questions.forEach((q, index) => {
    const input = document.querySelector(`.all-at-once-input[data-index="${index}"]`);
    const decimalInput = input?.value ?? "";
    const correct = isSameDecimal(decimalInput, q.answerText);
    if (correct) state.score += 1;
    state.userAnswers[index] = {
      question: q,
      user: { decimal: decimalInput },
      correct,
      timedOut: autoSubmit,
    };
    const feedback = document.getElementById(`feedback_${index}`);
    feedback.className = `feedback ${correct ? "ok" : "bad"}`;
    feedback.innerHTML = correct ? "答對了！" : `答錯了。正確答案：${q.answerText}`;
  });
  els.scoreText.textContent = String(state.score);
  els.submitBtn.classList.add("hidden");
  els.finishBtn.classList.remove("hidden");
}
