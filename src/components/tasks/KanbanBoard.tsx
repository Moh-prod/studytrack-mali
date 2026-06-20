import React, { useMemo, useCallback } from "react";
import { Box, Typography, Paper, Chip, alpha } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

const columns = [
  { key: "todo", label: "À Faire", color: "#06B6D4", emoji: "📋" },
  { key: "doing", label: "En Cours", color: "#F59E0B", emoji: "🔨" },
  { key: "done", label: "Terminé", color: "#10B981", emoji: "✅" },
];

// ── Wrapper sortable pour chaque carte ──────────────────────────────────────
function SortableTaskCard({ task, onToggle, onEdit, onDelete, onUpdateTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{ mb: 0.5 }}
    >
      <TaskCard
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdateTask={onUpdateTask}
      />
    </Box>
  );
}

// ── Zone droppable pour chaque colonne ───────────────────────────────────────
function DroppableColumn({
  col,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onUpdateTask,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: isOver
          ? alpha(col.color, 0.12)
          : alpha(col.color, 0.04),
        border: isOver
          ? `2px solid ${alpha(col.color, 0.5)}`
          : `1px solid ${alpha(col.color, 0.15)}`,
        minHeight: 200,
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      {/* Column header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {col.emoji} {col.label}
        </Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{
            height: 22,
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: alpha(col.color, 0.15),
            color: col.color,
          }}
        />
      </Box>

      {/* Droppable area */}
      <Box ref={setNodeRef} sx={{ minHeight: 80 }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                  border: `2px dashed ${alpha(col.color, 0.3)}`,
                  borderRadius: 2,
                  color: "text.secondary",
                  fontSize: "0.85rem",
                  transition: "border-color 0.2s",
                }}
              >
                {isOver ? "⬇️ Déposer ici" : "Aucune tâche"}
              </Box>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateTask={onUpdateTask}
                />
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </Box>
    </Paper>
  );
}

// ── KanbanBoard principal ─────────────────────────────────────────────────────
export default function KanbanBoard({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onUpdateTask,
}) {
  const [activeTask, setActiveTask] = React.useState(null);

  // Capturer le drag seulement après 8px de déplacement
  // Évite de déclencher le drag sur un simple click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const columnTasks = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.key] = tasks.filter(
        (t) => (t.status || (t.done ? "done" : "todo")) === col.key,
      );
    });
    return map;
  }, [tasks]);

  const handleDragStart = useCallback(
    (event) => {
      const task = tasks.find((t) => t.id === event.active.id);
      setActiveTask(task || null);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      // Trouver la colonne cible (soit l'ID de la colonne, soit l'ID d'une tâche dans cette colonne)
      let targetColumnKey = null;

      // Cas 1 : dropped sur la colonne directement
      if (columns.some((c) => c.key === over.id)) {
        targetColumnKey = over.id;
      } else {
        // Cas 2 : dropped sur une tâche — trouver sa colonne
        const targetTask = tasks.find((t) => t.id === over.id);
        if (targetTask) {
          targetColumnKey =
            targetTask.status || (targetTask.done ? "done" : "todo");
        }
      }

      if (!targetColumnKey) return;

      // Trouver la tâche source
      const sourceTask = tasks.find((t) => t.id === active.id);
      if (!sourceTask) return;

      const currentStatus =
        sourceTask.status || (sourceTask.done ? "done" : "todo");
      if (currentStatus === targetColumnKey) return; // Pas de changement

      // Mettre à jour le statut dans Firestore
      const isDone = targetColumnKey === "done";
      onUpdateTask(sourceTask.id, {
        status: targetColumnKey,
        done: isDone,
        completedAt: isDone ? new Date().toISOString() : null,
      });
    },
    [tasks, onUpdateTask],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          minHeight: 400,
        }}
      >
        {columns.map((col) => (
          <DroppableColumn
            key={col.key}
            col={col}
            tasks={columnTasks[col.key] || []}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateTask={onUpdateTask}
          />
        ))}
      </Box>

      {/* DragOverlay — affiche une preview de la carte en cours de drag */}
      <DragOverlay>
        {activeTask ? (
          <Box
            sx={{
              opacity: 0.9,
              transform: "rotate(2deg)",
              pointerEvents: "none",
            }}
          >
            <TaskCard
              task={activeTask}
              onToggle={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onUpdateTask={() => {}}
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
