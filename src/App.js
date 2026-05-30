import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, useMediaQuery, CircularProgress } from '@mui/material';
import { getTheme } from './theme/theme';
import { AnimatePresence } from 'framer-motion';

// Layout
import Sidebar from './components/layout/Sidebar';
import AppNavbar from './components/layout/AppNavbar';

// Pages
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import TasksPage from './components/tasks/TasksPage';
import HabitTracker from './components/habits/HabitTracker';
import PomodoroTimer from './components/pomodoro/PomodoroTimer';
import NotesPage from './components/notes/NotesPage';
import ExpenseTracker from './components/expenses/ExpenseTracker';

// Context & Services
import { PomodoroProvider } from './context/PomodoroContext';
import useNotificationService from './hooks/useNotificationService';

// Hooks
import useTasks from './hooks/useTasks';
import useHabits from './hooks/useHabits';

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  // Sync with system preference
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Hooks at app level so data flows to Dashboard
  const { tasks, updateTask } = useTasks(user);
  const { habits } = useHabits(user);

  // Background notifications service for tasks
  useNotificationService(tasks, updateTask);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: darkMode ? '#0F0E17' : '#F8FAFC',
          }}
        >
          <CircularProgress sx={{ color: '#7C3AED' }} size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  // Not logged in -> Auth page
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage />
      </ThemeProvider>
    );
  }

  // Logged in -> App with sidebar + routes
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PomodoroProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <AppNavbar
            user={user}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard tasks={tasks} habits={habits} />} />
                <Route path="/tasks" element={<TasksPage user={user} />} />
                <Route path="/habits" element={<HabitTracker user={user} />} />
                <Route path="/pomodoro" element={<PomodoroTimer />} />
                <Route path="/expenses" element={<ExpenseTracker user={user} />} />
                <Route path="/notes" element={<NotesPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Box>
        </Box>
      </PomodoroProvider>
    </ThemeProvider>
  );
}