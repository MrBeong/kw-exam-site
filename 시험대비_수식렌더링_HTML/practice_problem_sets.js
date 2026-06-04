(function () {
  "use strict";

  const SOLUTION_RE = /^(풀이|정답|모범답안|채점 포인트|해설|이유)\s*[:：]/;
  const INLINE_SOLUTION_RE = /(풀이|정답|모범답안|채점 포인트|해설|이유)\s*[:：]/;
  const PROBLEM_HEADING_RE = /^(문제\s*)?\d+[\.\)]\s*/;
  const ANSWER_RE = /정답\s*[:：]\s*([OXox○×]|\d+)/;
  const stateKey = "practice-problem-set:" + decodeURIComponent(location.pathname);
  const store = loadStore();
  let counter = 0;
  let toolbar;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.body.classList.add("practice-enabled");
    const main = ensureMain();

    enhanceHeadingProblems(main);
    enhanceListProblems(main);
    createToolbar(main);
    updateProgress();

    if (!document.querySelector("[data-practice-id]")) {
      const empty = document.createElement("div");
      empty.className = "practice-empty";
      empty.textContent = "아직 이 문제세트에는 문항이 거의 없습니다. 문제가 추가되면 자동으로 풀이형 카드가 붙습니다.";
      main.appendChild(empty);
    }

    if (!document.querySelector("mjx-container") && window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise().catch(function () {});
    }
  }

  function ensureMain() {
    let main = document.querySelector("main");
    if (main) {
      main.classList.add("practice-shell");
      return main;
    }

    main = document.createElement("main");
    main.className = "practice-shell";
    const movable = Array.from(document.body.childNodes).filter(function (node) {
      return !(node.nodeType === Node.ELEMENT_NODE && node.tagName === "SCRIPT");
    });
    document.body.prepend(main);
    movable.forEach(function (node) {
      main.appendChild(node);
    });
    return main;
  }

  function enhanceHeadingProblems(main) {
    const headings = Array.from(main.querySelectorAll("h3")).filter(function (heading) {
      return PROBLEM_HEADING_RE.test(cleanText(heading));
    });

    headings.forEach(function (heading) {
      if (heading.closest(".practice-card")) return;

      const card = document.createElement("section");
      card.className = "practice-card";
      card.dataset.practiceId = nextId();
      card.dataset.practiceLabel = "문항 " + counter;
      heading.before(card);
      card.appendChild(heading);

      const content = document.createElement("div");
      content.className = "practice-content";
      card.appendChild(content);

      let node = card.nextSibling;
      while (node && !isBoundaryHeading(node)) {
        const next = node.nextSibling;
        content.appendChild(node);
        node = next;
      }

      splitCardContent(card, content, "textarea");
    });
  }

  function enhanceListProblems(main) {
    const listItems = Array.from(main.querySelectorAll("ol > li, ul > li"));
    listItems.forEach(function (li) {
      if (li.closest(".practice-card") || li.closest(".solution-panel")) return;
      if (li.dataset.practiceProcessed === "1") return;
      if (SOLUTION_RE.test(cleanText(li))) return;

      const solutionLists = Array.from(li.children).filter(isSolutionList);
      const hasInline = INLINE_SOLUTION_RE.test(cleanText(li));
      if (!solutionLists.length && !hasInline) return;

      li.dataset.practiceProcessed = "1";
      li.dataset.practiceId = nextId();
      li.dataset.practiceLabel = "문항 " + counter;
      li.classList.add("practice-list-item");

      if (solutionLists.length) {
        const solutionText = solutionLists.map(cleanText).join(" ");
        const correctAnswer = extractCorrectAnswer(solutionText);
        const optionList = findOptionList(li);
        const answerBox = createSmartAnswerBox(li, li.dataset.practiceId, correctAnswer, optionList);
        const solution = createSolutionPanel(li.dataset.practiceId);
        solutionLists.forEach(function (node) {
          solution.appendChild(node);
        });
        li.appendChild(answerBox);
        li.appendChild(solution);
        appendActions(answerBox, solution, li.dataset.practiceId);
        return;
      }

      splitInlineSolution(li);
    });
  }

  function splitCardContent(card, content, inputType) {
    const question = document.createElement("div");
    question.className = "practice-question";
    const solution = createSolutionPanel(card.dataset.practiceId);

    const nodes = Array.from(content.childNodes);
    const splitIndex = nodes.findIndex(function (node) {
      return node.nodeType === Node.ELEMENT_NODE && SOLUTION_RE.test(cleanText(node));
    });
    const answerBox = createAnswerBox(card.dataset.practiceId, inputType);

    content.textContent = "";
    const point = splitIndex === -1 ? nodes.length : splitIndex;
    nodes.slice(0, point).forEach(function (node) {
      question.appendChild(node);
    });
    nodes.slice(point).forEach(function (node) {
      solution.appendChild(node);
    });

    content.appendChild(question);
    content.appendChild(answerBox);
    if (solution.childNodes.length) {
      content.appendChild(solution);
      appendActions(answerBox, solution, card.dataset.practiceId);
    } else {
      appendActions(answerBox, null, card.dataset.practiceId);
    }
  }

  function splitInlineSolution(li) {
    const html = li.innerHTML;
    const match = html.match(INLINE_SOLUTION_RE);
    if (!match || match.index === undefined || match.index <= 0) return;

    const before = html.slice(0, match.index).trim();
    const after = html.slice(match.index).trim();
    const answerBox = createAnswerBox(li.dataset.practiceId, "input");
    const solution = createSolutionPanel(li.dataset.practiceId);
    solution.innerHTML = after;

    li.innerHTML = before;
    li.appendChild(answerBox);
    li.appendChild(solution);
    appendActions(answerBox, solution, li.dataset.practiceId);
  }

  function createAnswerBox(id, type) {
    const box = document.createElement("div");
    box.className = "practice-answerbox";

    const label = document.createElement("label");
    label.textContent = "내 답안";
    const saved = document.createElement("span");
    saved.className = "practice-saved";
    saved.textContent = "자동 저장";
    label.appendChild(saved);

    const field = type === "input" ? document.createElement("input") : document.createElement("textarea");
    if (type === "input") {
      field.type = "text";
      field.placeholder = "답만 간단히 입력";
    } else {
      field.placeholder = "풀이 과정이나 암기 답안을 직접 적어보기";
    }
    field.value = store[id] && store[id].answer ? store[id].answer : "";
    field.addEventListener("input", function () {
      patchStore(id, { answer: field.value });
      updateProgress();
    });

    box.appendChild(label);
    box.appendChild(field);
    return box;
  }

  function createSmartAnswerBox(li, id, correctAnswer, optionList) {
    if (isOxAnswer(correctAnswer)) {
      return createChoiceAnswerBox(id, ["O", "X"], correctAnswer);
    }

    if (optionList && isNumericAnswer(correctAnswer)) {
      enhanceOptionList(optionList, id, correctAnswer);
      return createChoiceStatusBox(id, correctAnswer);
    }

    return createAnswerBox(id, "input");
  }

  function createChoiceAnswerBox(id, choices, correctAnswer) {
    const box = createChoiceShell(id, "선택 답안");
    const grid = document.createElement("div");
    grid.className = "practice-choice-grid";

    choices.forEach(function (choice) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "practice-choice";
      button.textContent = choice;
      button.dataset.choiceValue = choice;
      button.addEventListener("click", function () {
        selectChoice(id, box, choice, correctAnswer);
      });
      grid.appendChild(button);
    });

    box.appendChild(grid);
    restoreChoiceState(id, box, correctAnswer);
    return box;
  }

  function createChoiceStatusBox(id, correctAnswer) {
    const box = createChoiceShell(id, "선택 답안");
    const hint = document.createElement("p");
    hint.className = "practice-choice-hint";
    hint.textContent = "보기 번호를 클릭해서 답을 고르기";
    box.appendChild(hint);
    restoreChoiceState(id, document, correctAnswer);
    restoreChoiceState(id, box, correctAnswer);
    return box;
  }

  function createChoiceShell(id, labelText) {
    const box = document.createElement("div");
    box.className = "practice-answerbox practice-choicebox";
    box.dataset.choiceBoxFor = id;

    const label = document.createElement("label");
    label.textContent = labelText;
    const saved = document.createElement("span");
    saved.className = "practice-saved";
    saved.textContent = "자동 저장";
    label.appendChild(saved);

    const feedback = document.createElement("div");
    feedback.className = "practice-feedback";
    feedback.setAttribute("aria-live", "polite");

    box.appendChild(label);
    box.appendChild(feedback);
    return box;
  }

  function enhanceOptionList(optionList, id, correctAnswer) {
    optionList.classList.add("practice-option-list");
    Array.from(optionList.children).forEach(function (option, index) {
      if (option.tagName !== "LI") return;
      const value = String(index + 1);
      option.classList.add("practice-option-choice");
      option.dataset.choiceValue = value;
      option.tabIndex = 0;
      option.setAttribute("role", "button");
      option.setAttribute("aria-pressed", "false");
      option.addEventListener("click", function () {
        selectChoice(id, optionList, value, correctAnswer);
      });
      option.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectChoice(id, optionList, value, correctAnswer);
      });
    });
    restoreChoiceState(id, optionList, correctAnswer);
  }

  function selectChoice(id, root, value, correctAnswer) {
    const normalized = normalizeChoice(value);
    patchStore(id, { answer: normalized });
    paintChoiceState(id, normalized, correctAnswer);
    updateProgress();
  }

  function restoreChoiceState(id, root, correctAnswer) {
    const saved = store[id] && store[id].answer ? store[id].answer : "";
    if (!saved) return;
    paintChoiceState(id, saved, correctAnswer, root);
  }

  function paintChoiceState(id, value, correctAnswer, root) {
    const normalized = normalizeChoice(value);
    const normalizedCorrect = normalizeChoice(correctAnswer);
    let targets = Array.from(document.querySelectorAll('[data-practice-id="' + id + '"] [data-choice-value], [data-choice-box-for="' + id + '"] [data-choice-value]'));
    if (root && root !== document && typeof root.querySelectorAll === "function") {
      targets = targets.concat(Array.from(root.querySelectorAll("[data-choice-value]")));
    }
    targets = Array.from(new Set(targets));
    targets.forEach(function (node) {
      const isSelected = normalizeChoice(node.dataset.choiceValue) === normalized;
      const isCorrect = normalizedCorrect && normalizeChoice(node.dataset.choiceValue) === normalizedCorrect;
      node.classList.toggle("is-selected", isSelected);
      node.classList.toggle("is-correct", isSelected && isCorrect);
      node.classList.toggle("is-wrong", isSelected && normalizedCorrect && !isCorrect);
      if (node.getAttribute("role") === "button") {
        node.setAttribute("aria-pressed", String(isSelected));
      }
    });

    let feedbacks = Array.from(document.querySelectorAll('[data-practice-id="' + id + '"] .practice-feedback, [data-choice-box-for="' + id + '"] .practice-feedback'));
    if (root && root !== document && typeof root.querySelectorAll === "function") {
      feedbacks = feedbacks.concat(Array.from(root.querySelectorAll(".practice-feedback")));
    }
    feedbacks = Array.from(new Set(feedbacks));
    feedbacks.forEach(function (feedback) {
      if (!normalized) {
        feedback.textContent = "";
        feedback.className = "practice-feedback";
        return;
      }
      if (!normalizedCorrect) {
        feedback.textContent = "선택: " + normalized;
        feedback.className = "practice-feedback";
        return;
      }
      const correct = normalized === normalizedCorrect;
      feedback.textContent = correct ? "정답" : "오답";
      feedback.className = "practice-feedback " + (correct ? "is-correct" : "is-wrong");
    });
  }

  function appendActions(answerBox, solution, id) {
    const row = document.createElement("div");
    row.className = "practice-row";

    if (solution) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "practice-button primary";
      toggle.textContent = "모범답안 보기";
      toggle.addEventListener("click", function () {
        const open = solution.classList.toggle("is-open");
        toggle.textContent = open ? "모범답안 숨기기" : "모범답안 보기";
      });
      row.appendChild(toggle);
    }

    const doneLabel = document.createElement("label");
    doneLabel.className = "practice-done";
    const done = document.createElement("input");
    done.type = "checkbox";
    done.checked = Boolean(store[id] && store[id].done);
    done.addEventListener("change", function () {
      patchStore(id, { done: done.checked });
      updateProgress();
    });
    doneLabel.appendChild(done);
    doneLabel.appendChild(document.createTextNode("풀었음"));
    row.appendChild(doneLabel);

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "practice-button";
    clear.textContent = "내 답 지우기";
    clear.addEventListener("click", function () {
      const field = answerBox.querySelector("textarea, input[type='text']");
      if (field) field.value = "";
      answerBox.querySelectorAll("[data-choice-value]").forEach(function (node) {
        node.classList.remove("is-selected", "is-correct", "is-wrong");
        if (node.getAttribute("role") === "button") {
          node.setAttribute("aria-pressed", "false");
        }
      });
      const owner = answerBox.closest("[data-practice-id]");
      if (owner) {
        owner.querySelectorAll("[data-choice-value]").forEach(function (node) {
          node.classList.remove("is-selected", "is-correct", "is-wrong");
          if (node.getAttribute("role") === "button") {
            node.setAttribute("aria-pressed", "false");
          }
        });
      }
      answerBox.querySelectorAll(".practice-feedback").forEach(function (feedback) {
        feedback.textContent = "";
        feedback.className = "practice-feedback";
      });
      patchStore(id, { answer: "" });
      updateProgress();
    });
    row.appendChild(clear);

    answerBox.appendChild(row);
  }

  function createSolutionPanel(id) {
    const panel = document.createElement("div");
    panel.className = "solution-panel";
    panel.dataset.solutionFor = id;
    return panel;
  }

  function createToolbar(main) {
    toolbar = document.createElement("div");
    toolbar.className = "practice-appbar";

    const status = document.createElement("div");
    status.className = "practice-status";
    status.innerHTML = '<span class="practice-pill" data-progress>0 / 0</span><span data-detail>답안 작성 0개, 완료 0개</span>';

    const controls = document.createElement("div");
    controls.className = "practice-controls";

    const search = document.createElement("input");
    search.className = "practice-search";
    search.type = "search";
    search.placeholder = "문항 검색";
    search.addEventListener("input", function () {
      filterProblems(search.value);
    });

    const showAll = document.createElement("button");
    showAll.type = "button";
    showAll.className = "practice-button";
    showAll.textContent = "답안 모두 보기";
    showAll.addEventListener("click", function () {
      document.querySelectorAll(".solution-panel").forEach(function (panel) {
        panel.classList.add("is-open");
      });
      document.querySelectorAll(".practice-row .primary").forEach(function (button) {
        button.textContent = "모범답안 숨기기";
      });
    });

    const hideAll = document.createElement("button");
    hideAll.type = "button";
    hideAll.className = "practice-button";
    hideAll.textContent = "답안 모두 숨기기";
    hideAll.addEventListener("click", function () {
      document.querySelectorAll(".solution-panel").forEach(function (panel) {
        panel.classList.remove("is-open");
      });
      document.querySelectorAll(".practice-row .primary").forEach(function (button) {
        button.textContent = "모범답안 보기";
      });
    });

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "practice-button danger";
    reset.textContent = "작성 초기화";
    reset.addEventListener("click", function () {
      if (!confirm("이 페이지의 작성 답안과 풀었음 표시를 지울까요?")) return;
      localStorage.removeItem(stateKey);
      document.querySelectorAll(".practice-answerbox textarea, .practice-answerbox input[type='text']").forEach(function (field) {
        field.value = "";
      });
      document.querySelectorAll("[data-choice-value]").forEach(function (node) {
        node.classList.remove("is-selected", "is-correct", "is-wrong");
        if (node.getAttribute("role") === "button") {
          node.setAttribute("aria-pressed", "false");
        }
      });
      document.querySelectorAll(".practice-feedback").forEach(function (feedback) {
        feedback.textContent = "";
        feedback.className = "practice-feedback";
      });
      document.querySelectorAll(".practice-done input").forEach(function (box) {
        box.checked = false;
      });
      Object.keys(store).forEach(function (key) {
        delete store[key];
      });
      updateProgress();
    });

    controls.appendChild(search);
    controls.appendChild(showAll);
    controls.appendChild(hideAll);
    controls.appendChild(reset);

    toolbar.appendChild(status);
    toolbar.appendChild(controls);

    const title = main.querySelector("h1");
    if (title && title.nextSibling) {
      title.after(toolbar);
    } else {
      main.prepend(toolbar);
    }
  }

  function filterProblems(query) {
    const needle = query.trim().toLowerCase();
    document.querySelectorAll("[data-practice-id]").forEach(function (node) {
      const hit = !needle || cleanText(node).toLowerCase().includes(needle);
      node.classList.toggle("practice-hidden-by-search", !hit);
    });
  }

  function updateProgress() {
    if (!toolbar) return;
    const items = Array.from(document.querySelectorAll("[data-practice-id]"));
    const answered = items.filter(function (item) {
      const field = item.querySelector(".practice-answerbox textarea, .practice-answerbox input[type='text']");
      if (field && field.value.trim()) return true;
      const id = item.dataset.practiceId;
      return Boolean(store[id] && store[id].answer && String(store[id].answer).trim());
    }).length;
    const done = items.filter(function (item) {
      const box = item.querySelector(".practice-done input");
      return box && box.checked;
    }).length;

    const progress = toolbar.querySelector("[data-progress]");
    const detail = toolbar.querySelector("[data-detail]");
    progress.textContent = done + " / " + items.length;
    detail.textContent = "답안 작성 " + answered + "개, 완료 " + done + "개";
  }

  function isBoundaryHeading(node) {
    return node.nodeType === Node.ELEMENT_NODE && /^(H1|H2|H3)$/.test(node.tagName);
  }

  function isSolutionList(node) {
    if (node.nodeType !== Node.ELEMENT_NODE || !/^(UL|OL)$/.test(node.tagName)) return false;
    return Array.from(node.children).some(function (child) {
      return child.tagName === "LI" && SOLUTION_RE.test(cleanText(child));
    });
  }

  function findOptionList(li) {
    return Array.from(li.children).find(function (node) {
      return node.nodeType === Node.ELEMENT_NODE && node.tagName === "OL" && !isSolutionList(node);
    });
  }

  function extractCorrectAnswer(text) {
    const match = cleanAnswerText(text).match(ANSWER_RE);
    return match ? normalizeChoice(match[1]) : "";
  }

  function cleanAnswerText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function isOxAnswer(value) {
    return /^(O|X)$/.test(normalizeChoice(value));
  }

  function isNumericAnswer(value) {
    return /^\d+$/.test(normalizeChoice(value));
  }

  function normalizeChoice(value) {
    const text = String(value || "").trim().toUpperCase();
    if (text === "○") return "O";
    if (text === "×") return "X";
    return text;
  }

  function cleanText(node) {
    return (node.textContent || "").replace(/\s+/g, " ").trim();
  }

  function nextId() {
    counter += 1;
    return "q" + String(counter).padStart(4, "0");
  }

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(stateKey) || "{}");
    } catch (_error) {
      return {};
    }
  }

  function patchStore(id, patch) {
    store[id] = Object.assign({}, store[id] || {}, patch);
    localStorage.setItem(stateKey, JSON.stringify(store));
  }
})();
