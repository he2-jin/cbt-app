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

// ===== 실전모드 (Task 4에서 구현) =====
function startExam() {}
function renderExamQuestion(index) {}
function moveExamQuestion(dir) {}
function submitExam() {}
let lastWrongIds = [];
function addResultToWrong() {}

// ===== 과목별 연습모드 (Task 5에서 구현) =====
function renderPracticeSelect() {}
function startPractice(subject) {}
function renderPracticeQuestion(index) {}
function movePracticeQuestion(dir) {}

// ===== 오답노트 (Task 6에서 구현) =====
function renderWrongNotes() {}
function startWrongPractice() {}
function renderWrongPracticeQuestion(index) {}
function moveWrongPracticeQuestion(dir) {}
function clearWrongNotes() {}

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
