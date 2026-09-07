/* ---------- Question pools ---------- */

const BASIC_QUESTIONS = [
  { q: "What color is the sky on a clear day?", options: ["Blue", "Green", "Purple", "Orange"], correct: 0 },
  { q: "What color is grass?", options: ["Green", "Blue", "Red", "Yellow"], correct: 0 },
  { q: "How many days are in a week?", options: ["7", "5", "10", "3"], correct: 0 },
  { q: "What do bees make?", options: ["Honey", "Milk", "Bread", "Oil"], correct: 0 },
  { q: "Which shape has three sides?", options: ["Triangle", "Square", "Circle", "Hexagon"], correct: 0 },
  { q: "What color is a ripe banana, typically?", options: ["Yellow", "Purple", "Blue", "Black"], correct: 0 },
  { q: "How many legs does a dog have?", options: ["4", "2", "6", "3"], correct: 0 },
  { q: "What color is an apple, typically?", options: ["Red", "Blue", "Purple", "Grey"], correct: 0 },
  { q: "How many hours are in a day?", options: ["24", "12", "48", "60"], correct: 0 },
  { q: "What is 2 + 2?", options: ["4", "3", "5", "22"], correct: 0 },
  { q: "What do fish live in?", options: ["Water", "Trees", "Sand", "Clouds"], correct: 0 },
  { q: "What color is snow?", options: ["White", "Black", "Red", "Green"], correct: 0 },
  { q: "Which of these is a fruit?", options: ["Apple", "Chair", "Rock", "Cloud"], correct: 0 },
  { q: "What color is the sun as it appears in the sky?", options: ["Yellow", "Blue", "Green", "Black"], correct: 0 },
  { q: "How many months are in a year?", options: ["12", "10", "24", "6"], correct: 0 },
];

// Flagged "horror" questions — visually glitched, but still a single graded correct answer.
const HORROR_QUESTIONS = [
  { q: "How many people are in the room with you right now?", options: ["1", "2", "0", "More than you think"], correct: 0, horror: true },
  { q: "What color was the sky the last time you actually looked at it?", options: ["Blue", "Green", "Purple", "It wasn't the sky"], correct: 0, horror: true },
  { q: "Repeat the number: SEVEN. What number did you just say?", options: ["Seven", "Eight", "Six", "I didn't say anything"], correct: 0, horror: true },
  { q: "You have always been taking this test. True or false?", options: ["False", "True", "False", "Ask again"], correct: 0, horror: true },
  { q: "Something behind you just moved. What do you do?", options: ["Keep answering", "Turn around", "Turn around", "Turn around"], correct: 0, horror: true },
  { q: "This question has already been asked of you once. What is 3 + 1?", options: ["4", "4", "4", "5"], correct: 0, horror: true },
  { q: "Confirm: is this your first attempt?", options: ["Yes", "No", "Unknown", "Stop asking"], correct: 0, horror: true },
];

const TOTAL_QUESTIONS = 11;
const PASS_THRESHOLD = Math.ceil(TOTAL_QUESTIONS * 0.9); // 10 of 11

/* ---------- State ---------- */

const state = {
  name: "",
  age: "",
  questions: [],
  index: 0,
  answers: [],
  selectedOption: null,
};

/* ---------- Helpers ---------- */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestionSet() {
  const horrorCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const basicCount = TOTAL_QUESTIONS - horrorCount;

  const basics = shuffle(BASIC_QUESTIONS).slice(0, basicCount);
  const horrors = shuffle(HORROR_QUESTIONS).slice(0, horrorCount);

  let combined = shuffle([...basics, ...horrors]);

  // Keep the very first question non-horror so the test opens normally.
  if (combined[0].horror) {
    const firstBasicIdx = combined.findIndex((item) => !item.horror);
    if (firstBasicIdx > 0) {
      [combined[0], combined[firstBasicIdx]] = [combined[firstBasicIdx], combined[0]];
    }
  }

  // Also shuffle each question's own option order, keeping track of the correct answer.
  combined = combined.map((item) => {
    const optionObjs = item.options.map((text, i) => ({ text, isCorrect: i === item.correct }));
    const shuffledOptions = shuffle(optionObjs);
    return {
      q: item.q,
      horror: !!item.horror,
      options: shuffledOptions.map((o) => o.text),
      correctIndex: shuffledOptions.findIndex((o) => o.isCorrect),
    };
  });

  return combined;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.removeAttribute("data-active"));
  document.getElementById(id).setAttribute("data-active", "true");
}

function flashStatic() {
  const overlay = document.getElementById("static-overlay");
  overlay.classList.add("on");
  setTimeout(() => overlay.classList.remove("on"), 90);
  setTimeout(() => overlay.classList.add("on"), 220);
  setTimeout(() => overlay.classList.remove("on"), 260);
}

