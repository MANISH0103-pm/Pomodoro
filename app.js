/* ===================================================================
   Pomodoro Timer — Application Logic
   =================================================================== */

(() => {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────
  const WORK_MINUTES      = 40;
  const SHORT_BREAK_MIN   = 10;
  const LONG_BREAK_MIN    = 20;
  const POMODOROS_BEFORE_LONG = 4;

  const CIRCUMFERENCE = 2 * Math.PI * 120;  // matches SVG r=120

  // ── Phase definitions ──────────────────────────────────────────────
  const Phase = Object.freeze({
    WORK:        'WORK',
    SHORT_BREAK: 'SHORT_BREAK',
    LONG_BREAK:  'LONG_BREAK',
  });

  const phaseInfo = {
    [Phase.WORK]:        { label: 'Focus Time',  minutes: WORK_MINUTES,    cssVar: '--work-accent',  glow: '--work-glow',  accent: '#ff6b35', glowVal: 'rgba(255,107,53,0.35)'  },
    [Phase.SHORT_BREAK]: { label: 'Short Break',  minutes: SHORT_BREAK_MIN, cssVar: '--break-accent', glow: '--break-glow', accent: '#00d9a6', glowVal: 'rgba(0,217,166,0.35)' },
    [Phase.LONG_BREAK]:  { label: 'Long Break',   minutes: LONG_BREAK_MIN,  cssVar: '--long-accent',  glow: '--long-glow',  accent: '#7b61ff', glowVal: 'rgba(123,97,255,0.35)' },
  };

  // ── DOM refs ───────────────────────────────────────────────────────
  const $display      = document.getElementById('timer-display');
  const $phaseLabel   = document.getElementById('phase-label');
  const $progressRing = document.getElementById('progress-ring');
  const $btnStart     = document.getElementById('btn-start');
  const $btnPause     = document.getElementById('btn-pause');
  const $btnEnd       = document.getElementById('btn-end');
  const $pomCount     = document.getElementById('pomodoro-count');
  const $logBody      = document.getElementById('log-body');
  const $logEmpty     = document.getElementById('log-empty');
  const $logTable     = document.getElementById('log-table');
  const $timerCard    = document.getElementById('timer-card');

  // ── State ──────────────────────────────────────────────────────────
  let currentPhase     = Phase.WORK;
  let totalSeconds     = WORK_MINUTES * 60;
  let remainingSeconds = totalSeconds;
  let timerInterval    = null;
  let isRunning        = false;
  let isPaused         = false;
  let pomodorosCompleted = 0;
  // each entry: { date, focusSecs, breakSecs }
  let sessionLog       = [];

  // ── Initialise ─────────────────────────────────────────────────────
  loadLog();
  renderLog();
  applyPhaseTheme();
  updateDisplay();
  updateProgress();
  updatePomodoroCount();

  // ── Event listeners ────────────────────────────────────────────────
  $btnStart.addEventListener('click', startTimer);
  $btnPause.addEventListener('click', togglePause);
  $btnEnd.addEventListener('click', endTimer);
  document.getElementById('btn-clear-log').addEventListener('click', clearLog);

  // Initially only the start button is enabled
  $btnPause.disabled = true;
  $btnEnd.disabled   = true;

  // ── Timer controls ─────────────────────────────────────────────────
  function startTimer() {
    if (isRunning || isPaused) return; // ignore if already running or paused state
    isRunning = true;
    isPaused  = false;
    $btnStart.disabled = true;
    $btnPause.disabled = false;
    $btnEnd.disabled   = false;
    $btnPause.innerHTML = '<span class="btn__icon">⏸</span> Pause';
    $timerCard.classList.add('running');

    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    remainingSeconds--;
    updateDisplay();
    updateProgress();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      $timerCard.classList.remove('running');
      playBeep();
      onPhaseComplete();
    }
  }

  function togglePause() {
    if (!isRunning && !isPaused) return; // nothing to do
    if (isPaused) {
      // resume
      isPaused = false;
      isRunning = true;
      $btnPause.innerHTML = '<span class="btn__icon">⏸</span> Pause';
      $btnPause.disabled = false;
      $btnStart.disabled = true;
      $timerCard.classList.add('running');
      timerInterval = setInterval(tick, 1000);
    } else {
      // pause
      isPaused = true;
      isRunning = false;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      $btnPause.innerHTML = '<span class="btn__icon">▶</span> Resume';
      $btnPause.disabled = false;
      $btnStart.disabled = true;
      $timerCard.classList.remove('running');
    }
  }

  function endTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const wasWorking = currentPhase === Phase.WORK;
    const elapsedSeconds = totalSeconds - remainingSeconds;

    isRunning = false;
    isPaused  = false;
    $timerCard.classList.remove('running');

    // record appropriate time depending on phase
    if (wasWorking && elapsedSeconds > 0) {
      pomodorosCompleted++;
      updatePomodoroCount();
      logFocus(elapsedSeconds);
    } else if (!wasWorking && elapsedSeconds > 0) {
      // break ended early; log into last entry if exists
      logBreak(elapsedSeconds);
    }

    // transition just like a normal completion
    if (currentPhase === Phase.WORK) {
      if (pomodorosCompleted % POMODOROS_BEFORE_LONG === 0) {
        setPhase(Phase.LONG_BREAK);
      } else {
        setPhase(Phase.SHORT_BREAK);
      }
    } else {
      setPhase(Phase.WORK);
    }

    $btnStart.disabled = false;
    $btnPause.disabled = true;
    $btnEnd.disabled   = true;
  }

  // ── Phase transitions ─────────────────────────────────────────────
  function onPhaseComplete() {
    if (currentPhase === Phase.WORK) {
      // Work period ended normally; record focus time
      pomodorosCompleted++;
      updatePomodoroCount();
      logFocus(WORK_MINUTES * 60); // full length

      // Decide next phase
      if (pomodorosCompleted % POMODOROS_BEFORE_LONG === 0) {
        setPhase(Phase.LONG_BREAK);
      } else {
        setPhase(Phase.SHORT_BREAK);
      }
    } else {
      // Break finished; record break length and return to work
      const breakSecs = phaseInfo[currentPhase].minutes * 60;
      logBreak(breakSecs);
      setPhase(Phase.WORK);
    }

    $btnStart.disabled = false;
    $btnPause.disabled = true;
    $btnEnd.disabled   = true;
  }

  function setPhase(phase) {
    currentPhase     = phase;
    totalSeconds     = phaseInfo[phase].minutes * 60;
    remainingSeconds = totalSeconds;
    applyPhaseTheme();
    updateDisplay();
    updateProgress();
  }

  function applyPhaseTheme() {
    const info = phaseInfo[currentPhase];
    $phaseLabel.textContent = info.label;
    document.documentElement.style.setProperty('--accent', info.accent);
    document.documentElement.style.setProperty('--glow', info.glowVal);
  }

  // ── Display helpers ────────────────────────────────────────────────
  function updateDisplay() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    $display.textContent = `${pad(m)}:${pad(s)}`;
    // Update page title with timer
    document.title = `${pad(m)}:${pad(s)} — Pomodoro`;
  }

  function updateProgress() {
    const fraction = remainingSeconds / totalSeconds;
    const offset   = CIRCUMFERENCE * fraction;
    $progressRing.style.strokeDashoffset = CIRCUMFERENCE - offset;
  }

  function updatePomodoroCount() {
    $pomCount.innerHTML = `Pomodoros completed: <strong>${pomodorosCompleted}</strong>`;
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatHhMm(seconds) {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${pad(hrs)}:${pad(mins)}`;
  }

  // ── Audio (Web Audio API) ──────────────────────────────────────────
  function playBeep() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();

      // Play three short beeps
      [0, 0.25, 0.5].forEach((delay) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type      = 'sine';
        osc.frequency.value = 880;

        gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (_) {
      // Silently fail if audio context is unavailable
    }
  }

  // ── Session Log (localStorage) ─────────────────────────────────────
  // store focus portion; break will be added later via logBreak
  function logFocus(seconds) {
    const now  = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    sessionLog.push({ date, focusSecs: seconds, breakSecs: 0 });
    saveLog();
    renderLog();
  }

  // update most recent entry with break length (only if pending)
  function logBreak(seconds) {
    if (sessionLog.length === 0) return;
    const last = sessionLog[sessionLog.length - 1];
    // if break already recorded, ignore
    if (last.breakSecs && last.breakSecs > 0) return;
    last.breakSecs = seconds;
    saveLog();
    renderLog();
  }

  function renderLog() {
    $logBody.innerHTML = '';

    if (sessionLog.length === 0) {
      $logTable.classList.add('hidden');
      $logEmpty.classList.remove('hidden');
      return;
    }

    $logTable.classList.remove('hidden');
    $logEmpty.classList.add('hidden');

    sessionLog.forEach((entry, i) => {
      const focus   = formatHhMm(entry.focusSecs);
      const brk     = formatHhMm(entry.breakSecs);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${entry.date}</td><td>${focus}</td><td>${brk}</td>`;
      if (i === sessionLog.length - 1) tr.classList.add('new-row');
      $logBody.appendChild(tr);
    });
  }

  function saveLog() {
    try {
      localStorage.setItem('pomodoro_log', JSON.stringify(sessionLog));
    } catch (_) { /* quota errors etc. */ }
  }

  function clearLog() {
    sessionLog = [];
    pomodorosCompleted = 0;
    updatePomodoroCount();
    saveLog();
    renderLog();
  }

  function loadLog() {
    try {
      const raw = localStorage.getItem('pomodoro_log');
      if (raw) {
        const arr = JSON.parse(raw);
        // migrate legacy entries if necessary
        sessionLog = arr.map(e => {
          if (e.focusSecs == null) {
            // old format with duration string
            const parts = (e.duration || '00:00').split(':');
            const mins = parseInt(parts[0], 10) || 0;
            return { date: e.date, focusSecs: mins * 60, breakSecs: 0 };
          }
          return e;
        });
        pomodorosCompleted = sessionLog.length;
      }
    } catch (_) {
      sessionLog = [];
    }
  }
})();
