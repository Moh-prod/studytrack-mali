import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, useMediaQuery, CircularProgress } from '@mui/material';
import { getTheme } from './theme/theme';
import { AnimatePresence } from 'framer-motion';

// Layout — always loaded (small, needed immediately)
import Sidebar from './components/layout/Sidebar';
import AppNavbar from './components/layout/AppNavbar';
import AIChatFAB from './components/ai/AIChatFAB';

// Context & Services
import { PomodoroProvider } from './context/PomodoroContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import useNotificationService from './hooks/useNotificationService';
import useSwipeGesture from './hooks/useSwipeGesture';

// Hooks
import useTasks from './hooks/useTasks';
import useHabits from './hooks/useHabits';
import useStreak from './hooks/useStreak';

// Report scheduler
import { startReportScheduler, stopReportScheduler } from './utils/reportScheduler';

// Pages — lazy loaded (code splitting)
const AuthPage      = lazy(() => import('./components/auth/AuthPage'));
const Dashboard     = lazy(() => import('./components/dashboard/Dashboard'));
const TasksPage     = lazy(() => import('./components/tasks/TasksPage'));
const HabitTracker  = lazy(() => import('./components/habits/HabitTracker'));
const PomodoroTimer = lazy(() => import('./components/pomodoro/PomodoroTimer'));
const NotesPage     = lazy(() => import('./components/notes/NotesPage'));
const ExpenseTracker= lazy(() => import('./components/expenses/ExpenseTracker'));
const JournalPage   = lazy(() => import('./components/journal/JournalPage'));

// Minimal page-level loading fallback
const PageFallback = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#7C3AED' }} size={36} thickness={4} />
  </Box>
);

// ── Inner app with swipe gesture (needs access to setSidebarOpen) ──────────
function AppShell({
  user, darkMode, setDarkMode,
  tasks, habits, currentStreak,
  addTask, updateTask, deleteTask, toggleTask,
  addHabit, updateHabit, deleteHabit, toggleHabitDate,
}) {
  const isMobile = useMediaQuery('(max-width:899px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const handleToggleDark   = useCallback(() => setDarkMode(prev => !prev), [setDarkMode]);

  // ── Swipe left-edge → right opens sidebar on mobile ─────────────────────
  useSwipeGesture({
    onSwipeRight: useCallback(() => {
      if (isMobile) setSidebarOpen(true);
    }, [isMobile]),
    threshold: 70,
    edgeWidth: 35,
  });

  return (
    <AudioPlayerProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onClose={handleCloseSidebar} />
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
                <Route path="/" element={<Dashboard tasks={tasks} habits={habits} />} />
                <Route path="/tasks" element={
                  <TasksPage
                    user={user}
                    tasks={tasks}
                    addTask={addTask}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    toggleTask={toggleTask}
                  />
                } />
                <Route path="/habits" element={
                  <HabitTracker
                    user={user}
                    habits={habits}
                    addHabit={addHabit}
                    updateHabit={updateHabit}
                    deleteHabit={deleteHabit}
                    toggleHabitDate={toggleHabitDate}
                  />
                } />
                <Route path="/pomodoro"  element={<PomodoroTimer />} />
                <Route path="/expenses"  element={<ExpenseTracker user={user} />} />
                <Route path="/notes"     element={<NotesPage user={user} />} />
                <Route path="/journal"   element={
                  <JournalPage user={user} tasks={tasks} habits={habits} />
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
          <AIChatFAB tasks={tasks} habits={habits} streak={currentStreak} />
        </Box>
      </Box>
    </AudioPlayerProvider>
  );
}

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  // Sync with system preference
  useEffect(() => { setDarkMode(prefersDarkMode); }, [prefersDarkMode]);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Data hooks: called ONCE here ─────────────────────────────────────────
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks(user);
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitDate } = useHabits(user);
  const { currentStreak } = useStreak(tasks);

  useNotificationService(tasks, updateTask);

  useEffect(() => {
    if (user) startReportScheduler(user.uid, tasks, habits, currentStreak);
    return () => stopReportScheduler();
  }, [user, tasks, habits, currentStreak]);

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          background: darkMode ? '#0F0E17' : '#F8FAFC',
        }}>
          <CircularProgress sx={{ color: '#7C3AED' }} size={48} />
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
      <PomodoroProvider>
        <AppShell
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          tasks={tasks} habits={habits} currentStreak={currentStreak}
          addTask={addTask} updateTask={updateTask}
          deleteTask={deleteTask} toggleTask={toggleTask}
          addHabit={addHabit} updateHabit={updateHabit}
          deleteHabit={deleteHabit} toggleHabitDate={toggleHabitDate}
        />
      </PomodoroProvider>
    </ThemeProvider>
  );
}