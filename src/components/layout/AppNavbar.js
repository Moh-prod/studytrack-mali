import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box, Menu, MenuItem,
  ListItemIcon, ListItemText, useTheme, useMediaQuery, Tooltip, Chip, Snackbar, alpha,
} from '@mui/material';
import {
  MenuRounded, LightModeRounded, DarkModeRounded, LogoutRounded,
  WifiOffRounded, CloudDoneRounded,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { SIDEBAR_WIDTH } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import useNetworkStatus from '../../hooks/useNetworkStatus';

const pageTitles = {
  '/': 'Tableau de Bord',
  '/tasks': 'Mes Tâches',
  '/habits': 'Habitudes',
  '/pomodoro': 'Pomodoro',
  '/notes': 'Notes',
  '/expenses': 'Dépenses',
  '/journal': 'Journal',
};

export default function AppNavbar({ user, darkMode, setDarkMode, onMenuClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const { isOnline, wasOffline, dismissOfflineWarning } = useNetworkStatus();

  const pageTitle = pageTitles[location.pathname] || 'StudyTrack';

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton edge="start" onClick={onMenuClick} sx={{ color: 'text.primary' }}>
              <MenuRounded />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary' }}>
            {pageTitle}
          </Typography>

          {/* Online/Offline indicator */}
          <AnimatePresence mode="wait">
            {!isOnline ? (
              <motion.div
                key="offline"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Chip
                  icon={<WifiOffRounded sx={{ fontSize: '0.9rem !important' }} />}
                  label="Hors-ligne"
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: alpha('#EF4444', 0.12),
                    color: '#EF4444',
                    border: `1px solid ${alpha('#EF4444', 0.25)}`,
                    '& .MuiChip-icon': { color: '#EF4444' },
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}
                />
              </motion.div>
            ) : wasOffline ? (
              <motion.div
                key="reconnected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Chip
                  icon={<CloudDoneRounded sx={{ fontSize: '0.9rem !important' }} />}
                  label="Reconnecté"
                  size="small"
                  onClick={dismissOfflineWarning}
                  sx={{
                    height: 26,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: alpha('#10B981', 0.12),
                    color: '#10B981',
                    border: `1px solid ${alpha('#10B981', 0.25)}`,
                    cursor: 'pointer',
                    '& .MuiChip-icon': { color: '#10B981' },
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? 'Mode clair' : 'Mode sombre'}>
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              sx={{ color: 'text.secondary' }}
            >
              <motion.div
                key={darkMode ? 'dark' : 'light'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex' }}
              >
                {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
              </motion.div>
            </IconButton>
          </Tooltip>

          {/* User Avatar */}
          <Tooltip title="Mon compte">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  fontSize: '0.9rem', fontWeight: 700,
                  boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1, minWidth: 220, borderRadius: 3,
                backgroundImage: 'none',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {user?.displayName || 'Utilisateur'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user?.email}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => { setAnchorEl(null); signOut(auth); }}
              sx={{ mt: 0.5, mx: 1, borderRadius: 2 }}
            >
              <ListItemIcon><LogoutRounded fontSize="small" color="error" /></ListItemIcon>
              <ListItemText
                primary="Déconnexion"
                primaryTypographyProps={{ fontSize: '0.9rem', color: 'error.main' }}
              />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Snackbar for offline status */}
      <Snackbar
        open={!isOnline}
        message="📡 Mode hors-ligne — Les données sont sauvegardées localement"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: alpha('#EF4444', 0.95),
            fontWeight: 600,
            borderRadius: 3,
          },
        }}
      />
    </>
  );
}
