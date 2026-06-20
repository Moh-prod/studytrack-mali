import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Box,
  TextField,
  IconButton,
  Fab,
  Snackbar,
  Slide,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Typography,
  Pagination,
} from "@mui/material";
import {
  AddRounded,
  SearchRounded,
  ViewListRounded,
  ViewKanbanRounded,
} from "@mui/icons-material";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../layout/PageContainer";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import TaskFilters from "./TaskFilters";
import KanbanBoard from "./KanbanBoard";
import ConfirmDialog from "../common/ConfirmDialog";
import useTaskStore from "../../store/useTaskStore";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Nombre de tâches affichées par page en vue liste */
const ITEMS_PER_PAGE = 20;

/**
 * Comparateur de dates pour le tri — les tâches sans date arrivent en DERNIER.
 * Corrige le bug précédent où les tâches sans date remontaient en premier
 * (localeCompare('', 'YYYY-MM-DD') retourne -1 donc elles passaient devant).
 */
function compareDates(a, b) {
  const dateA = a.date || "";
  const dateB = b.date || "";
  // Cas sans date : les mettre à la fin
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1; // a sans date → va en dernier
  if (!dateB) return -1; // b sans date → va en dernier
  return dateA.localeCompare(dateB);
}

// Props now come from App.js — no internal useTasks call (eliminates double Firestore subscription)
function TasksPage({ user }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const tasks = useTaskStore((state) => state.tasks);
  const addTaskStore = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTask = useTaskStore((state) => state.toggleTask);

  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [delTask, setDelTask] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((t) => t.text.toLowerCase().includes(s));
    }
    if (filter !== "all") {
      list = list.filter((t) => {
        const status = t.status || (t.done ? "done" : "todo");
        return status === filter;
      });
    }
    if (categoryFilter !== "all") {
      list = list.filter((t) => (t.category || "personal") === categoryFilter);
    }
    list.sort((a, b) => {
      if (sortBy === "date") return compareDates(a, b);
      if (sortBy === "priority")
        return (
          (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        );
      if (sortBy === "category")
        return (a.category || "").localeCompare(b.category || "");
      return 0;
    });
    return list;
  }, [tasks, search, filter, sortBy, categoryFilter]);

  // Pagination — réinitialiser la page quand les filtres changent
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedList = useMemo(
    () =>
      filtered.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE,
      ),
    [filtered, safePage],
  );

  const handlePageChange = useCallback((_, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Réinitialiser la page à 1 lors d'un changement de filtre/recherche
  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleAdd = useCallback(
    async (data) => {
      await addTaskStore(user, data);
      setSnack({ open: true, msg: "Tâche ajoutée !" });
    },
    [addTaskStore, user],
  );

  const handleEdit = useCallback((task) => {
    setEditData(task);
    setFormOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (data) => {
      if (editData) {
        await updateTask(editData.id, data);
        setEditData(null);
        setSnack({ open: true, msg: "Tâche modifiée !" });
      }
    },
    [editData, updateTask],
  );

  const handleNewSubmit = useCallback(
    async (data) => {
      if (editData) {
        await handleEditSubmit(data);
      } else {
        await handleAdd(data);
      }
    },
    [editData, handleEditSubmit, handleAdd],
  );

  const handleDelete = useCallback(async () => {
    if (delTask) {
      await deleteTask(delTask.id);
      setDelTask(null);
      setSnack({ open: true, msg: "Tâche supprimée." });
    }
  }, [delTask, deleteTask]);

  const handleOpenForm = useCallback(() => {
    setEditData(null);
    setFormOpen(true);
  }, []);
  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditData(null);
  }, []);
  const handleCloseSnack = useCallback(
    () => setSnack((s) => ({ ...s, open: false })),
    [],
  );
  const handleSetDelTask = useCallback((task) => setDelTask(task), []);
  const handleCancelDel = useCallback(() => setDelTask(null), []);

  return (
    <PageContainer
      title="Mes Tâches"
      subtitle={`${tasks.length} tâche${tasks.length > 1 ? "s" : ""} au total`}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="list">
            <ViewListRounded />
          </ToggleButton>
          <ToggleButton value="kanban">
            <ViewKanbanRounded />
          </ToggleButton>
        </ToggleButtonGroup>
        {!isMobile && (
          <IconButton
            onClick={handleOpenForm}
            sx={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              color: "#FFF",
              "&:hover": {
                background: "linear-gradient(135deg, #5B21B6, #0891B2)",
              },
            }}
          >
            <AddRounded />
          </IconButton>
        )}
      </Box>

      {/* Filters */}
      <TaskFilters
        filter={filter}
        setFilter={(v) => {
          setFilter(v);
          setPage(1);
        }}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categoryFilter={categoryFilter}
        setCategoryFilter={(v) => {
          setCategoryFilter(v);
          setPage(1);
        }}
      />

      {/* Content */}
      {view === "list" ? (
        <>
          <AnimatePresence>
            {filtered.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                <Typography variant="h6">Aucune tâche trouvée</Typography>
                <Typography variant="body2">
                  Ajoute une tâche pour commencer !
                </Typography>
              </Box>
            ) : (
              paginatedList.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onEdit={handleEdit}
                  onDelete={handleSetDelTask}
                  onUpdateTask={updateTask}
                />
              ))
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={safePage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": { borderRadius: 2 },
                }}
              />
            </Box>
          )}

          {/* Info pagination */}
          {filtered.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                color: "text.secondary",
                mb: 1,
              }}
            >
              Affichage{" "}
              {Math.min((safePage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
              {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} sur{" "}
              {filtered.length} tâche{filtered.length > 1 ? "s" : ""}
            </Typography>
          )}
        </>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onToggle={toggleTask}
          onEdit={handleEdit}
          onDelete={handleSetDelTask}
          onUpdateTask={updateTask}
        />
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          onClick={handleOpenForm}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <AddRounded />
        </Fab>
      )}

      <TaskForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleNewSubmit}
        initialData={editData}
      />

      <ConfirmDialog
        open={Boolean(delTask)}
        title="Supprimer cette tâche ?"
        message={`"${delTask?.text}" sera supprimée définitivement.`}
        onConfirm={handleDelete}
        onCancel={handleCancelDel}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        message={snack.msg}
        TransitionComponent={Transition}
      />
    </PageContainer>
  );
}

export default TasksPage;
