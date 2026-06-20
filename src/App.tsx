import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
  Box,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { getTheme } from "./theme/theme";
import { AnimatePresence } from "framer-motion";

// Layout — always loaded (small, needed immediately)
import Sidebar from "./components/layout/Sidebar";
import AppNavbar from "./components/layout/AppNavbar";
import AIChatFAB from "./components/ai/AIChatFAB";

// Context & Services
import { PomodoroProvider } from "./context/PomodoroContext";
import useNotificationService from "./hooks/useNotificationService";

import useStreak from "./hooks/useStreak";

// Stores
import useTaskStore from "./store/useTaskStore";
import useHabitStore from "./store/useHabitStore";

// Report scheduler
import {
  startReportScheduler,
  stopReportScheduler,
} from "./utils/reportScheduler";

// Pages — lazy loaded (code splitting)
const AuthPage = lazy(() => import("./components/auth/AuthPage"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const TasksPage = lazy(() => import("./components/tasks/TasksPage"));
const HabitTracker = lazy(() => import("./components/habits/HabitTracker"));
const PomodoroTimer = lazy(() => import("./components/pomodoro/PomodoroTimer"));
const NotesPage = lazy(() => import("./components/notes/NotesPage"));
const ExpenseTracker = lazy(
  () => import("./components/expenses/ExpenseTracker"),
);
const JournalPage = lazy(() => import("./components/journal/JournalPage"));

// Minimal page-level loading fallback
const PageFallback = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
    }}
  >
    <CircularProgress sx={{ color: "#7C3AED" }} size={36} thickness={4} />
  </Box>
);

// ── Inner app shell ──────────────────────────────────────────────────────────
// currentStreak est passé en prop depuis App() pour éviter le double useStreak
function AppShell({ user, darkMode, setDarkMode, currentStreak }) {
  const isMobile = useMediaQuery("(max-width:899px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);
  const handleToggleDark = useCallback(
    () => setDarkMode((prev) => !prev),
    [setDarkMode],
  );

  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          open={sidebarOpen}
          onClose={handleCloseSidebar}
          onOpen={handleOpenSidebar}
        />
        <AppNavbar
          user={user}
          darkMode={darkMode}
          setDarkMode={handleToggleDark}
          onMenuClick={handleOpenSidebar}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<TasksPage user={user} />} />
                <Route path="/habits" element={<HabitTracker user={user} />} />
                <Route path="/pomodoro" element={<PomodoroTimer />} />
                <Route
                  path="/expenses"
                  element={<ExpenseTracker user={user} />}
                />
                <Route path="/notes" element={<NotesPage user={user} />} />
                <Route path="/journal" element={<JournalPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
          <AIChatFAB streak={currentStreak} />
        </Box>
      </Box>
    </>
  );
}

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = useMemo(
    () => getTheme(darkMode ? "dark" : "light"),
    [darkMode],
  );

  // Sync with system preference
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  const initTasks = useTaskStore((state) => state.initTasks);
  const initHabits = useHabitStore((state) => state.initHabits);
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const updateTask = useTaskStore((state) => state.updateTask);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      initTasks(usr);
      initHabits(usr);
      setLoading(false);
    });
    return () => unsub();
  }, [initTasks, initHabits]);

  // ── Data hooks: called ONCE here ─────────────────────────────────────────
  const { currentStreak } = useStreak(tasks);

  useNotificationService(tasks, updateTask);

  // ── Debounced report scheduler ────────────────────────────────────────────
  // Évite les appels en cascade quand tasks/habits changent fréquemment via
  // les snapshots Firestore en temps réel. Le scheduler ne redémarre que 2s
  // après le dernier changement d'état.
  const schedulerDebounceRef = useRef(null);
  useEffect(() => {
    if (!user) return;

    if (schedulerDebounceRef.current) {
      clearTimeout(schedulerDebounceRef.current);
    }

    schedulerDebounceRef.current = setTimeout(() => {
      startReportScheduler(user.uid, tasks, habits, currentStreak);
    }, 2000);

    return () => {
      if (schedulerDebounceRef.current) {
        clearTimeout(schedulerDebounceRef.current);
      }
      stopReportScheduler();
    };
  }, [user, tasks, habits, currentStreak]);

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: darkMode ? "#0F0E17" : "#F8FAFC",
          }}
        >
          <CircularProgress sx={{ color: "#7C3AED" }} size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  // ── Auth page ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<PageFallback />}>
          <AuthPage />
        </Suspense>
      </ThemeProvider>
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PomodoroProvider user={user} tasks={tasks} updateTask={updateTask}>
        <AppShell
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentStreak={currentStreak}
        />
      </PomodoroProvider>
    </ThemeProvider>
  );
}
