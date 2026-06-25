// ===== 상수 =====
const PASSWORD = '1234'; // 비밀번호를 여기서 변경하세요
const STORAGE_KEY = 'wrongAnswers';
const AUTH_KEY = 'authenticated';

// ===== 상태 =====
let examState = {
  answers: {},
  currentIndex: 0,
  timer: null,
  timeLeft: 3600,
  questions: [],
};

let practiceState = {
  subject: '',
  questions: [],
  currentIndex: 0,
  answered: {},
};

let wrongPracticeState = {
  questions: [],
  currentIndex: 0,
  answered: {},
};

// ===== 화면 전환 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== localStorage 오답 유틸 =====
function getWrongAnswers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveWrongAnswers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function addToWrongAnswers(ids) {
  const wrong = getWrongAnswers();
  ids.forEach(id => {
    if (!wrong[id]) wrong[id] = { count: 0, lastWrong: '' };
    wrong[id].count += 1;
    wrong[id].lastWrong = new Date().toISOString().slice(0, 10);
  });
  saveWrongAnswers(wrong);
}

// ===== 인증 =====
function checkAuth() {
  if (sessionStorage.getItem(AUTH_KEY) === 'true') {
    renderHome();
    showScreen('screen-home');
  } else {
    showScreen('screen-password');
  }
}

function handlePasswordSubmit() {
  const input = document.getElementById('password-input').value;
  const error = document.getElementById('password-error');
  if (input === PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    error.classList.add('hidden');
    renderHome();
    showScreen('screen-home');
  } else {
    error.classList.remove('hidden');
    document.getElementById('password-input').value = '';
  }
}

// ===== 홈 화면 =====
function renderHome() {
  document.getElementById('total-count').textContent = QUESTIONS.length;
  document.getElementById('wrong-count').textContent = Object.keys(getWrongAnswers()).length;
  document.getElementById('wrong-count-home').textContent = Object.keys(getWrongAnswers()).length;

  const subjects = ['가구제도', '가구재료', '가구공작'];
  subjects.forEach(s => {
    const el = document.getElementById('count-' + s);
    if (el) el.textContent = QUESTIONS.filter(q => q.subject === s).length + '문항';
  });
}

// ===== 실전모드 =====
function startExam() {
  examState.answers = {};
  examState.currentIndex = 0;
  examState.questions = [...QUESTIONS];
  examState.timeLeft = 3600;

  renderExamNav();
  renderExamQuestion(0);
  startExamTimer();
  showScreen('screen-exam');
}

function startExamTimer() {
  clearInterval(examState.timer);
  updateTimerDisplay();
  examState.timer = setInterval(() => {
    examState.timeLeft -= 1;
    updateTimerDisplay();
    if (examState.timeLeft <= 0) {
      clearInterval(examState.timer);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(examState.timeLeft / 60).toString().padStart(2, '0');
  const s = (examState.timeLeft % 60).toString().padStart(2, '0');
  const el = document.getElementById('exam-timer');
  el.textContent = m + ':' + s;
  if (examState.timeLeft <= 300) el.classList.add('warning');
  else el.classList.remove('warning');
}

function renderExamNav() {
  const nav = document.getElementById('question-nav');
  nav.innerHTML = '';
  examState.questions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-num';
    btn.textContent = i + 1;
    btn.addEventListener('click', () => {
      examState.currentIndex = i;
      renderExamQuestion(i);
    });
    nav.appendChild(btn);
  });
}

function updateExamNav() {
  const btns = document.querySelectorAll('.nav-num');
  btns.forEach((btn, i) => {
    btn.classList.toggle('answered', !!examState.answers[examState.questions[i].id]);
    btn.classList.toggle('current', i === examState.currentIndex);
  });
}

function renderExamQuestion(index) {
  const q = examState.questions[index];
  examState.currentIndex = index;

  document.getElementById('exam-subject').textContent = q.subject;
  document.getElementById('exam-number').textContent = (index + 1) + '번';
  document.getElementById('exam-question').textContent = q.question;
  document.getElementById('exam-progress').textContent = (index + 1) + ' / ' + examState.questions.length;

  const img = document.getElementById('exam-image');
  if (q.image) {
    img.src = q.image;
    img.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
  }

  const opts = document.getElementById('exam-options');
  opts.innerHTML = '';
  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (examState.answers[q.id] === i + 1) btn.classList.add('selected');
    btn.innerHTML = '<span>' + (i + 1) + '.</span> ' + text;
    btn.addEventListener('click', () => selectExamAnswer(q.id, i + 1));
    opts.appendChild(btn);
  });

  updateExamNav();

  document.getElementById('exam-prev-btn').disabled = index === 0;
  document.getElementById('exam-next-btn').disabled = index === examState.questions.length - 1;
}

