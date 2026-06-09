import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, useMediaQuery, useTheme, IconButton, alpha, Divider,
} from '@mui/material';
import {
  DashboardRounded, AssignmentRounded, FitnessCenterRounded,
  TimerRounded, StickyNote2Rounded, CloseRounded, AccountBalanceWalletRounded,
  MenuBookRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SIDEBAR_WIDTH = 260;

const navItems = [
  { label: 'Tableau de bord', icon: <DashboardRounded />, path: '/' },
  { label: 'Tâches', icon: <AssignmentRounded />, path: '/tasks' },
  { label: 'Habitudes', icon: <FitnessCenterRounded />, path: '/habits' },
  { label: 'Pomodoro', icon: <TimerRounded />, path: '/pomodoro' },
  { label: 'Dépenses', icon: <AccountBalanceWalletRounded />, path: '/expenses' },
  { label: 'Notes', icon: <StickyNote2Rounded />, path: '/notes' },
  { label: 'Journal', icon: <MenuBookRounded />, path: '/journal', badge: '✨' },
];

export { SIDEBAR_WIDTH };

export default function Sidebar({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #0F0E17 0%, #1A1A2E 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 3,
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          }}
        >
          📚
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2,
              background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            StudyTrack
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Mali
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
            <CloseRounded />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item, i) => {
          const active = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: 3,
                    py: 1.3,
                    px: 2,
                    transition: 'all 0.2s ease',
                    backgroundColor: active
                      ? alpha(theme.palette.primary.main, 0.12)
                      : 'transparent',
                    borderLeft: active
                      ? `3px solid ${theme.palette.primary.main}`
                      : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.9rem',
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                  />
                  {item.badge && !active && (
                    <Typography sx={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 700 }}>
                      {item.badge}
                    </Typography>
                  )}
                  {active && (
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                        boxShadow: '0 0 8px rgba(124,58,237,0.5)',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.6 }}>
          StudyTrack Mali © 2026
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onClose={onClose} variant="temporary">
        {content}
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: theme.zIndex.drawer,
      }}
    >
      {content}
    </Box>
  );
}
