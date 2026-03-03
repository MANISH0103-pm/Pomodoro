# Pomodoro Timer — Focus & Study!!

A clean, minimal Pomodoro timer app built with plain HTML, CSS, and JavaScript. No frameworks, no dependencies — just open and use.

## What is the Pomodoro Technique?

The Pomodoro Technique helps you stay focused by breaking your work into timed sessions with short breaks in between. This app automates that entire flow for you.

## Features

- **40-minute focus sessions** with a countdown timer in `mm:ss` format
- **Short breaks** (10 min) after each session
- **Long breaks** (20 min) after every 4 pomodoros
- **Animated ring** that visually shows time remaining
- **Start / Pause / Resume / End** controls at any point
- **Audio beeps** (via Web Audio API) when a phase completes
- **Color themes** that change based on the current phase:
  - Focus Time — orange
  - Short Break — green
  - Long Break — purple
- **Session log** that tracks every focus and break duration
- **Persistent history** — log is saved in your browser (localStorage) and survives page reloads
- **Clear log** button to reset everything
- Responsive design — works on mobile and desktop

## How to Run

No install needed. Just open the file in your browser:

```
index.html
```

Or serve it locally:

```bash
python3 -m http.server 8080
```

Then visit: [http://localhost:8080](http://localhost:8080)

## File Structure

```
Pomodoro/
├── index.html   # App structure and layout
├── index.css    # Styling and animations
└── app.js       # Timer logic, session tracking, audio
```

## Built With

- HTML5
- CSS3 (custom properties, animations, backdrop blur)
- Vanilla JavaScript (Web Audio API, localStorage)
- [Inter](https://fonts.google.com/specimen/Inter) font via Google Fonts