function selectExamAnswer(qId, option) {
  examState.answers[qId] = option;
  const index = examState.questions.findIndex(q => q.id === qId);
  renderExamQuestion(index);
}

function moveExamQuestion(dir) {
  const next = examState.currentIndex + dir;
  if (next >= 0 && next < examState.questions.length) {
    renderExamQuestion(next);
  }
}

function submitExam() {
  clearInterval(examState.timer);

  const wrongIds = [];
  let correct = 0;
  const subjectStats = {};

  examState.questions.forEach(q => {
    if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, total: 0 };
    subjectStats[q.subject].total += 1;

    if (examState.answers[q.id] === q.answer) {
      correct += 1;
      subjectStats[q.subject].correct += 1;
    } else {
      wrongIds.push(q.id);
    }
  });

  const score = Math.round((correct / examState.questions.length) * 100);
  renderExamResult(score, wrongIds, subjectStats);
  showScreen('screen-exam-result');
}

function renderExamResult(score, wrongIds, subjectStats) {
  lastWrongIds = wrongIds;

  document.getElementById('result-score').textContent = score + '점';
  const passEl = document.getElementById('result-pass');
  passEl.textContent = score >= 60 ? '합격' : '불합격';
  passEl.className = 'pass-badge ' + (score >= 60 ? 'pass' : 'fail');

  const subjectEl = document.getElementById('subject-scores');
  subjectEl.innerHTML = '';
  Object.entries(subjectStats).forEach(([name, stat]) => {
    const pct = Math.round((stat.correct / stat.total) * 100);
    subjectEl.innerHTML += `
      <div class="subject-score-card">
        <div class="name">${name}</div>
        <div class="val">${pct}%</div>
        <div style="font-size:0.8rem;color:#9ca3af">${stat.correct}/${stat.total}</div>
      </div>`;
  });

  const wrongList = document.getElementById('result-wrong-list');
  wrongList.innerHTML = '';
  if (wrongIds.length === 0) {
    wrongList.innerHTML = '<p style="color:#16a34a">전부 정답!</p>';
  } else {
    wrongIds.forEach(id => {
      const q = QUESTIONS.find(q => q.id === id);
      const myAns = examState.answers[id];
      wrongList.innerHTML += `
        <div class="wrong-item">
          <div class="q-text">${q.question.slice(0, 60)}${q.question.length > 60 ? '...' : ''}</div>
          <div class="q-answer">
            내 답: <span>${myAns ? myAns + '. ' + q.options[myAns - 1] : '미답'}</span>
            &nbsp;|&nbsp; 정답: ${q.answer}. ${q.options[q.answer - 1]}
          </div>
        </div>`;
    });
  }
}

let lastWrongIds = [];

function addResultToWrong() {
  addToWrongAnswers(lastWrongIds);
  alert('오답노트에 추가되었습니다.');
}

// ===== 과목별 연습모드 =====
function renderPracticeSelect() {
  const subjects = ['가구제도', '가구재료', '가구공작'];
  subjects.forEach(s => {
    const el = document.getElementById('count-' + s);
    if (el) el.textContent = QUESTIONS.filter(q => q.subject === s).length + '문항';
  });
}

function startPractice(subject) {
  practiceState.subject = subject;
  practiceState.questions = QUESTIONS.filter(q => q.subject === subject);
  practiceState.currentIndex = 0;
  practiceState.answered = {};

  document.getElementById('practice-subject-title').textContent = subject;
  renderPracticeQuestion(0);
  showScreen('screen-practice');
}

