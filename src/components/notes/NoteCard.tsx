import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  alpha,
} from "@mui/material";
import {
  PushPinRounded,
  PushPinOutlined,
  DeleteRounded,
} from "@mui/icons-material";
import { formatDate } from "../../utils/dateUtils";

export default function NoteCard({ note, onEdit, onTogglePin, onDelete }) {
  return (
    <Card
      onClick={() => onEdit(note)}
      sx={{
        cursor: "pointer",
        borderTop: `4px solid ${note.color || "#7C3AED"}`,
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "&:hover": {
          transform: "translateY(-5px) scale(1.01)",
          boxShadow: `0 16px 48px ${alpha(note.color || "#7C3AED", 0.18)}`,
        },
        "&:active": { transform: "translateY(-2px) scale(1.005)" },
        ...(note.pinned && {
          boxShadow: `0 0 0 1px ${alpha(note.color || "#7C3AED", 0.35)}`,
        }),
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {note.title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {note.title}
              </Typography>
            )}
            {note.tags && note.tags.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                {note.tags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    sx={{ height: 20, fontSize: "0.65rem" }}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Tooltip title={note.pinned ? "Désépingler" : "Épingler"}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note);
              }}
              sx={{
                color: note.pinned ? note.color : "text.secondary",
                ml: 0.5,
              }}
            >
              {note.pinned ? (
                <PushPinRounded fontSize="small" />
              ) : (
                <PushPinOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {note.content && (
          <Box
            sx={{
              color: "text.secondary",
              mb: 1.5,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              "& p": { m: 0 },
            }}
          >
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatDate(note.createdAt?.substring(0, 10))}
          </Typography>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note);
              }}
              color="error"
            >
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}
