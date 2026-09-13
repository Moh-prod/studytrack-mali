import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: "center",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.8)"
                  : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#EF4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Oups ! Une erreur est survenue
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Un problème inattendu s'est produit. Ne vous inquiétez pas, vos données sont en sécurité sur Firebase.
            </Typography>

            {this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  textAlign: "left",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(15, 23, 42, 0.6)"
                      : "#F8FAFC",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  overflowX: "auto",
                  color: "#EF4444",
                  maxHeight: 120,
                }}
              >
                {this.state.error.toString()}
              </Paper>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1,
                background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
              }}
            >
              Recharger la page
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
