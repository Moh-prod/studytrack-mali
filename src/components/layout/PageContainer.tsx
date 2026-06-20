import React, { memo } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import { SIDEBAR_WIDTH } from "./Sidebar";

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const headerVariants = {
  initial: { opacity: 0, x: -12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
  },
};

function PageContainer({ children, title, subtitle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Box
        sx={{
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          pt: { xs: "72px", md: "80px" },
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 8, md: 4 }, // extra bottom padding on mobile for FABs
          minHeight: "100vh",
          maxWidth: 1240,
          willChange: "transform",
        }}
      >
        {(title || subtitle) && (
          <motion.div
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <Box sx={{ mb: 3 }}>
              {title && (
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 0.5,
                    fontSize: { xs: "1.6rem", sm: "2rem", md: "2.2rem" },
                    background:
                      "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "inline-block",
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", mt: 0.25 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </motion.div>
        )}

        {children}
      </Box>
    </motion.div>
  );
}

export default PageContainer;