/* ---------- Landing / Register ---------- */

document.getElementById("btn-start").addEventListener("click", () => {
  showScreen("screen-register");
});

document.getElementById("btn-begin").addEventListener("click", () => {
  const nameInput = document.getElementById("input-name");
  const ageInput = document.getElementById("input-age");
  const error = document.getElementById("register-error");

  const name = nameInput.value.trim();
  const age = ageInput.value.trim();

  if (!name) {
    error.textContent = "Enter your name to continue.";
    return;
  }
  if (!age || Number(age) < 1 || Number(age) > 120) {
    error.textContent = "Enter a valid age to continue.";
    return;
  }

  error.textContent = "";
  state.name = name;
  state.age = age;
  state.questions = buildQuestionSet();
  state.index = 0;
  state.answers = [];

  showScreen("screen-quiz");
  renderQuestion();
});

/* ---------- Quiz ---------- */

function renderQuestion() {
  const item = state.questions[state.index];
  const panel = document.getElementById("quiz-panel");
  const label = document.getElementById("quiz-progress-label");
  const fill = document.getElementById("progress-fill");
  const qText = document.getElementById("question-text");
  const list = document.getElementById("options-list");
  const nextBtn = document.getElementById("btn-next");

  label.textContent = `Question ${state.index + 1} of ${TOTAL_QUESTIONS}`;
  fill.style.width = `${(state.index / TOTAL_QUESTIONS) * 100}%`;
  qText.textContent = item.q;
  list.innerHTML = "";
  nextBtn.disabled = true;
  state.selectedOption = null;

  panel.classList.remove("glitch");
  if (item.horror) {
    // brief delay so it lands just as the question renders
    requestAnimationFrame(() => {
      panel.classList.add("glitch");
      flashStatic();
    });
  }

  item.options.forEach((optionText, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.type = "button";
    btn.textContent = optionText;
    btn.addEventListener("click", () => {
      list.querySelectorAll(".option").forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
      state.selectedOption = i;
      nextBtn.disabled = false;
    });
    list.appendChild(btn);
  });
}

document.getElementById("btn-next").addEventListener("click", () => {
  const item = state.questions[state.index];
  state.answers.push(state.selectedOption === item.correctIndex);

  if (state.index < TOTAL_QUESTIONS - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    finishQuiz();
  }
});

function finishQuiz() {
  const correct = state.answers.filter(Boolean).length;
  const percent = Math.round((correct / TOTAL_QUESTIONS) * 100);
  const passed = correct >= PASS_THRESHOLD;

  document.getElementById("quiz-panel").classList.remove("glitch");

  if (passed) {
    document.getElementById("pass-summary").textContent =
      `${correct} of ${TOTAL_QUESTIONS} correct — ${percent}%. Certificate generated below.`;
    showScreen("screen-pass");
    drawCertificate({ name: state.name, age: state.age, percent, correct });
  } else {
    document.getElementById("fail-summary").textContent =
      `${correct} of ${TOTAL_QUESTIONS} correct — ${percent}%. A score of at least ${Math.round((PASS_THRESHOLD / TOTAL_QUESTIONS) * 100)}% is required.`;
    document.getElementById("fail-flavor").textContent =
      hadHorror(state.questions) ? "The Assessment has recorded this attempt." : "You may try again at any time.";
    showScreen("screen-fail");
  }
}

function hadHorror(questions) {
  return questions.some((q) => q.horror);
}

/* ---------- Restart ---------- */

function restart() {
  state.name = "";
  state.age = "";
  state.questions = [];
  state.index = 0;
  state.answers = [];
  document.getElementById("input-name").value = "";
  document.getElementById("input-age").value = "";
  document.getElementById("register-error").textContent = "";
  showScreen("screen-landing");
}

document.getElementById("btn-restart-pass").addEventListener("click", restart);
document.getElementById("btn-restart-fail").addEventListener("click", restart);

/* ---------- Certificate rendering ---------- */

