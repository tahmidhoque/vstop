"use client";

import React, { useState } from "react";
import { createReplacementOrder } from "@/lib/actions";
import type { FaultyReturn } from "@/types";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface CreateReplacementOrderModalProps {
  faultyReturn: FaultyReturn;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReplacementOrderModal({
  faultyReturn,
  onClose,
  onSuccess,
}: CreateReplacementOrderModalProps) {
  const [username, setUsername] = useState(
    faultyReturn.order?.username || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!username.trim()) {
        throw new Error("Please enter a customer name");
      }

      await createReplacementOrder(faultyReturn.id, username);
      showSnackbar('Replacement order created successfully', 'success');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create replacement order";
      setError(message);
      showSnackbar(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Create Replacement Order
          </Typography>
          <IconButton onClick={onClose} disabled={isSubmitting} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Replacement Details
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>
                <strong>Product:</strong> {faultyReturn.product.name}
                {faultyReturn.variant && ` (${faultyReturn.variant.flavour})`}
              </li>
              <li>
                <strong>Quantity:</strong> {faultyReturn.quantity}
              </li>
              <li>
                <strong>Return #:</strong> {faultyReturn.returnNumber}
              </li>
            </Box>
          </Alert>

          <TextField
            fullWidth
            label="Customer Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter customer name"
            required
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <Alert severity="warning">
            <strong>Note:</strong> This will create a free replacement order (£0.00) and automatically deduct {faultyReturn.quantity} unit(s) from stock. The order will be marked as a replacement and will not count towards revenue.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 2 }}>
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            variant="outlined"
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={isSubmitting}
            size="large"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? "Creating..." : "Create Replacement Order"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

