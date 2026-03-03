# Pomodoro Timer — Requirements

I want to cretae a simple single‑page HTML/JS/CSS application to help improve my focus using the Pomodoro technique.

## Core behaviour

1. **Work session (pomodoro)**
   * Default length: 40 minutes.
   * Count down in `mm:ss` format.
   * Display current phase (“Focus Time”, “Short Break”, “Long Break”).
   * Ring graphic shows progress.
   * Start, Pause/Resume, and End buttons control the timer.
   * End may be clicked anytime – if during a work period it should be logged with the elapsed time.

2. **Breaks**
   * Short break: 10 minutes after each work session.
   * Long break: 20 minutes after every 3rd pomodoro.
   * Breaks can be paused/ended early.
   * Ending a break records the actual break duration.
   * Pause/resume should work during any phase.
   * Buttons disable/enable appropriately (you can’t pause if not running, etc.).



3. **Phase transitions**
   * After a work session: increment counter, log focus time, then choose short/long break.
   * After a break: log break time and return to work.

4. **Logging**
   * Persist session history
   * Each entry includes:
     * Date (short US format).
     * Focus Time (`hh:mm` from start‑to‑end of work period).
     * Break Time (`hh:mm` from start‑to‑end of following break, or 0 if none yet).
   * Show log in a tabular view with columns `# | Date | Focus Time | Break Time`.
   * Animate new rows and hide table when empty.
   * “Clear log” button wipes history and resets the pomodoro counter.

5. **Audio feedback**
   * On phase completion play three short beeps via Web Audio API.

6. **Visual design**
   * Colour themes for work / break / long‑break toggled via CSS variables.