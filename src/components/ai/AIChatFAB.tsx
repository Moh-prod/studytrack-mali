import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Fab,
  Typography,
  TextField,
  IconButton,
  alpha,
  useTheme,
  SwipeableDrawer,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  AutoAwesomeRounded,
  CloseRounded,
  SendRounded,
  ChatBubbleOutlineRounded,
  TipsAndUpdatesRounded,
  ScheduleRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import useAICoach from "../../hooks/useAICoach";

import useTaskStore from "../../store/useTaskStore";
import useHabitStore from "../../store/useHabitStore";

const SUGGESTIONS = [
  {
    text: "Comment améliorer ma productivité ?",
    icon: <TipsAndUpdatesRounded fontSize="small" />,
  },
  {
    text: "Aide-moi à planifier ma journée",
    icon: <ScheduleRounded fontSize="small" />,
  },
  {
    text: "Je suis fatigué(e), que faire ?",
    icon: <AutoAwesomeRounded fontSize="small" />,
  },
];

export default function AIChatFAB({ streak }) {
  const theme = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const { messages, isLoading, sendMessage } = useAICoach({
    tasks,
    habits,
    streak,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  const chatContent = (
    <Box
      sx={{
        width: { xs: "100vw", sm: 380 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #1A1A2E 0%, #0F0E17 100%)"
            : "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          color: "#FFF",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.2)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <AutoAwesomeRounded />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              Coach IA
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, fontWeight: 500 }}
            >
              Toujours là pour t'aider
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={() => setIsOpen(false)}
          sx={{ color: "#FFF" }}
        >
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 2,
              opacity: 0.7,
            }}
          >
            <ChatBubbleOutlineRounded
              sx={{ fontSize: 48, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "text.secondary",
                maxWidth: 250,
              }}
            >
              Bonjour ! Je suis ton coach IA. Pose-moi une question sur ton
              organisation ou ta méthode de travail.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                mt: 2,
                width: "100%",
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <Chip
                  key={i}
                  icon={s.icon}
                  label={s.text}
                  onClick={() => handleSuggestion(s.text)}
                  sx={{
                    justifyContent: "flex-start",
                    px: 1,
                    py: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "model" ? 4 : 16,
                    backgroundColor:
                      msg.role === "user"
                        ? theme.palette.primary.main
                        : msg.isError
                          ? alpha(theme.palette.error.main, 0.1)
                          : theme.palette.background.paper,
                    color: msg.role === "user" ? "#FFF" : "text.primary",
                    boxShadow:
                      msg.role === "user"
                        ? "0 4px 12px rgba(124, 58, 237, 0.3)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    border:
                      msg.role === "model"
                        ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        : "none",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                  >
                    {msg.text}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <Box
            sx={{
              alignSelf: "flex-start",
              backgroundColor: theme.palette.background.paper,
              p: 1.5,
              borderRadius: 2,
              borderBottomLeftRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    delay: i * 0.2,
                  }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.primary.main,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Pose une question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!input.trim() || isLoading}
          sx={{
            backgroundColor: "primary.main",
            color: "#FFF",
            mb: 0.5,
            "&:hover": { backgroundColor: "primary.dark" },
            "&.Mui-disabled": {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              color: "#FFF",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendRounded fontSize="small" />
          )}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <Box
            component={motion.div}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            sx={{
              position: "fixed",
              bottom: { xs: 90, md: 24 }, // Evite la collision sur mobile avec d'autres FABs
              right: 24,
              zIndex: 1000,
            }}
          >
            <Fab
              onClick={() => setIsOpen(true)}
              sx={{
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                color: "#FFF",
                width: 56,
                height: 56,
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #6D28D9, #0891B2)",
                },
              }}
            >
              <AutoAwesomeRounded />
            </Fab>
          </Box>
        )}
      </AnimatePresence>

      <SwipeableDrawer
        anchor="right"
        open={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        disableBackdropTransition={
          typeof navigator !== "undefined" &&
          !/iPad|iPhone|iPod/.test(navigator.userAgent)
        }
        disableDiscovery={
          typeof navigator !== "undefined" &&
          /iPad|iPhone|iPod/.test(navigator.userAgent)
        }
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 380 },
            borderRadius: { xs: 0, sm: "16px 0 0 16px" },
            borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            overflow: "hidden",
          },
        }}
      >
        {chatContent}
      </SwipeableDrawer>
    </>
  );
}
