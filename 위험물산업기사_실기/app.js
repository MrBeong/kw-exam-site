(function () {
  "use strict";

  const data = window.HAZMAT_DATA;
  const PASSWORD = "6761";
  const AUTH_KEY = "hazmat-study-unlocked-v2";
  const PROGRESS_KEY = "hazmat-study-progress-v3";
  const RESUME_KEY = "hazmat-study-resume-v1";
  const stageLabels = { ox: "O/X", choice: "객관식", blank: "빈칸", practical: "실전" };
  const sectionMeta = {
    theory: ["핵심이론", "새 기출기반 핵심이론을 단원별로 정리했습니다."],
    calculator: ["지정수량 계산", "품명별 지정수량을 선택해 합산 배수를 계산합니다."],
    practice: ["실전문제", "O/X부터 실전 서술형까지 단계별로 학습합니다."],
    analysis: ["기출분석", "첨부 문제에서 확인한 출제 형식과 우선순위입니다."]
  };
  const unitOrder = new Map(data.theory.map((unit, index) => [unit.id, index]));
  data.questions.ox.sort((a, b) => unitOrder.get(a.unit) - unitOrder.get(b.unit));

  const initialProgress = loadProgress();
  const state = {
    section: "theory",
    stage: "ox",
    indexes: { ox: 0, choice: 0, blank: 0, practical: 0 },
    progress: initialProgress,
    resume: loadResume(initialProgress),
    calcRows: []
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatText(value) {
    return escapeHtml(value)
      .replace(/-&gt;/g, "→")
      .replace(/(^|[^A-Za-z0-9])([0-9]*)([A-Z][A-Za-z0-9()]*[0-9][A-Za-z0-9()]*)/g, (match, prefix, coefficient, formula) => {
        const rendered = formula.replace(/([A-Za-z)]+)(\d+)/g, "$1<sub>$2</sub>");
        return `${prefix}${coefficient}<span class="chem-formula">${rendered}</span>`;
      });
  }

  function normalizeAnswer(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/메탄/g, "메테인")
      .replace(/\u2080|₀/g, "0").replace(/₁/g, "1").replace(/₂/g, "2").replace(/₃/g, "3").replace(/₄/g, "4")
      .replace(/₅/g, "5").replace(/₆/g, "6").replace(/₇/g, "7").replace(/₈/g, "8").replace(/₉/g, "9")
      .replace(/[^a-z0-9가-힣]/g, "");
  }

  function loadProgress() {
    const empty = {
      ox: { answers: {} }, choice: { answers: {} }, blank: { answers: {} }, practical: { answers: {} }
    };
    try {
      const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return parsed && parsed.ox ? parsed : empty;
    } catch {
      return empty;
    }
  }

  function saveProgress() {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  }

  function inferResume(progress) {
    const stages = Object.keys(stageLabels);
    for (let stageIndex = stages.length - 1; stageIndex >= 0; stageIndex -= 1) {
      const stage = stages[stageIndex];
      const answers = progress[stage]?.answers || {};
      if (!Object.keys(answers).length) continue;
      const items = data.questions[stage];
      const firstUnanswered = items.findIndex((question) => !answers[question.id]);
      const index = firstUnanswered === -1 ? items.length - 1 : firstUnanswered;
      return { stage, questionId: items[index].id, index };
    }
    return null;
  }

  function loadResume(progress) {
    try {
      const saved = JSON.parse(localStorage.getItem(RESUME_KEY));
      if (saved && stageLabels[saved.stage] && (saved.questionId || Number.isInteger(saved.index))) return saved;
    } catch {
      // Fall through to progress-based migration.
    }
    return inferResume(progress);
  }

  function resumeIndex(resume) {
    if (!resume || !stageLabels[resume.stage]) return -1;
    const items = data.questions[resume.stage];
    const questionIndex = items.findIndex((question) => question.id === resume.questionId);
    if (questionIndex >= 0) return questionIndex;
    if (!Number.isInteger(resume.index)) return -1;
    return Math.max(0, Math.min(items.length - 1, resume.index));
  }

  function updateResumeButton() {
    const button = document.getElementById("resumePractice");
    if (!button) return;
    const index = resumeIndex(state.resume);
    const available = index >= 0;
    button.disabled = !available;
    button.textContent = available ? `이어서 풀기 · ${stageLabels[state.resume.stage]} ${index + 1}번` : "이어서 풀기";
  }

  function saveResume() {
    const items = data.questions[state.stage];
    const index = Math.max(0, Math.min(items.length - 1, state.indexes[state.stage]));
    state.resume = { stage: state.stage, questionId: items[index].id, index };
    localStorage.setItem(RESUME_KEY, JSON.stringify(state.resume));
    updateResumeButton();
  }

  function setupAuth() {
    const gate = document.getElementById("authGate");
    const shell = document.getElementById("appShell");
    const form = document.getElementById("authForm");
    const input = document.getElementById("passwordInput");
    const error = document.getElementById("authError");

    function unlock() {
      gate.hidden = true;
      shell.hidden = false;
      shell.setAttribute("aria-hidden", "false");
      shell.removeAttribute("inert");
      document.body.classList.remove("locked");
      sessionStorage.setItem(AUTH_KEY, "1");
    }

    if (sessionStorage.getItem(AUTH_KEY) === "1") unlock();
    else setTimeout(() => input.focus(), 50);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value === PASSWORD) {
        error.textContent = "";
        input.value = "";
        unlock();
      } else {
        error.textContent = "비밀번호가 맞지 않습니다.";
        input.select();
      }
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      document.body.classList.add("locked");
      gate.hidden = false;
      shell.hidden = true;
      shell.setAttribute("aria-hidden", "true");
      shell.setAttribute("inert", "");
      input.value = "";
      input.focus();
    });
  }

  function setupNavigation() {
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.addEventListener("click", () => showSection(button.dataset.section));
    });
  }

  function showSection(section) {
    state.section = section;
    document.querySelectorAll(".page-section").forEach((node) => { node.hidden = node.id !== section; });
    document.querySelectorAll(".nav-button").forEach((button) => {
      if (button.dataset.section === section) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.getElementById("pageTitle").textContent = sectionMeta[section][0];
    document.getElementById("pageSubtitle").textContent = sectionMeta[section][1];
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function priorityBadge(priority) {
    const label = priority === "hot" ? "최빈출" : priority === "often" ? "빈출" : priority === "past" ? "기출표시" : "기본";
    return `<span class="badge ${priority}">${label}</span>`;
  }

  function renderTheory() {
    const list = document.getElementById("theoryList");
    const groups = [...new Set(data.theory.map((item) => item.group))];
    const groupSelect = document.getElementById("theoryGroup");
    groupSelect.insertAdjacentHTML("beforeend", groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join(""));

    const allPoints = data.theory.flatMap((unit) => unit.sections.flatMap((section) => section.items));
    const formulaCount = data.theory.reduce((sum, unit) => sum + unit.formulas.length, 0);
    const questionCount = Object.values(data.questions).reduce((sum, items) => sum + items.length, 0);
    document.getElementById("theorySummary").innerHTML = [
      ["이론 단원", `${data.theory.length}개`],
      ["핵심 개념", `${allPoints.length}개`],
      ["필수 반응식", `${formulaCount}개`],
      ["단계형 문제", `${questionCount}문제`]
    ].map(([label, value]) => `<div class="summary-item"><span>${label}</span><strong>${value}</strong></div>`).join("");

    list.innerHTML = data.theory.map((unit, index) => {
      const linkedQuestions = Object.values(data.questions).flat().filter((question) => question.unit === unit.id).length;
      const sections = unit.sections.map((section) => `
        <section class="theory-block">
          <h3>${escapeHtml(section.title)}</h3>
          <ul>${section.items.map((item) => `
            <li class="theory-point ${item.priority}">
              ${priorityBadge(item.priority)} ${formatText(item.text)}
              ${item.note ? `<span class="point-note">${formatText(item.note)}</span>` : ""}
            </li>`).join("")}</ul>
        </section>`).join("");
      const formulas = unit.formulas.length ? `
        <table class="formula-table">
          <tbody>${unit.formulas.map(([name, formula, flag]) => `<tr class="${flag === "past" ? "past" : ""}"><th>${flag === "past" ? '<span class="badge past">기출표시</span> ' : ""}${escapeHtml(name)}</th><td>${formatText(formula)}</td></tr>`).join("")}</tbody>
        </table>` : "";
      const searchText = [unit.title, unit.group, unit.summary, ...unit.sections.flatMap((s) => s.items.map((p) => p.text)), ...unit.formulas.flat()].join(" ").toLowerCase();
      return `
        <details class="theory-unit" data-group="${escapeHtml(unit.group)}" data-search="${escapeHtml(searchText)}" ${index === 0 ? "open" : ""}>
          <summary>
            <span><span class="unit-title">${escapeHtml(unit.title)}</span><span class="unit-summary">${formatText(unit.summary)}</span></span>
            <span class="unit-meta">${escapeHtml(unit.group)} · 연결 문제 ${linkedQuestions}<br>${escapeHtml(unit.source)}</span>
          </summary>
          <div class="unit-body"><div class="unit-grid">${sections}</div>${formulas}</div>
        </details>`;
    }).join("");

    const search = document.getElementById("theorySearch");
    function filterTheory() {
      const query = search.value.trim().toLowerCase();
      const group = groupSelect.value;
      let visible = 0;
      document.querySelectorAll(".theory-unit").forEach((unit) => {
        const matchesQuery = !query || unit.dataset.search.includes(query);
        const matchesGroup = group === "all" || unit.dataset.group === group;
        unit.hidden = !(matchesQuery && matchesGroup);
        if (!unit.hidden) visible += 1;
        if (query && !unit.hidden) unit.open = true;
      });
      let empty = list.querySelector(".empty-state");
      if (!visible && !empty) {
        empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "검색 결과가 없습니다.";
        list.appendChild(empty);
      } else if (visible && empty) empty.remove();
    }
    search.addEventListener("input", filterTheory);
    groupSelect.addEventListener("change", filterTheory);
    document.getElementById("openAllTheory").addEventListener("click", () => document.querySelectorAll(".theory-unit:not([hidden])").forEach((unit) => { unit.open = true; }));
    document.getElementById("closeAllTheory").addEventListener("click", () => document.querySelectorAll(".theory-unit").forEach((unit) => { unit.open = false; }));
  }

  function setupCalculator() {
    document.getElementById("addCalcRow").addEventListener("click", () => addCalcRow());
    document.getElementById("resetCalc").addEventListener("click", () => {
      state.calcRows = [];
      document.getElementById("calcRows").innerHTML = "";
      addCalcRow("d27");
      addCalcRow("d29");
    });
    addCalcRow("d27");
    addCalcRow("d29");
  }

  function designatedOptions(selectedId) {
    const groups = [...new Set(data.designated.map((item) => item.classNo))];
    return groups.map((group) => `<optgroup label="${group}">${data.designated.filter((item) => item.classNo === group).map((item) => `
      <option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${escapeHtml(item.name)} · ${item.amount.toLocaleString()} ${item.unit}</option>`).join("")}</optgroup>`).join("");
  }

  function addCalcRow(selectedId = "d1") {
    const id = `calc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.calcRows.push({ id, selectedId, actual: 0 });
    const row = document.createElement("tr");
    row.dataset.rowId = id;
    row.innerHTML = `
      <td><select class="select-input calc-item" aria-label="위험물 선택">${designatedOptions(selectedId)}</select></td>
      <td><input class="number-input calc-actual" type="number" min="0" step="any" value="" placeholder="0" aria-label="실제수량"></td>
      <td class="calc-designated"></td>
      <td><button class="icon-button calc-remove" type="button" title="행 삭제" aria-label="행 삭제">×</button></td>`;
    document.getElementById("calcRows").appendChild(row);
    row.querySelector(".calc-item").addEventListener("change", (event) => {
      state.calcRows.find((item) => item.id === id).selectedId = event.target.value;
      updateCalcRow(row);
      calculateDesignated();
    });
    row.querySelector(".calc-actual").addEventListener("input", (event) => {
      state.calcRows.find((item) => item.id === id).actual = Number(event.target.value) || 0;
      calculateDesignated();
    });
    row.querySelector(".calc-remove").addEventListener("click", () => {
      state.calcRows = state.calcRows.filter((item) => item.id !== id);
      row.remove();
      calculateDesignated();
    });
    updateCalcRow(row);
    calculateDesignated();
  }

  function updateCalcRow(row) {
    const model = state.calcRows.find((item) => item.id === row.dataset.rowId);
    const item = data.designated.find((entry) => entry.id === model.selectedId);
    row.querySelector(".calc-designated").textContent = `${item.amount.toLocaleString()} ${item.unit}`;
    row.querySelector(".calc-actual").setAttribute("aria-label", `실제수량 ${item.unit}`);
  }

  function calculateDesignated() {
    const parts = state.calcRows.map((row) => {
      const item = data.designated.find((entry) => entry.id === row.selectedId);
      return { item, actual: row.actual, ratio: row.actual / item.amount };
    }).filter((part) => part.actual > 0);
    const total = parts.reduce((sum, part) => sum + part.ratio, 0);
    const result = document.getElementById("calcResult");
    result.classList.remove("good", "danger");
    if (parts.length) result.classList.add(total >= 1 ? "danger" : "good");
    result.querySelector(".total").textContent = total.toFixed(3);
    result.querySelector("p").textContent = !parts.length ? "수량을 입력하면 자동 계산합니다." : total >= 1 ? "지정수량 이상입니다." : "지정수량 미만입니다.";
    document.getElementById("calcBreakdown").innerHTML = parts.map((part) => `<li>${escapeHtml(part.item.name)}: ${part.actual.toLocaleString()} / ${part.item.amount.toLocaleString()} = ${part.ratio.toFixed(3)}</li>`).join("");
  }

  function setupPractice() {
    document.querySelectorAll(".stage-button").forEach((button, index) => {
      const stage = button.dataset.stage;
      button.textContent = `${index + 1}. ${stageLabels[stage]} · ${data.questions[stage].length}`;
      button.addEventListener("click", () => {
        state.stage = stage;
        document.querySelectorAll(".stage-button").forEach((item) => item.setAttribute("aria-selected", String(item === button)));
        saveResume();
        renderQuestion();
      });
    });
    document.getElementById("resumePractice").addEventListener("click", () => {
      const index = resumeIndex(state.resume);
      if (index < 0) return;
      state.stage = state.resume.stage;
      state.indexes[state.stage] = index;
      document.querySelectorAll(".stage-button").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.stage === state.stage)));
      renderQuestion();
      document.getElementById("practiceTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("resetProgress").addEventListener("click", () => {
      if (!window.confirm(`${stageLabels[state.stage]} 단계의 학습 기록을 초기화할까요?`)) return;
      state.progress[state.stage] = { answers: {} };
      state.indexes[state.stage] = 0;
      saveProgress();
      saveResume();
      renderQuestion();
    });
    updateResumeButton();
    renderQuestion();
  }

  function topicName(unitId) {
    return data.theory.find((item) => item.id === unitId)?.title || unitId;
  }

  function oxOptionClass(value, question, saved) {
    if (!saved) return "";
    if (saved.value === value) return saved.correct ? "correct" : "wrong";
    return question.answer === value ? "correct" : "neutral";
  }

  function renderQuestion() {
    const stage = state.stage;
    const items = data.questions[stage];
    const index = Math.min(state.indexes[stage], items.length - 1);
    state.indexes[stage] = index;
    const question = items[index];
    const saved = state.progress[stage].answers[question.id];
    const card = document.getElementById("questionCard");

    let answerHtml = "";
    if (stage === "ox") {
      answerHtml = `<div class="answer-area ox-grid">
        <button class="answer-option ${oxOptionClass(true, question, saved)}" type="button" data-answer="true" ${saved ? "disabled" : ""}>O</button>
        <button class="answer-option ${oxOptionClass(false, question, saved)}" type="button" data-answer="false" ${saved ? "disabled" : ""}>X</button>
      </div>`;
    } else if (stage === "choice") {
      answerHtml = `<div class="answer-area">${question.options.map((option, optionIndex) => {
        const classes = ["answer-option"];
        if (saved && optionIndex === question.answer) classes.push("correct");
        if (saved && saved.value === optionIndex && optionIndex !== question.answer) classes.push("wrong");
        if (!saved && saved?.value === optionIndex) classes.push("selected");
        return `<button class="${classes.join(" ")}" type="button" data-answer="${optionIndex}" ${saved ? "disabled" : ""}>${optionIndex + 1}. ${formatText(option)}</button>`;
      }).join("")}</div>`;
    } else if (stage === "blank") {
      answerHtml = `<div class="answer-area">
        <input class="text-answer" id="blankAnswer" type="text" autocomplete="off" placeholder="정답 입력" value="${saved ? escapeHtml(saved.raw) : ""}" ${saved ? "disabled" : ""}>
        <button class="action-button primary" id="submitBlank" type="button" ${saved ? "disabled" : ""}>채점하기</button>
      </div>`;
    } else {
      answerHtml = `<div class="answer-area">
        <textarea class="model-answer" id="practicalDraft" placeholder="채점어를 포함해 직접 써 보세요." ${saved ? "disabled" : ""}>${saved ? escapeHtml(saved.raw || "") : ""}</textarea>
        <button class="action-button primary" id="revealPractical" type="button" ${saved ? "disabled" : ""}>모범답안 확인</button>
      </div>`;
    }

    const difficulty = stage === "practical" ? `<span class="badge ${question.difficulty === "상" ? "hot" : question.difficulty === "중" ? "often" : "base"}">난이도 ${question.difficulty}</span>` : "";
    card.innerHTML = `
      <div class="question-top"><span>${stageLabels[stage]} ${index + 1} / ${items.length}</span><span>${difficulty} ${escapeHtml(topicName(question.unit))}</span></div>
      <h3 class="question-title">${formatText(question.q)}</h3>
      ${answerHtml}
      <div id="feedbackArea">${saved ? feedbackHtml(stage, question, saved) : ""}</div>
      <div class="question-actions">
        <button class="action-button" id="prevQuestion" type="button" ${index === 0 ? "disabled" : ""}>이전 문제</button>
        <button class="action-button success" id="nextQuestion" type="button" ${index === items.length - 1 ? "disabled" : ""}>다음 문제</button>
      </div>`;

    card.querySelector("#prevQuestion").addEventListener("click", () => moveQuestion(-1));
    card.querySelector("#nextQuestion").addEventListener("click", () => moveQuestion(1));

    if (stage === "ox" && !saved) card.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitAnswer(question, button.dataset.answer === "true", button.textContent)));
    if (stage === "choice" && !saved) card.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitAnswer(question, Number(button.dataset.answer), button.textContent)));
    if (stage === "blank" && !saved) {
      const input = card.querySelector("#blankAnswer");
      card.querySelector("#submitBlank").addEventListener("click", () => submitBlank(question, input.value));
      input.addEventListener("keydown", (event) => { if (event.key === "Enter") submitBlank(question, input.value); });
    }
    if (stage === "practical" && !saved) card.querySelector("#revealPractical").addEventListener("click", () => submitPractical(question, card.querySelector("#practicalDraft").value));
    updateProgressPanel();
  }

  function moveQuestion(delta) {
    const items = data.questions[state.stage];
    state.indexes[state.stage] = Math.max(0, Math.min(items.length - 1, state.indexes[state.stage] + delta));
    saveResume();
    renderQuestion();
    document.getElementById("practiceTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitAnswer(question, value, raw) {
    const correct = value === question.answer;
    finishGradedAnswer(question, { value, raw, correct });
  }

  function submitBlank(question, raw) {
    if (!raw.trim()) return;
    const normalized = normalizeAnswer(raw);
    const correct = question.answers.some((answer) => normalizeAnswer(answer) === normalized);
    finishGradedAnswer(question, { value: normalized, raw, correct });
  }

  function finishGradedAnswer(question, answer) {
    state.progress[state.stage].answers[question.id] = answer;
    saveProgress();
    const items = data.questions[state.stage];
    const hasNextQuestion = state.indexes[state.stage] < items.length - 1;
    if (answer.correct && hasNextQuestion) moveQuestion(1);
    else {
      saveResume();
      renderQuestion();
    }
  }

  function submitPractical(question, raw) {
    state.progress.practical.answers[question.id] = { value: "revealed", raw, correct: true };
    saveProgress();
    saveResume();
    renderQuestion();
  }

  function feedbackHtml(stage, question, saved) {
    if (stage === "practical") return `
      <div class="feedback correct">
        <h4>모범답안</h4><p>${formatText(question.answer)}</p>
        <ul class="rubric">${question.rubric.map((item) => `<li>${formatText(item)}</li>`).join("")}</ul>
      </div>`;
    const answerText = stage === "ox" ? (question.answer ? "O" : "X") : stage === "choice" ? `${question.answer + 1}. ${question.options[question.answer]}` : question.answers.join(" / ");
    const submittedText = stage === "ox" ? (saved.value ? "O" : "X") : stage === "choice" ? `${saved.value + 1}. ${question.options[saved.value]}` : saved.raw;
    const explanation = stage === "ox" && question.answer
      ? `옳은 내용: ${question.q} ${question.explanation}`
      : question.explanation;
    if (!saved.correct) return `
      <div class="feedback wrong">
        <h4>오답 · 상세해설</h4>
        <p><strong>내 답:</strong> ${formatText(submittedText)}</p>
        <p><strong>정답:</strong> ${formatText(answerText)}</p>
        <p><strong>해설:</strong> ${formatText(explanation)}</p>
      </div>`;
    return `
      <div class="feedback correct">
        <h4>정답</h4>
        <p><strong>정답:</strong> ${formatText(answerText)}</p>
        <p>${formatText(explanation)}</p>
      </div>`;
  }

  function updateProgressPanel() {
    const stage = state.stage;
    const items = data.questions[stage];
    const answers = state.progress[stage].answers;
    const completed = Object.keys(answers).length;
    const correct = Object.values(answers).filter((answer) => answer.correct).length;
    const percent = Math.round((completed / items.length) * 100);
    document.getElementById("progressNumber").textContent = `${percent}%`;
    document.getElementById("progressBar").style.width = `${percent}%`;
    document.getElementById("progressList").innerHTML = `
      <div><span>현재 단계</span><strong>${stageLabels[stage]}</strong></div>
      <div><span>완료</span><strong>${completed} / ${items.length}</strong></div>
      <div><span>${stage === "practical" ? "답안 확인" : "정답"}</span><strong>${correct}</strong></div>
      <div><span>남은 문제</span><strong>${items.length - completed}</strong></div>`;
  }

  function renderAnalysis() {
    document.getElementById("analysisScope").textContent = data.analysis.scope;
    document.getElementById("patternBars").innerHTML = data.analysis.patterns.map((item) => `
      <div class="bar-row"><span>${escapeHtml(item.title)}</span><span class="bar-track" title="${escapeHtml(item.description)}"><span style="width:${item.share}%"></span></span><strong>${item.share}%</strong></div>`).join("");
    document.getElementById("difficultyBars").innerHTML = data.analysis.difficulty.map(([label, share, description]) => `
      <div class="bar-row"><span>난이도 ${label}</span><span class="bar-track" title="${escapeHtml(description)}"><span style="width:${share}%"></span></span><strong>${share}%</strong></div>`).join("");
    document.getElementById("priorityTable").innerHTML = data.analysis.priorities.map(([area, level, method]) => `
      <tr><td>${escapeHtml(area)}</td><td><span class="badge ${level === "최빈출" ? "hot" : "often"}">${level}</span></td><td>${escapeHtml(method)}</td></tr>`).join("");
    document.getElementById("answerRules").innerHTML = data.analysis.answerRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  }

  function boot() {
    if (!data) throw new Error("학습 데이터가 로드되지 않았습니다.");
    setupAuth();
    setupNavigation();
    renderTheory();
    setupCalculator();
    setupPractice();
    renderAnalysis();
    showSection("theory");
  }

  boot();
})();
