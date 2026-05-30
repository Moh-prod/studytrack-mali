import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Slide } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ConfirmDialog({
  open,
  title = 'Confirmer',
  message = 'Es-tu sûr ?',
  onConfirm,
  onCancel,
  confirmColor = 'error',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
}) {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCancel}
      PaperProps={{ sx: { minWidth: 340 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ borderRadius: 3 }}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" sx={{ borderRadius: 3 }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
