import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { VisibilityRounded, VisibilityOffRounded } from "@mui/icons-material";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase";
import { motion } from "framer-motion";

export default function AuthPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const pwStrength = () => {
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length >= 6) score += 25;
    if (pw.length >= 10) score += 25;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pw)) score += 25;
    return score;
  };

  const pwColor = () => {
    const s = pwStrength();
    if (s <= 25) return "#EF4444";
    if (s <= 50) return "#F59E0B";
    if (s <= 75) return "#06B6D4";
    return "#10B981";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
      }
    } catch (err) {
      const messages = {
        "auth/invalid-email": "Email invalide",
        "auth/user-not-found": "Aucun compte trouvé",
        "auth/wrong-password": "Mot de passe incorrect",
        "auth/email-already-in-use": "Email déjà utilisé",
        "auth/weak-password": "Mot de passe trop faible (6 caractères min)",
        "auth/invalid-credential": "Identifiants invalides",
      };
      setError(messages[err.code] || err.message);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background:
          "linear-gradient(135deg, #0F0E17 0%, #1A1A2E 50%, #0F0E17 100%)",
      }}
    >
      {/* Left Panel - Decorative */}
      {!isMobile && (
        <Box
          sx={{
            flex: "0 0 55%",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 6,
          }}
        >
          {/* Animated gradient orbs */}
          <Box
            sx={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
              top: "10%",
              left: "10%",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
              bottom: "15%",
              right: "15%",
              animation: "float 6s ease-in-out infinite 2s",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
              top: "50%",
              right: "30%",
              animation: "float 10s ease-in-out infinite 1s",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: "relative", zIndex: 1, textAlign: "center" }}
          >
            <Box sx={{ fontSize: 64, mb: 2 }}>📚</Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 2,
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              StudyTrack Mali
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.6)",
                maxWidth: 400,
                fontWeight: 400,
              }}
            >
              Transforme tes objectifs en réalisations. Suis ta progression,
              reste motivé, atteins tes rêves.
            </Typography>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ position: "relative", zIndex: 1, marginTop: 48 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                "📊 Dashboard",
                "✅ Tâches",
                "💪 Habitudes",
                "🍅 Pomodoro",
                "📝 Notes",
              ].map((f, i) => (
                <Box
                  key={f}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {f}
                </Box>
              ))}
            </Box>
          </motion.div>
        </Box>
      )}

      {/* Right Panel - Auth Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 6 },
          background: isMobile
            ? "linear-gradient(135deg, #0F0E17 0%, #1A1A2E 100%)"
            : "transparent",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          {isMobile && (
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box sx={{ fontSize: 48, mb: 1 }}>📚</Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #A78BFA, #22D3EE)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                StudyTrack Mali
              </Typography>
            </Box>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: "rgba(26,26,46,0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}
            >
              {isLogin ? "Connexion" : "Créer un compte"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", mb: 3 }}
            >
              {isLogin
                ? "Content de te revoir !"
                : "Commence ton parcours dès maintenant"}
            </Typography>

            <Box component="form" onSubmit={onSubmit}>
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Nom affiché"
                  variant="outlined"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  sx={{
                    mb: 2,
                    "& .MuiInputBase-root": { color: "#FFF" },
                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.15)",
                    },
                  }}
                />
              )}
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiInputBase-root": { color: "#FFF" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.15)",
                  },
                }}
              />
              <TextField
                fullWidth
                required
                label="Mot de passe"
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPw(!showPw)}
                          edge="end"
                          sx={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {showPw ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  mb: 1,
                  "& .MuiInputBase-root": { color: "#FFF" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.15)",
                  },
                }}
              />

              {!isLogin && pw.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={pwStrength()}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      mt: 1,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background: pwColor(),
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: pwColor(), mt: 0.5, display: "block" }}
                  >
                    {pwStrength() <= 25
                      ? "Faible"
                      : pwStrength() <= 50
                        ? "Moyen"
                        : pwStrength() <= 75
                          ? "Bon"
                          : "Excellent"}
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5B21B6 0%, #0891B2 100%)",
                  },
                }}
              >
                {loading ? "..." : isLogin ? "Se connecter" : "S'inscrire"}
              </Button>

              {error && (
                <Typography
                  color="error"
                  sx={{ mt: 2, fontSize: "0.85rem", textAlign: "center" }}
                >
                  {error}
                </Typography>
              )}

              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                  <Box
                    component="span"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    sx={{
                      ml: 1,
                      color: "#A78BFA",
                      cursor: "pointer",
                      fontWeight: 600,
                      "&:hover": { color: "#7C3AED" },
                      transition: "color 0.2s",
                    }}
                  >
                    {isLogin ? "Créer un compte" : "Se connecter"}
                  </Box>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
}
