import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import {
  AppBar, Toolbar, Typography, Avatar, IconButton, Button, Container, Card, TextField,
  Box, Select, MenuItem, List, ListItem, ListItemText, LinearProgress, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide, CssBaseline, useMediaQuery, Paper, Switch
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function App() {
  // ======== STATES ========
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [snack, setSnack] = useState({ open: false, msg: "" });
  const [loading, setLoading] = useState(true);
  const [delDialog, setDelDialog] = useState({ open: false, id: null });
  const [edit, setEdit] = useState({ open: false, t: null, text: "", date: "" });

  // ======= THEME MUI =======
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#4caf50" }
    },
    shape: { borderRadius: 18 }
  });

  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  // ======= FIREBASE : AUTH + TASKS =======
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setText("");
      setDate("");
      if (usr) {
        const q = query(collection(db, "tasks"), where("uid", "==", usr.uid));
        const unsubTasks = onSnapshot(q, (snapshot) => {
          let lst = [];
          snapshot.forEach((doc) => {
            lst.push({ ...doc.data(), id: doc.id });
          });
          setTasks(lst);
          setLoading(false);
        });
        return () => unsubTasks();
      } else {
        setLoading(false);
        setTasks([]);
      }
    });
    return () => unsub && unsub();
    // eslint-disable-next-line
  }, []);

  // Ajout de tâche
  const handleAdd = async (e) => {
    e.preventDefault();
    if (text.trim() && date) {
      if (tasks.length >= 5) {
        setSnack({ open: true, msg: "Limite gratuite atteinte (5 tâches max)" });
        return;
      }
      await addDoc(collection(db, "tasks"), {
        uid: user.uid,
        text: text.trim(),
        date,
        done: false,
        notified: false
      });
      setText("");
      setDate("");
      setSnack({ open: true, msg: "Tâche ajoutée !" });
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (delDialog.id) await deleteDoc(doc(db, "tasks", delDialog.id));
    setDelDialog({ open: false, id: null });
    setSnack({ open: true, msg: "Tâche supprimée." });
  };

  // Edition
  const handleEdit = (t) => {
    setEdit({ open: true, t, text: t.text, date: t.date });
  };

  const handleEditSave = async () => {
    await updateDoc(doc(db, "tasks", edit.t.id), { text: edit.text, date: edit.date });
    setEdit({ open: false, t: null, text: "", date: "" });
    setSnack({ open: true, msg: "Tâche modifiée !" });
  };

  // Toggle
  const handleToggle = async (t) => {
    await updateDoc(doc(db, "tasks", t.id), { done: !t.done });
  };

  // Filtres
  const tasksFiltered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "done") return t.done;
    if (filter === "pending") return !t.done;
    return true;
  });

  // Statistiques
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;

  // Dates
  const today = new Date().toISOString().split("T")[0];

  // =========== RENDER ===========
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar */}
      <AppBar position="static" elevation={3}>
        <Toolbar>
          <AssignmentTurnedInIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            StudyTrack Mali
          </Typography>
          {user &&
            <>
              <Switch
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
                color="default"
                sx={{ mr: 2 }}
                inputProps={{ "aria-label": "Mode sombre" }}
              />
              <Avatar sx={{ mr: 2, bgcolor: "#4caf50" }}>
                {user.displayName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </Avatar>
              <IconButton color="inherit" onClick={() => signOut(auth)} title="Déconnexion">
                <LogoutIcon />
              </IconButton>
            </>
          }
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 6, minHeight: "80vh" }}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 5, mt: 4, mb: 6 }}>
          {!user ? (
            <AuthForm setSnack={setSnack} />
          ) : (
            <>
              {/* Barre d'ajout */}
              <Box component="form" autoComplete="off" onSubmit={handleAdd} sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField autoFocus fullWidth placeholder="Ajouter une tâche" value={text} onChange={e => setText(e.target.value)} />
                <TextField type="date" value={date} onChange={e => setDate(e.target.value)} sx={{ maxWidth: "166px" }} />
                <Button variant="contained" type="submit" color="primary">Ajouter</Button>
              </Box>

              {/* Filtres + stats + progress */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Select value={filter} onChange={e => setFilter(e.target.value)}>
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="done">Terminées</MenuItem>
                  <MenuItem value="pending">En cours</MenuItem>
                </Select>
                <Box sx={{ fontWeight: 600, fontSize: 18 }}>
                  {done} / {total} terminées
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={total === 0 ? 0 : (done * 100) / total}
                sx={{ height: 8, borderRadius: 6, mb: 3 }}
              />

              {/* Liste des tâches */}
              {loading ? <LinearProgress sx={{ mt: 5 }} /> : (
                <List>
                  {(tasksFiltered.length === 0) ?
                    <Typography sx={{ mt: 3 }}>Aucune tâche</Typography>
                    : tasksFiltered
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((t, i) => {
                        let overdue = t.date < today && !t.done;
                        return (
                          <ListItem
                            key={t.id}
                            sx={{
                              background: t.done ? "#e8f5e9" : overdue ? "#ffebee" : "#f7f7f7",
                              borderRadius: 3,
                              mb: 2,
                              transition: "all .3s",
                              borderLeft: overdue ? "5px solid #f44336" : t.done ? "5px solid #388e3c" : "5px solid #2196f3",
                              boxShadow: overdue ? "0 0 8px #f4433699" : undefined
                            }}
                            secondaryAction={
                              <>
                                <IconButton onClick={() => handleToggle(t)} color={t.done ? "success" : "primary"}>
                                  <CheckCircleOutlineIcon />
                                </IconButton>
                                <IconButton onClick={() => handleEdit(t)} color="primary">
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => setDelDialog({ open: true, id: t.id })} color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            }
                          >
                            <ListItemText
                              primary={
                                <span style={{
                                  textDecoration: t.done ? "line-through" : undefined,
                                  color: overdue ? "#d32f2f" : "inherit",
                                  fontWeight: overdue ? 600 : 400
                                }}>{t.text}</span>
                              }
                              secondary={t.date}
                            />
                          </ListItem>
                        );
                      })
                  }
                </List>
              )}
            </>
          )}
        </Paper>
      </Container>

      {/* Snackbar (popup succès ou erreur) */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3200}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        TransitionComponent={Transition}
      />

      {/* Dialog SUPPRESSION */}
      <Dialog open={delDialog.open} TransitionComponent={Transition} keepMounted>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Es-tu sûr de vouloir supprimer cette tâche ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDialog({ open: false, id: null })}>Annuler</Button>
          <Button onClick={handleDelete} color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog EDITION */}
      <Dialog open={edit.open} onClose={() => setEdit({ open: false, t: null, text: "", date: "" })} TransitionComponent={Transition} keepMounted>
        <DialogTitle>Modifier la tâche</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus value={edit.text} onChange={e => setEdit({ ...edit, text: e.target.value })} label="Tâche" sx={{ my: 1 }} />
          <TextField fullWidth value={edit.date} onChange={e => setEdit({ ...edit, date: e.target.value })} type="date" label="Date" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit({ open: false, t: null, text: "", date: "" })}>Annuler</Button>
          <Button onClick={handleEditSave} color="primary">Sauver</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

// ============== FORMULAIRE D’AUTH ===============
function AuthForm({ setSnack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");

  const onSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        if (displayName.trim())
          await updateProfile(cred.user, { displayName: displayName.trim() });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
      <TextField
        fullWidth required label="Email"
        margin="normal" type="email"
        value={email} onChange={e => setEmail(e.target.value)}
      />
      <TextField
        fullWidth required label="Mot de passe"
        margin="normal" type="password"
        value={pw} onChange={e => setPw(e.target.value)}
      />
      {!isLogin && (
        <TextField
          fullWidth label="Nom affiché"
          margin="normal"
          value={displayName} onChange={e => setDisplayName(e.target.value)}
        />
      )}
      <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} type="submit">
        {isLogin ? "Connexion" : "Inscription"}
      </Button>
      <Box sx={{ mt: 1, textAlign: "center" }}>
        {isLogin ? "Pas de compte ?" : "Déjà un compte ?"}
        <span
          style={{ color: "#1976d2", cursor: "pointer", marginLeft: 8 }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Créer un compte" : "Connexion"}
        </span>
      </Box>
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  );
}