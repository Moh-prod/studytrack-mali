import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Slide,
} from "@mui/material";
import { CloseRounded } from "@mui/icons-material";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

export default function TransactionFormDialog({
  open,
  onClose,
  onSubmit,
  amount,
  setAmount,
  type,
  setType,
  category,
  setCategory,
  date,
  setDate,
  description,
  setDescription,
  categories,
  isEdit,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
    >
      <form onSubmit={onSubmit}>
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {isEdit ? "Modifier Transaction" : "Nouvelle Transaction"}
          <IconButton onClick={onClose} size="small">
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            pt: "10px !important",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant={type === "expense" ? "contained" : "outlined"}
              color="error"
              fullWidth
              onClick={() => {
                setType("expense");
                setCategory("other");
              }}
              sx={{
                borderRadius: 3,
                py: 1,
                backgroundImage:
                  type === "expense"
                    ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                    : "none",
                boxShadow:
                  type === "expense"
                    ? "0 4px 12px rgba(239,68,68,0.25)"
                    : "none",
              }}
            >
              💸 Dépense
            </Button>
            <Button
              variant={type === "income" ? "contained" : "outlined"}
              color="success"
              fullWidth
              onClick={() => {
                setType("income");
                setCategory("salary");
              }}
              sx={{
                borderRadius: 3,
                py: 1,
                backgroundImage:
                  type === "income"
                    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                    : "none",
                boxShadow:
                  type === "income"
                    ? "0 4px 12px rgba(16,185,129,0.25)"
                    : "none",
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
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Catégorie"
            >
              {categories
                .filter((cat) => {
                  if (type === "income")
                    return cat.value === "salary" || cat.value === "other";
                  return cat.value !== "salary";
                })
                .map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </MenuItem>
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
          <Button onClick={onClose} sx={{ borderRadius: 3 }}>
            Annuler
          </Button>
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
  );
}
