"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { deleteFaultyReturn, updateFaultyReturnStatus } from "@/lib/actions";
import type { FaultyReturn, ReturnStatus } from "@/types";
import CreateReplacementOrderModal from "./CreateReplacementOrderModal";
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface FaultyReturnModalProps {
  faultyReturn: FaultyReturn;
  onClose: () => void;
}

export default function FaultyReturnModal({
  faultyReturn,
  onClose,
}: FaultyReturnModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSnackbar } = useSnackbar();

  const handleStatusUpdate = async (newStatus: ReturnStatus) => {
    setError("");
    setIsUpdating(true);

    try {
      await updateFaultyReturnStatus(faultyReturn.id, newStatus);
      showSnackbar('Status updated successfully', 'success');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      showSnackbar('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplacementCreated = () => {
    setShowReplacementModal(false);
    showSnackbar('Replacement order created successfully', 'success');
    onClose();
  };

  const handleDelete = async () => {
    const replacementNote = faultyReturn.replacementOrderId
      ? " This will also delete its replacement order."
      : "";
    const confirmed = confirm(
      `Are you sure you want to delete ${faultyReturn.returnNumber}?${replacementNote} This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteFaultyReturn(faultyReturn.id);
      showSnackbar('Faulty return deleted successfully', 'success');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete faulty return");
      showSnackbar('Failed to delete faulty return', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateLoss = () => {
    return faultyReturn.product.price * faultyReturn.quantity;
  };

  const getStatusColor = (status: string): "warning" | "info" | "success" | "default" => {
    switch (status) {
      case "REPORTED":
        return "warning";
      case "INSPECTED":
        return "info";
      case "REPLACED":
        return "success";
      case "DISPOSED":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {faultyReturn.returnNumber}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={faultyReturn.orderId ? "Post-Sale" : "Pre-Sale"}
                  color={faultyReturn.orderId ? "secondary" : "warning"}
                  size="small"
                />
                <Chip
                  label={faultyReturn.status}
                  color={getStatusColor(faultyReturn.status)}
                  size="small"
                />
              </Box>
            </Box>
            <IconButton onClick={onClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Product Information */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Product Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Product:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {faultyReturn.product.name}
                  </Typography>
                </Grid>
                {faultyReturn.variant && (
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Variant:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {faultyReturn.variant.flavour}
                    </Typography>
                  </Grid>
                )}
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {faultyReturn.quantity}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Unit Price:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    £{faultyReturn.product.price.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600}>Total Loss:</Typography>
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      £{calculateLoss().toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Faulty Details */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Faulty Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Reason:</Typography>
                  <Typography variant="body2">{faultyReturn.faultyReason}</Typography>
                </Box>
                {faultyReturn.notes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Notes:</Typography>
                    <Typography variant="body2">{faultyReturn.notes}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">Reported:</Typography>
                  <Typography variant="body2">{formatDate(faultyReturn.createdAt)}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Order Information (Post-Sale) */}
            {faultyReturn.orderId && faultyReturn.order && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Order Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Order Number:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {faultyReturn.order.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Customer:</Typography>
                    <Typography variant="body2">{faultyReturn.order.username}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Order Status:</Typography>
                    <Typography variant="body2">{faultyReturn.order.status}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Replacement Order Information */}
            {faultyReturn.replacementOrderId && faultyReturn.replacementOrder && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Replacement Order
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Order Number:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {faultyReturn.replacementOrder.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Customer:</Typography>
                    <Typography variant="body2">{faultyReturn.replacementOrder.username}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Typography variant="body2">{faultyReturn.replacementOrder.status}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Status Update Actions */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Update Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {faultyReturn.status === "REPORTED" && (
                  <Button
                    variant="contained"
                    onClick={() => handleStatusUpdate("INSPECTED")}
                    disabled={isUpdating || isDeleting}
                    size="large"
                  >
                    {isUpdating ? <CircularProgress size={20} color="inherit" /> : "Mark as Inspected"}
                  </Button>
                )}
                {(faultyReturn.status === "REPORTED" || faultyReturn.status === "INSPECTED") && (
                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => handleStatusUpdate("DISPOSED")}
                    disabled={isUpdating || isDeleting}
                    size="large"
                  >
                    {isUpdating ? <CircularProgress size={20} color="inherit" /> : "Mark as Disposed"}
                  </Button>
                )}
              </Box>
            </Box>

            {/* Create Replacement Order (Post-Sale Only) */}
            {faultyReturn.orderId &&
              !faultyReturn.replacementOrderId &&
              faultyReturn.status !== "DISPOSED" && (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={() => setShowReplacementModal(true)}
                  size="large"
                  disabled={isDeleting}
                >
                  Create Replacement Order
                </Button>
              )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 2, flexWrap: 'wrap' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth={isMobile}
            size="large"
            disabled={isDeleting}
          >
            Close
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            fullWidth={isMobile}
            size="large"
            disabled={isDeleting || isUpdating}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? "Deleting..." : "Delete Return"}
          </Button>
        </DialogActions>
      </Dialog>

      {showReplacementModal && (
        <CreateReplacementOrderModal
          faultyReturn={faultyReturn}
          onClose={() => setShowReplacementModal(false)}
          onSuccess={handleReplacementCreated}
        />
      )}
    </>
  );
}

