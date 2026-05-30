import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Grid, Chip, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import {
  AddRounded, DeleteOutlineRounded, TrendingUpRounded, TrendingDownRounded,
  AccountBalanceWalletRounded, CloseRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend } from 'recharts';
import PageContainer from '../layout/PageContainer';
import useTransactions from '../../hooks/useTransactions';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const categories = [
  { value: 'food', label: 'Alimentation', emoji: '🍔', color: '#FF9F43' },
  { value: 'housing', label: 'Logement', emoji: '🏠', color: '#48DBFB' },
  { value: 'transport', label: 'Transports', emoji: '🚗', color: '#1DD1A1' },
  { value: 'leisure', label: 'Loisirs', emoji: '🎮', color: '#FF6B6B' },
  { value: 'education', label: 'Études', emoji: '📚', color: '#7C3AED' },
  { value: 'salary', label: 'Salaire', emoji: '💰', color: '#10B981' },
  { value: 'other', label: 'Autre', emoji: '🏷️', color: '#8395A7' },
];

const categoryMap = categories.reduce((acc, cat) => {
  acc[cat.value] = cat;
  return acc;
}, {});

export default function ExpenseTracker({ user }) {
  const theme = useTheme();
  const { transactions, addTransaction, deleteTransaction } = useTransactions(user);

  // Modal State
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Filters State
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Stats calculation
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach((t) => {
      const val = Number(t.amount) || 0;
      if (t.type === 'income') income += val;
      else expenses += val;
    });
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    await addTransaction({
      amount: Number(amount),
      type,
      category,
      date,
      description: description.trim(),
    });
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setType('expense');
    setCategory('other');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setOpen(false);
  };

  // Filter & Sort Transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }
    if (filterCategory !== 'all') {
      list = list.filter((t) => t.category === filterCategory);
    }

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transactions, filterType, filterCategory, sortBy]);

  // Chart Data Calculations
  const pieChartData = useMemo(() => {
    const dataObj = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const cat = t.category || 'other';
        dataObj[cat] = (dataObj[cat] || 0) + Number(t.amount);
      }
    });

    return Object.keys(dataObj).map((cat) => ({
      name: categoryMap[cat]?.label || cat,
      value: dataObj[cat],
      color: categoryMap[cat]?.color || '#8395A7',
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
      if (t.type === 'income') {
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
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <PageContainer title="Finance & Dépenses" subtitle="Gère ton budget de manière intelligente et moderne">
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                color: '#FFF',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.25)',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Solde Actuel
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.balance)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <AccountBalanceWalletRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Revenus Globaux
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.income)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <TrendingUpRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={4}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFF',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.25)',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Dépenses Globales
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                    {formatCurrency(stats.expenses)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <TrendingDownRounded fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Action Button & Filters Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Type">
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="income">Revenus</MenuItem>
              <MenuItem value="expense">Dépenses</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} label="Catégorie">
              <MenuItem value="all">Toutes</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.emoji} {c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trier par</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Trier par">
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
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
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
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                    📊 Répartition des Dépenses
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
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
                        <ChartTooltip formatter={(val) => formatCurrency(val)} />
                        <Legend iconSize={10} layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          {barChartData.length > 0 && (
            <Grid item xs={12} md={pieChartData.length > 0 ? 7 : 12}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                    📈 Flux de Trésorerie Récents
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={barChartData}>
                        <XAxis dataKey="date" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} axisLine={false} />
                        <ChartTooltip formatter={(val) => formatCurrency(val)} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                        <Bar dataKey="income" name="Revenus" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Dépenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
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
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              📜 Historique des Transactions
            </Typography>
            <Chip
              label={`${filteredTransactions.length} transaction${filteredTransactions.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
            />
          </Box>

          {filteredTransactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 2, color: 'text.secondary' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Aucune transaction trouvée</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>Commencez par ajouter votre premier revenu ou dépense !</Typography>
            </Box>
          ) : (
            <TableContainer component={Box}>
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Catégorie</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Montant</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence initial={false}>
                    {filteredTransactions.map((t) => {
                      const cat = categoryMap[t.category] || categoryMap.other;
                      const isIncome = t.type === 'income';

                      return (
                        <TableRow
                          component={motion.tr}
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                        >
                          <TableCell sx={{ fontSize: '0.85rem' }}>{t.date}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(cat.color, 0.12), fontSize: '1rem' }}>
                                {cat.emoji}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {cat.label}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: t.description ? 'text.primary' : 'text.secondary', fontSize: '0.85rem' }}>
                            {t.description || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: isIncome ? 'success.main' : 'error.main',
                              }}
                            >
                              {isIncome ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Supprimer">
                              <IconButton onClick={() => deleteTransaction(t.id)} color="error" size="small">
                                <DeleteOutlineRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
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

      {/* Add Transaction Dialog */}
      <Dialog open={open} onClose={handleClose} TransitionComponent={Transition} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Nouvelle Transaction
            <IconButton onClick={handleClose} size="small"><CloseRounded /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant={type === 'expense' ? 'contained' : 'outlined'}
                color="error"
                fullWidth
                onClick={() => { setType('expense'); setCategory('other'); }}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  backgroundImage: type === 'expense' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'none',
                  boxShadow: type === 'expense' ? '0 4px 12px rgba(239,68,68,0.25)' : 'none',
                }}
              >
                💸 Dépense
              </Button>
              <Button
                variant={type === 'income' ? 'contained' : 'outlined'}
                color="success"
                fullWidth
                onClick={() => { setType('income'); setCategory('salary'); }}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  backgroundImage: type === 'income' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'none',
                  boxShadow: type === 'income' ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                }}
              >
                💰 Revenu
              </Button>
            </Box>

            <TextField
              required
              fullWidth
              autoFocus
              type="number"
              label="Montant (FCFA)"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              slotProps={{ htmlInput: { min: 1 } }}
            />

            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Catégorie">
                {categories
                  .filter((cat) => {
                    // Filter categoric options based on income/expense type
                    if (type === 'income') return cat.value === 'salary' || cat.value === 'other';
                    return cat.value !== 'salary';
                  })
                  .map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.emoji} {c.label}</MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              required
              fullWidth
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              fullWidth
              label="Description (optionnelle)"
              placeholder="Ex: Resto, Uber, Achat de livres..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} sx={{ borderRadius: 3 }}>Annuler</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!amount || Number(amount) <= 0}
              sx={{ borderRadius: 3, py: 1.2, px: 3 }}
            >
              Confirmer
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}
