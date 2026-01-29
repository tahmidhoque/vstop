"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { deleteFaultyReturn } from "@/lib/actions";
import type { FaultyReturn } from "@/types";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from '@/components/common/SnackbarProvider';

interface FaultyReturnListProps {
  faultyReturns: FaultyReturn[];
  onViewDetails: (faultyReturn: FaultyReturn) => void;
  onDeleted: () => void | Promise<void>;
  isPending: boolean;
}

export default function FaultyReturnList({
  faultyReturns,
  onViewDetails,
  onDeleted,
  isPending,
}: FaultyReturnListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

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

  const getTypeColor = (orderId: string | null): "secondary" | "warning" => {
    return orderId ? "secondary" : "warning";
  };

  const getTypeLabel = (orderId: string | null) => {
    return orderId ? "Post-Sale" : "Pre-Sale";
  };

  const calculateLoss = (product: { price: number }, quantity: number) => {
    return product.price * quantity;
  };

  const handleDelete = async (faultyReturn: FaultyReturn) => {
    const replacementNote = faultyReturn.replacementOrderId
      ? " This will also delete its replacement order."
      : "";
    const confirmed = confirm(
      `Are you sure you want to delete ${faultyReturn.returnNumber}?${replacementNote} This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(faultyReturn.id);
    try {
      await deleteFaultyReturn(faultyReturn.id);
      showSnackbar('Faulty return deleted successfully', 'success');
      await onDeleted();
    } catch (error) {
      showSnackbar('Failed to delete faulty return', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending) {
    return (
      <Paper elevation={2} sx={{ p: 8, textAlign: 'center' }}>
        <LoadingSpinner message="Loading..." />
      </Paper>
    );
  }

  if (faultyReturns.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No faulty returns found.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {faultyReturns.map((fr) => (
            <Card key={fr.id} variant="outlined" sx={{ borderRadius: 0, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                    {fr.returnNumber}
                  </Typography>
                  <Chip
                    label={getTypeLabel(fr.orderId)}
                    color={getTypeColor(fr.orderId)}
                    size="small"
                  />
                  <Chip
                    label={fr.status}
                    color={getStatusColor(fr.status)}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">Product:</Box>{' '}
                    <Box component="span" fontWeight={600}>
                      {fr.product.name}
                      {fr.variant && ` (${fr.variant.flavour})`}
                    </Box>
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">Quantity:</Box>{' '}
                    <Box component="span" fontWeight={600}>{fr.quantity}</Box>
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">Reason:</Box>{' '}
                    {fr.faultyReason}
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">Loss:</Box>{' '}
                    <Box component="span" fontWeight={600} color="error.main">
                      £{calculateLoss(fr.product, fr.quantity).toFixed(2)}
                    </Box>
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">Date:</Box>{' '}
                    {formatDate(fr.createdAt)}
                  </Typography>
                  {fr.orderId && fr.order && (
                    <Typography variant="body2">
                      <Box component="span" color="text.secondary">Order:</Box>{' '}
                      {fr.order.orderNumber}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onViewDetails(fr)}
                  size="small"
                >
                  View Details
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(fr)}
                  size="small"
                  disabled={deletingId === fr.id}
                >
                  {deletingId === fr.id ? "Deleting..." : "Delete"}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Loss</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {faultyReturns.map((fr) => (
                <TableRow key={fr.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {fr.returnNumber}
                      </Typography>
                      {fr.orderId && fr.order && (
                        <Typography variant="caption" color="text.secondary">
                          Order: {fr.order.orderNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(fr.orderId)}
                      color={getTypeColor(fr.orderId)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fr.product.name}</Typography>
                    {fr.variant && (
                      <Typography variant="caption" color="text.secondary">
                        {fr.variant.flavour}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fr.quantity}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fr.faultyReason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fr.status}
                      color={getStatusColor(fr.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      £{calculateLoss(fr.product, fr.quantity).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(fr.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onViewDetails(fr)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(fr)}
                        disabled={deletingId === fr.id}
                      >
                        {deletingId === fr.id ? "Deleting..." : "Delete"}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

