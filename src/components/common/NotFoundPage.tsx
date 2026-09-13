import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ExploreOffIcon from "@mui/icons-material/ExploreOff";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 4,
          textAlign: "center",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.7)"
              : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(124, 58, 237, 0.1)",
            color: "#7C3AED",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <ExploreOffIcon sx={{ fontSize: 44 }} />
        </Box>

        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          Page introuvable
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>

        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate("/")}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.2,
            background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
          }}
        >
          Retour au Tableau de Bord
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
