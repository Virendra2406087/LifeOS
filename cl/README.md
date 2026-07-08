# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


LIFEOS/
├─ .vscode/
│  └─ easycode.ignore
├─ cl/
│  ├─ public/
│  │  ├─ LifeOS_logo.jpeg
│  │  └─ vite.svg
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ api.js
│  │  │  └─ store.js
│  │  ├─ assets/
│  │  │  └─ react.svg
│  │  ├─ components/
│  │  │  ├─ calendar/
│  │  │  │  └─ CalendarView.jsx
│  │  │  ├─ common/
│  │  │  │  ├─ Button.jsx
│  │  │  │  ├─ Card.jsx
│  │  │  │  ├─ Loader.jsx
│  │  │  │  └─ Modal.jsx
│  │  │  ├─ dashboard/
│  │  │  │  ├─ AddTaskForm.jsx
│  │  │  │  ├─ AISuggestions.jsx
│  │  │  │  ├─ EnergyCard.jsx
│  │  │  │  ├─ FocusBar.jsx
│  │  │  │  ├─ ProductivityAnalytics.jsx
│  │  │  │  ├─ ProductivityGraph.jsx
│  │  │  │  ├─ ProductivityHeatmap.jsx
│  │  │  │  ├─ ProgressBar.jsx
│  │  │  │  ├─ ScheduleList.jsx
│  │  │  │  ├─ Suggestion.jsx
│  │  │  │  ├─ TaskBoard.jsx
│  │  │  │  ├─ TaskItem.jsx
│  │  │  │  └─ UrgencyCard.jsx
│  │  │  ├─ dragdrop/
│  │  │  │  └─ DragDropSchedule.jsx
│  │  │  ├─ layout/
│  │  │  │  ├─ Layout.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  └─ Sidebar.jsx
│  │  │  └─ pomodoro/
│  │  │     └─ PomodoroTimer.jsx
│  │  ├─ context/
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ ThemeContext.jsx
│  │  ├─ hooks/
│  │  │  ├─ useAuth.js
│  │  │  ├─ usePomodoro.js
│  │  │  ├─ useSocket.js
│  │  │  └─ useTasks.js
│  │  ├─ pages/
│  │  │  ├─ AIInsights.jsx
│  │  │  ├─ Analytics.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ History.jsx
│  │  │  ├─ LandingPage.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ NotificationBell.jsx
│  │  │  ├─ Profile.jsx
│  │  │  ├─ Register.jsx
│  │  │  ├─ Settings.jsx
│  │  │  ├─ StatCard.jsx
│  │  │  └─ Tasks.jsx
│  │  ├─ services/
│  │  │  ├─ aiService.js
│  │  │  ├─ authService.js
│  │  │  ├─ statsService.js
│  │  │  └─ taskService.js
│  │  ├─ styles/
│  │  │  ├─ dark.css
│  │  │  ├─ globals.css
│  │  │  └─ light.css
│  │  ├─ utils/
│  │  │  ├─ aiScheduler.js
│  │  │  ├─ aiSuggestions.js
│  │  │  ├─ calculateUrgency.js
│  │  │  ├─ dragHelper.js
│  │  │  └─ formateTime.js
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  └─ routes.jsx
│  ├─ .gitignore
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  └─ vite.config.js
└─ server/
   ├─ config/
   │  ├─ db.js
   │  ├─ googleAuth.js
   │  └─ socket.js
   ├─ controllers/
   │  ├─ aiController.js
   │  ├─ authController.js
   │  ├─ dashboardController.js
   │  ├─ statsController.js
   │  └─ taskController.js
   ├─ middleware/
   │  ├─ authMiddleware.js
   │  ├─ errorMiddleware.js
   │  └─ validateMiddleware.js
   ├─ models/
   │  ├─ PomodoroSession.js
   │  ├─ ProductivityStat.js
   │  ├─ Task.js
   │  └─ User.js
   ├─ routes/
   │  ├─ ai.js
   │  ├─ aiRoutes.js
   │  ├─ authRoutes.js
   │  ├─ dashboardRoutes.js
   │  ├─ statsRoutes.js
   │  ├─ taskRoutes.js
   │  └─ tasks.js
   ├─ services/
   │  ├─ aiService.js
   │  ├─ analyticsService.js
   │  └─ scheduleService.js
   ├─ utils/
   │  ├─ dateHelper.js
   │  ├─ generateToken.js
   │  └─ priorityHelper.js
   ├─ .env
   ├─ package-lock.json
   ├─ package.json
   └─ server.js
