import React from "react";
import { Box, Chip, alpha, useTheme } from "@mui/material";

const statusFilters = [
  { value: "all", label: "Toutes" },
  { value: "todo", label: "À faire" },
  { value: "doing", label: "En cours" },
  { value: "done", label: "Terminées" },
];

const categoryFilters = [
  { value: "all", label: "🏷️ Toutes" },
  { value: "study", label: "📚 Étude" },
  { value: "work", label: "💼 Travail" },
  { value: "personal", label: "🏠 Personnel" },
  { value: "health", label: "💪 Santé" },
  { value: "creativity", label: "🎨 Créativité" },
];

const sortOptions = [
  { value: "date", label: "📅 Date" },
  { value: "priority", label: "⚡ Priorité" },
  { value: "category", label: "🏷️ Catégorie" },
];

export default function TaskFilters({
  filter,
  setFilter,
  sortBy,
  setSortBy,
  categoryFilter,
  setCategoryFilter,
}) {
  const theme = useTheme();

  const chipSx = (active) => ({
    fontWeight: active ? 700 : 500,
    fontSize: "0.8rem",
    backgroundColor: active
      ? alpha(theme.palette.primary.main, 0.15)
      : "transparent",
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider}`,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      transform: "scale(1.05)",
    },
  });

  return (
    <Box sx={{ mb: 2.5 }}>
      {/* Status */}
      <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 1.5 }}>
        {statusFilters.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            size="small"
            onClick={() => setFilter(s.value)}
            sx={chipSx(filter === s.value)}
          />
        ))}
      </Box>

      {/* Category + Sort */}
      <Box
        sx={{
          display: "flex",
          gap: 0.8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {categoryFilters.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            size="small"
            onClick={() => setCategoryFilter(c.value)}
            sx={chipSx(categoryFilter === c.value)}
          />
        ))}
        <Box sx={{ mx: 0.5, color: "text.secondary" }}>|</Box>
        {sortOptions.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            size="small"
            onClick={() => setSortBy(s.value)}
            sx={chipSx(sortBy === s.value)}
          />
        ))}
      </Box>
    </Box>
  );
}
