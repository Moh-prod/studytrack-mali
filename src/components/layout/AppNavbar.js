import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box, Menu, MenuItem,
  ListItemIcon, ListItemText, useTheme, useMediaQuery, Tooltip,
} from '@mui/material';
import {
  MenuRounded, LightModeRounded, DarkModeRounded, LogoutRounded,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { SIDEBAR_WIDTH } from './Sidebar';
import { motion } from 'framer-motion';

const pageTitles = {
  '/': 'Tableau de Bord',
  '/tasks': 'Mes Tâches',
  '/habits': 'Habitudes',
  '/pomodoro': 'Pomodoro',
  '/notes': 'Notes',
};

export default function AppNavbar({ user, darkMode, setDarkMode, onMenuClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const pageTitle = pageTitles[location.pathname] || 'StudyTrack';

  return (
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
  );
}