function certId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XCRT-${t}-${r}`;
}

let lastCertId = "";

function drawCertificate({ name, age, percent, correct }) {
  const canvas = document.getElementById("cert-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  lastCertId = certId();

  // Background
  ctx.fillStyle = "#F7F3E9";
  ctx.fillRect(0, 0, W, H);

  // Subtle paper texture (grain)
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }

  // Outer border
  ctx.strokeStyle = "#1E2A33";
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Inner hairline border
  ctx.strokeStyle = "#C9A24B";
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // Corner flourish ticks
  ctx.strokeStyle = "#1E2A33";
  ctx.lineWidth = 2;
  const corners = [[46, 46, 1, 1], [W - 46, 46, -1, 1], [46, H - 46, 1, -1], [W - 46, H - 46, -1, -1]];
  corners.forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 26);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 26, y);
    ctx.stroke();
  });

  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = "#5C6B78";
  ctx.font = "500 20px 'IBM Plex Sans', sans-serif";
  ctx.fillText("XICRYT ASSESSMENT PORTAL", W / 2, 130);

  // Title
  ctx.fillStyle = "#1E2A33";
  ctx.font = "700 64px 'Source Serif 4', serif";
  ctx.fillText("Certificate of Completion", W / 2, 210);

  // Divider
  ctx.strokeStyle = "#C9A24B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90, 240);
  ctx.lineTo(W / 2 + 90, 240);
  ctx.stroke();

  // Body copy
  ctx.fillStyle = "#3B4652";
  ctx.font = "400 24px 'IBM Plex Sans', sans-serif";
  ctx.fillText("This certifies that", W / 2, 310);

  // Name
  ctx.fillStyle = "#1E2A33";
  ctx.font = "700 58px 'Source Serif 4', serif";
  const displayName = name.length > 28 ? name.slice(0, 28) + "…" : name;
  ctx.fillText(displayName, W / 2, 385);

  // Underline beneath name
  const nameWidth = Math.min(ctx.measureText(displayName).width + 40, 900);
  ctx.strokeStyle = "#1E2A33";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2, 405);
  ctx.lineTo(W / 2 + nameWidth / 2, 405);
  ctx.stroke();

  // Age line
  ctx.fillStyle = "#5C6B78";
  ctx.font = "400 20px 'IBM Plex Sans', sans-serif";
  ctx.fillText(`Age at time of assessment: ${age}`, W / 2, 440);

  // Body copy 2
  ctx.fillStyle = "#3B4652";
  ctx.font = "400 24px 'IBM Plex Sans', sans-serif";
  ctx.fillText("has successfully completed the Xicryt Certification Assessment", W / 2, 495);
  ctx.fillText(`with a score of ${percent}% (${correct} of ${TOTAL_QUESTIONS} correct)`, W / 2, 528);

  // Seal
  const sealX = W / 2;
  const sealY = 660;
  const sealR = 78;
  const grad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealR);
  grad.addColorStop(0, "#E7D9B0");
  grad.addColorStop(1, "#C9A24B");
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8C6D22";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR - 12, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#8C6D22";
  ctx.stroke();

  ctx.fillStyle = "#4A3A0F";
  ctx.font = "700 18px 'IBM Plex Sans', sans-serif";
  ctx.fillText("XICRYT", sealX, sealY - 4);
  ctx.font = "500 13px 'IBM Plex Sans', sans-serif";
  ctx.fillText("CERTIFIED", sealX, sealY + 16);

  // Footer: date, signature, cert id
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  ctx.textAlign = "left";
  ctx.fillStyle = "#1E2A33";
  ctx.font = "400 18px 'IBM Plex Mono', monospace";
  ctx.fillText(dateStr, 130, 800);
  ctx.strokeStyle = "#1E2A33";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 770);
  ctx.lineTo(360, 770);
  ctx.stroke();
  ctx.fillStyle = "#5C6B78";
  ctx.font = "400 14px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Date issued", 130, 820);

  ctx.textAlign = "right";
  ctx.fillStyle = "#1E2A33";
  ctx.font = "italic 26px 'Source Serif 4', serif";
  ctx.fillText("Director of Assessment", W - 130, 795);
  ctx.strokeStyle = "#1E2A33";
  ctx.beginPath();
  ctx.moveTo(W - 360, 770);
  ctx.lineTo(W - 130, 770);
  ctx.stroke();
  ctx.fillStyle = "#5C6B78";
  ctx.font = "400 14px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Xicryt Certification Board", W - 130, 820);

  ctx.textAlign = "center";
  ctx.fillStyle = "#8A93A0";
  ctx.font = "400 15px 'IBM Plex Mono', monospace";
  ctx.fillText(`Certificate ID: ${lastCertId}`, W / 2, 1080);
}

/* ---------- Downloads ---------- */

document.getElementById("btn-download-png").addEventListener("click", () => {
  const canvas = document.getElementById("cert-canvas");
  const link = document.createElement("a");
  link.download = `xicryt-certificate-${lastCertId || "certificate"}.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
});

document.getElementById("btn-download-pdf").addEventListener("click", () => {
  const canvas = document.getElementById("cert-canvas");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save(`xicryt-certificate-${lastCertId || "certificate"}.pdf`);
});