function renderPracticeQuestion(index) {
  const q = practiceState.questions[index];
  practiceState.currentIndex = index;

  document.getElementById('practice-question').textContent = q.question;
  document.getElementById('practice-progress').textContent =
    (index + 1) + ' / ' + practiceState.questions.length;

  const img = document.getElementById('practice-image');
  if (q.image) {
    img.src = q.image;
    img.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
  }

  const fb = document.getElementById('practice-feedback');
  const exp = document.getElementById('practice-explanation');
  fb.classList.add('hidden');
  exp.classList.add('hidden');

  const opts = document.getElementById('practice-options');
  opts.innerHTML = '';
  const answered = practiceState.answered[q.id];

  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = '<span>' + (i + 1) + '.</span> ' + text;

    if (answered !== undefined) {
      btn.disabled = true;
      if (i + 1 === q.answer) btn.classList.add('correct');
      else if (i + 1 === answered) btn.classList.add('wrong');
    }

    btn.addEventListener('click', () => {
      if (practiceState.answered[q.id] !== undefined) return;
      practiceState.answered[q.id] = i + 1;
      const isCorrect = (i + 1 === q.answer);

      if (!isCorrect) addToWrongAnswers([q.id]);

      opts.querySelectorAll('.option-btn').forEach((b, bi) => {
        b.disabled = true;
        if (bi + 1 === q.answer) b.classList.add('correct');
        else if (bi + 1 === i + 1) b.classList.add('wrong');
      });

      fb.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.';
      fb.className = 'feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
      fb.classList.remove('hidden');

      if (q.explanation) {
        exp.textContent = '💡 해설: ' + q.explanation;
        exp.classList.remove('hidden');
      }
    });

    opts.appendChild(btn);
  });

  if (answered !== undefined) {
    const isCorrect = answered === q.answer;
    fb.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.';
    fb.className = 'feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
    fb.classList.remove('hidden');
    if (q.explanation) {
      exp.textContent = '💡 해설: ' + q.explanation;
      exp.classList.remove('hidden');
    }
  }

  document.getElementById('practice-prev-btn').disabled = index === 0;
  document.getElementById('practice-next-btn').disabled =
    index === practiceState.questions.length - 1;
}

function movePracticeQuestion(dir) {
  const next = practiceState.currentIndex + dir;
  if (next >= 0 && next < practiceState.questions.length) {
    renderPracticeQuestion(next);
  }
}

// ===== 오답노트 =====
function renderWrongNotes() {
  const wrong = getWrongAnswers();
  const ids = Object.keys(wrong).map(Number);
  const emptyEl = document.getElementById('wrong-notes-empty');
  const listEl = document.getElementById('wrong-notes-list');
  const practiceBtn = document.getElementById('wrong-notes-practice');
  const clearBtn = document.getElementById('wrong-notes-clear');

  listEl.innerHTML = '';
  if (ids.length === 0) {
    emptyEl.classList.remove('hidden');
    practiceBtn.disabled = true;
    clearBtn.disabled = true;
    return;
  }

  emptyEl.classList.add('hidden');
  practiceBtn.disabled = false;
  clearBtn.disabled = false;

  ids.forEach(id => {
    const q = QUESTIONS.find(q => q.id === id);
    if (!q) return;
    const data = wrong[id];
    listEl.innerHTML += `
      <div class="wrong-item">
        <div class="q-text"><strong>[${q.subject}]</strong> ${q.question.slice(0, 60)}${q.question.length > 60 ? '...' : ''}</div>
        <div class="q-answer">오답 ${data.count}회 | 마지막: ${data.lastWrong}</div>
      </div>`;
  });
}

function startWrongPractice() {
  const wrong = getWrongAnswers();
  const ids = Object.keys(wrong).map(Number);
  wrongPracticeState.questions = QUESTIONS.filter(q => ids.includes(q.id));
  wrongPracticeState.currentIndex = 0;
  wrongPracticeState.answered = {};

  if (wrongPracticeState.questions.length === 0) return;
  renderWrongPracticeQuestion(0);
  showScreen('screen-wrong-practice');
}

