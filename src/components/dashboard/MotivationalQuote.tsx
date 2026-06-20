import React from "react";
import { Card, CardContent, Typography, useTheme } from "@mui/material";
import { FormatQuoteRounded } from "@mui/icons-material";
import { getQuoteOfTheDay } from "../../utils/motivationalQuotes";
import { motion } from "framer-motion";

export default function MotivationalQuote() {
  const theme = useTheme();
  const quote = getQuoteOfTheDay();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card
        sx={{
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))"
              : "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))",
          border: `1px solid ${theme.palette.mode === "dark" ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)"}`,
        }}
      >
        <CardContent sx={{ p: 3, position: "relative" }}>
          <FormatQuoteRounded
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              fontSize: 60,
              opacity: 0.08,
              color: "primary.main",
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.main", fontWeight: 600, mb: 2 }}
          >
            💡 Citation du jour
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              lineHeight: 1.7,
              mb: 2,
              color: "text.primary",
              fontWeight: 400,
            }}
          >
            « {quote.text} »
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: "right",
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            — {quote.author}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}
