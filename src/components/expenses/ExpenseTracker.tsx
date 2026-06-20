import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid,
  Chip,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  AddRounded,
  DeleteOutlineRounded,
  TrendingUpRounded,
  TrendingDownRounded,
  AccountBalanceWalletRounded,
  EditRounded,
  TrackChangesRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
} from "recharts";
import PageContainer from "../layout/PageContainer";
import useTransactions from "../../hooks/useTransactions";
import TransactionFormDialog from "./TransactionFormDialog";

const categories = [
  { value: "food", label: "Alimentation", emoji: "🍔", color: "#FF9F43" },
  { value: "housing", label: "Logement", emoji: "🏠", color: "#48DBFB" },
  { value: "transport", label: "Transports", emoji: "🚗", color: "#1DD1A1" },
  { value: "leisure", label: "Loisirs", emoji: "🎮", color: "#FF6B6B" },
  { value: "education", label: "Études", emoji: "📚", color: "#7C3AED" },
  { value: "salary", label: "Salaire", emoji: "💰", color: "#10B981" },
  { value: "other", label: "Autre", emoji: "🏷️", color: "#8395A7" },
];

const categoryMap = categories.reduce((acc, cat) => {
  acc[cat.value] = cat;
  return acc;
}, {});

export default function ExpenseTracker({ user }) {
  const theme = useTheme();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(user);

  // Budget
  const [budget, setBudget] = useState(100000); // Default budget
  useEffect(() => {
    const saved = localStorage.getItem("monthlyBudget");
    if (saved) setBudget(Number(saved));
  }, []);
  const handleBudgetChange = () => {
    const val = prompt("Entrez votre budget mensuel:", budget);
    if (val && !isNaN(val)) {
      setBudget(Number(val));
      localStorage.setItem("monthlyBudget", val);
    }
  };

  // Modal State for Add/Edit
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filters State
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Stats calculation
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    // Current month expenses for budget
    let currentMonthExpenses = 0;
    const currentMonth = new Date().toISOString().slice(0, 7);

    transactions.forEach((t) => {
      const val = Number(t.amount) || 0;
      if (t.type === "income") income += val;
      else {
        expenses += val;
        if (t.date.startsWith(currentMonth)) {
          currentMonthExpenses += val;
        }
      }
    });
    return {
      income,
      expenses,
      balance: income - expenses,
      currentMonthExpenses,
    };
  }, [transactions]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const payload = {
      amount: Number(amount),
      type,
      category,
      date,
      description: description.trim(),
    };

    if (editId) {
      await updateTransaction(editId, payload);
    } else {
      await addTransaction(payload);
    }
    handleClose();
  };

  const handleClose = () => {
    setEditId(null);
    setAmount("");
    setType("expense");
    setCategory("other");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setOpen(false);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setDate(t.date);
    setDescription(t.description || "");
    setOpen(true);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
    }
    setDeleteConfirmOpen(false);
    setDeleteId(null);
  };

  // Filter & Sort Transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (filterType !== "all") {
      list = list.filter((t) => t.type === filterType);
    }
    if (filterCategory !== "all") {
      list = list.filter((t) => t.category === filterCategory);
    }

    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transactions, filterType, filterCategory, sortBy]);

  // Chart Data Calculations
  const pieChartData = useMemo(() => {
    const dataObj = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const cat = t.category || "other";
        dataObj[cat] = (dataObj[cat] || 0) + Number(t.amount);
      }
    });

    return Object.keys(dataObj).map((cat) => ({
      name: categoryMap[cat]?.label || cat,
      value: dataObj[cat],
      color: categoryMap[cat]?.color || "#8395A7",
    }));
  }, [transactions]);

  const barChartData = useMemo(() => {
    // Group last 5 transactions or day aggregates
    const dateMap = {};
    transactions.forEach((t) => {
      const d = t.date;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, income: 0, expense: 0 };
      }
      if (t.type === "income") {
        dateMap[d].income += Number(t.amount);
      } else {
        dateMap[d].expense += Number(t.amount);
      }
    });

    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 active days
  }, [transactions]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const budgetProgress = Math.min(
    (stats.currentMonthExpenses / budget) * 100,
    100,
  );
  const isOverBudget = stats.currentMonthExpenses > budget;

  return (
    <PageContainer
      title="Finance & Dépenses"
      subtitle="Gère ton budget de manière intelligente et moderne"
    >
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              sx={{
                background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                color: "#FFF",
                boxShadow: "0 8px 32px rgba(124, 58, 237, 0.25)",
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ opacity: 0.8, fontWeight: 600 }}
                  >
                    Solde Actuel
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.balance)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <AccountBalanceWalletRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              sx={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FFF",
                boxShadow: "0 8px 32px rgba(16, 185, 129, 0.25)",
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ opacity: 0.8, fontWeight: 600 }}
                  >
                    Revenus Globaux
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.income)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <TrendingUpRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              sx={{
                background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                color: "#FFF",
                boxShadow: "0 8px 32px rgba(239, 68, 68, 0.25)",
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ opacity: 0.8, fontWeight: 600 }}
                  >
                    Dépenses Globales
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.expenses)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  <TrendingDownRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              sx={{
                background: isOverBudget
                  ? "linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)"
                  : "linear-gradient(135deg, #48DBFB 0%, #0ABDE3 100%)",
                color: "#FFF",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                cursor: "pointer",
              }}
              onClick={handleBudgetChange}
            >
              <CardContent
                sx={{ p: 3, display: "flex", flexDirection: "column" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ opacity: 0.8, fontWeight: 600 }}
                    >
                      Budget Mensuel ({budgetProgress.toFixed(0)}%)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                      {formatCurrency(stats.currentMonthExpenses)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                  >
                    <TrackChangesRounded fontSize="medium" />
                  </Box>
                </Box>
                {/* Progress bar */}
                <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    bgcolor: "rgba(0,0,0,0.2)",
                    borderRadius: 3,
                    mt: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${budgetProgress}%`,
                      height: "100%",
                      bgcolor: "#FFF",
                      borderRadius: 3,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Action Button & Filters Row */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="income">Revenus</MenuItem>
              <MenuItem value="expense">Dépenses</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Catégorie"
            >
              <MenuItem value="all">Toutes</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Trier par"
            >
              <MenuItem value="date-desc">Plus récent</MenuItem>
              <MenuItem value="date-asc">Plus ancien</MenuItem>
              <MenuItem value="amount-desc">Montant élevé</MenuItem>
              <MenuItem value="amount-asc">Montant faible</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setOpen(true)}
          sx={{
            py: 1.2,
            px: 3,
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            borderRadius: 3,
          }}
        >
          Nouvelle Transaction
        </Button>
      </Box>

      {/* Visual Analytics Charts */}
      {transactions.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {pieChartData.length > 0 && (
            <Grid xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}
                  >
                    📊 Répartition des Dépenses
                  </Typography>
                  <Box sx={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(val) => formatCurrency(val)}
                        />
                        <Legend
                          iconSize={10}
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{
                            fontSize: "0.75rem",
                            paddingTop: "10px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          {barChartData.length > 0 && (
            <Grid xs={12} md={pieChartData.length > 0 ? 7 : 12}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}
                  >
                    📈 Flux de Trésorerie Récents
                  </Typography>
                  <Box sx={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={barChartData}>
                        <XAxis
                          dataKey="date"
                          stroke={theme.palette.text.secondary}
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip
                          formatter={(val) => formatCurrency(val)}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                        <Bar
                          dataKey="income"
                          name="Revenus"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expense"
                          name="Dépenses"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Transaction List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              📜 Historique des Transactions
            </Typography>
            <Chip
              label={`${filteredTransactions.length} transaction${filteredTransactions.length > 1 ? "s" : ""}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            />
          </Box>

          {filteredTransactions.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                px: 2,
                color: "text.secondary",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Aucune transaction trouvée
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Commencez par ajouter votre premier revenu ou dépense !
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Box}>
              <Table>
                <TableHead
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.01)",
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Montant
                    </TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence initial={false}>
                    {filteredTransactions.map((t) => {
                      const cat = categoryMap[t.category] || categoryMap.other;
                      const isIncome = t.type === "income";

                      return (
                        <TableRow
                          component={motion.tr}
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          sx={{
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                            },
                          }}
                        >
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            {t.date}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1.5,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  bgcolor: alpha(cat.color, 0.12),
                                  fontSize: "1rem",
                                }}
                              >
                                {cat.emoji}
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {cat.label}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: t.description
                                ? "text.primary"
                                : "text.secondary",
                              fontSize: "0.85rem",
                            }}
                          >
                            {t.description || "—"}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: isIncome ? "success.main" : "error.main",
                              }}
                            >
                              {isIncome
                                ? `+ ${formatCurrency(t.amount)}`
                                : `- ${formatCurrency(t.amount)}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{ display: "flex", justifyContent: "center" }}
                            >
                              <Tooltip title="Modifier">
                                <IconButton
                                  onClick={() => openEdit(t)}
                                  color="primary"
                                  size="small"
                                >
                                  <EditRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  onClick={() => confirmDelete(t.id)}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteOutlineRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      <TransactionFormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        amount={amount}
        setAmount={setAmount}
        type={type}
        setType={setType}
        category={category}
        setCategory={setCategory}
        date={date}
        setDate={setDate}
        description={description}
        setDescription={setDescription}
        categories={categories}
        isEdit={!!editId}
      />

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action
            est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
