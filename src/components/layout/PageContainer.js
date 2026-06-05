import React, { memo } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { SIDEBAR_WIDTH } from './Sidebar';

function PageContainer({ children, title, subtitle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
        pt: '80px',
        px: { xs: 2, sm: 3, md: 4 },
        pb: 4,
        minHeight: '100vh',
        maxWidth: 1200,
      }}
    >
      {(title || subtitle) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Box sx={{ mb: 3 }}>
            {title && (
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
      >
        {children}
      </motion.div>
    </Box>
  );
}

export default memo(PageContainer);