function renderWrongPracticeQuestion(index) {
  const q = wrongPracticeState.questions[index];
  wrongPracticeState.currentIndex = index;

  document.getElementById('wrong-practice-subject').textContent = q.subject;
  document.getElementById('wrong-practice-question').textContent = q.question;
  document.getElementById('wrong-practice-progress').textContent =
    (index + 1) + ' / ' + wrongPracticeState.questions.length;

  const img = document.getElementById('wrong-practice-image');
  if (q.image) {
    img.src = q.image;
    img.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
  }

  const fb = document.getElementById('wrong-practice-feedback');
  const exp = document.getElementById('wrong-practice-explanation');
  fb.classList.add('hidden');
  exp.classList.add('hidden');

  const opts = document.getElementById('wrong-practice-options');
  opts.innerHTML = '';
  const answered = wrongPracticeState.answered[q.id];

  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = '<span>' + (i + 1) + '.</span> ' + text;

    if (answered !== undefined) {
      btn.disabled = true;
      if (i + 1 === q.answer) btn.classList.add('correct');
      else if (i + 1 === answered) btn.classList.add('wrong');
    }

    btn.addEventListener('click', () => {
      if (wrongPracticeState.answered[q.id] !== undefined) return;
      wrongPracticeState.answered[q.id] = i + 1;
      const isCorrect = (i + 1 === q.answer);

      opts.querySelectorAll('.option-btn').forEach((b, bi) => {
        b.disabled = true;
        if (bi + 1 === q.answer) b.classList.add('correct');
        else if (bi + 1 === i + 1) b.classList.add('wrong');
      });

      fb.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.';
      fb.className = 'feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
      fb.classList.remove('hidden');

      if (q.explanation) {
        exp.textContent = '💡 해설: ' + q.explanation;
        exp.classList.remove('hidden');
      }
    });

    opts.appendChild(btn);
  });

  if (answered !== undefined) {
    const isCorrect = answered === q.answer;
    fb.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.';
    fb.className = 'feedback ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
    fb.classList.remove('hidden');
    if (q.explanation) {
      exp.textContent = '💡 해설: ' + q.explanation;
      exp.classList.remove('hidden');
    }
  }

  document.getElementById('wrong-practice-prev-btn').disabled = index === 0;
  document.getElementById('wrong-practice-next-btn').disabled =
    index === wrongPracticeState.questions.length - 1;
}

function moveWrongPracticeQuestion(dir) {
  const next = wrongPracticeState.currentIndex + dir;
  if (next >= 0 && next < wrongPracticeState.questions.length) {
    renderWrongPracticeQuestion(next);
  }
}

function clearWrongNotes() {
  if (!confirm('오답노트를 전부 초기화할까요?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderWrongNotes();
  renderHome();
}

// ===== 이벤트 바인딩 =====
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  // 비밀번호
  document.getElementById('password-btn').addEventListener('click', handlePasswordSubmit);
  document.getElementById('password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handlePasswordSubmit();
  });

  // 홈 버튼들
  document.getElementById('btn-exam').addEventListener('click', startExam);
  document.getElementById('btn-practice').addEventListener('click', () => {
    renderPracticeSelect();
    showScreen('screen-practice-select');
  });
  document.getElementById('btn-wrong').addEventListener('click', () => {
    renderWrongNotes();
    showScreen('screen-wrong-notes');
  });

  // 과목 선택
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => startPractice(btn.dataset.subject));
  });
  document.getElementById('practice-select-back').addEventListener('click', () => {
    renderHome(); showScreen('screen-home');
  });

  // 실전모드
  document.getElementById('exam-home-btn').addEventListener('click', () => {
    if (confirm('시험을 중단하고 홈으로 돌아갈까요?')) {
      clearInterval(examState.timer);
      renderHome(); showScreen('screen-home');
    }
  });
  document.getElementById('exam-prev-btn').addEventListener('click', () => moveExamQuestion(-1));
  document.getElementById('exam-next-btn').addEventListener('click', () => moveExamQuestion(1));
  document.getElementById('exam-submit-btn').addEventListener('click', submitExam);

  // 결과
  document.getElementById('result-add-wrong').addEventListener('click', addResultToWrong);
  document.getElementById('result-home').addEventListener('click', () => { renderHome(); showScreen('screen-home'); });

  // 과목 연습
  document.getElementById('practice-back').addEventListener('click', () => {
    renderPracticeSelect(); showScreen('screen-practice-select');
  });
  document.getElementById('practice-prev-btn').addEventListener('click', () => movePracticeQuestion(-1));
  document.getElementById('practice-next-btn').addEventListener('click', () => movePracticeQuestion(1));

  // 오답노트
  document.getElementById('wrong-notes-back').addEventListener('click', () => { renderHome(); showScreen('screen-home'); });
  document.getElementById('wrong-notes-practice').addEventListener('click', startWrongPractice);
  document.getElementById('wrong-notes-clear').addEventListener('click', clearWrongNotes);

  // 오답 풀기
  document.getElementById('wrong-practice-back').addEventListener('click', () => { renderWrongNotes(); showScreen('screen-wrong-notes'); });
  document.getElementById('wrong-practice-prev-btn').addEventListener('click', () => moveWrongPracticeQuestion(-1));
  document.getElementById('wrong-practice-next-btn').addEventListener('click', () => moveWrongPracticeQuestion(1));
});
