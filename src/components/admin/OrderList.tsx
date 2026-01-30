"use client";

import { useState } from "react";
import { OrderStatus, OrderType } from "@/generated/enums";
import OrderEditModal from "./OrderEditModal";
import { updateOrderStatus, deleteOrder, deleteAllOrders } from "@/lib/actions";
import { formatDate } from "@/lib/date-utils";
import type { OrderWithItems } from "@/types";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RestoreIcon from '@mui/icons-material/Restore';
import { useSnackbar } from '@/components/common/SnackbarProvider';

interface OrderListProps {
  orders: OrderWithItems[];
}

export default function OrderList({ orders }: OrderListProps) {
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { showSnackbar } = useSnackbar();

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      showSnackbar('Order status updated successfully', 'success');
      window.location.reload();
    } catch (error) {
      showSnackbar('Failed to update order status', 'error');
    }
  };

  const handleEdit = (order: OrderWithItems) => {
    setEditingOrder(order);
  };

  const handleEditSubmit = async () => {
    setEditingOrder(null);
    showSnackbar('Order updated successfully', 'success');
    window.location.reload();
  };

  const handleDelete = async (orderId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    ) {
      setDeletingOrderId(orderId);
      try {
        await deleteOrder(orderId);
        showSnackbar('Order deleted successfully', 'success');
        window.location.reload();
      } catch (error) {
        showSnackbar('Failed to delete order', 'error');
        setDeletingOrderId(null);
      }
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllOrders();
      showSnackbar('All orders and faulty returns deleted successfully', 'success');
      window.location.reload();
    } catch (error) {
      showSnackbar('Failed to delete all orders and faulty returns', 'error');
      setDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  const totalValue = (order: OrderWithItems) => {
    if (order.totalOverride) {
      return Number(order.totalOverride);
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0,
    );

    const manualDiscount = order.manualDiscount
      ? Number(order.manualDiscount)
      : 0;

    return Math.max(0, subtotal - manualDiscount);
  };

  const getOrderTypeChip = (orderType: OrderType) => {
    switch (orderType) {
      case OrderType.PERSONAL_USE:
        return <Chip label="PERSONAL USE" color="secondary" size="small" />;
      case OrderType.REPLACEMENT:
        return <Chip label="REPLACEMENT" color="success" size="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: OrderStatus): "warning" | "error" | "success" | "default" => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "UNFULFILLED":
        return "error";
      case "FULFILLED":
        return "success";
      case "CANCELLED":
        return "default";
      default:
        return "default";
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    unfulfilled: orders.filter((o) => o.status === "UNFULFILLED").length,
    fulfilled: orders.filter((o) => o.status === "FULFILLED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, width: '100%', maxWidth: '100%' }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1, minWidth: 0, maxWidth: { xs: '100%', sm: 'calc(100% - 140px)' }, width: { xs: '100%', sm: 'auto' } }}
        >
          <Tab label={`All (${statusCounts.all})`} value="ALL" />
          <Tab label={`Pending (${statusCounts.pending})`} value="PENDING" />
          <Tab label={`Unfulfilled (${statusCounts.unfulfilled})`} value="UNFULFILLED" />
          <Tab label={`Fulfilled (${statusCounts.fulfilled})`} value="FULFILLED" />
          <Tab label={`Cancelled (${statusCounts.cancelled})`} value="CANCELLED" />
        </Tabs>
        {orders.length > 0 && (
          <Button
            variant="contained"
            color="error"
            onClick={() => setShowDeleteAllConfirm(true)}
            startIcon={<DeleteIcon />}
            size="small"
            sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
          >
            Delete All Orders & Faulty Returns
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '100%' }}>
        {filteredOrders.length === 0 ? (
          <Paper elevation={2} sx={{ p: 8, textAlign: 'center', width: '100%', maxWidth: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              No orders found
            </Typography>
          </Paper>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} elevation={2} sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2, width: '100%', maxWidth: '100%' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: { xs: '100%', sm: 'calc(100% - 200px)' } }}>
                    <Typography variant="h6" component="h3" fontWeight={600} sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {order.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Order: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.orderNumber}</Box> • {formatDate(order.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
                    {getOrderTypeChip(order.orderType)}
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        £{totalValue(order).toFixed(2)}
                      </Typography>
                      {(order.manualDiscount || order.totalOverride) && (
                        <Typography variant="caption" color="text.secondary">
                          {order.totalOverride
                            ? "Override"
                            : order.manualDiscount
                            ? `-£${Number(order.manualDiscount).toFixed(2)}`
                            : ""}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Items:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {order.items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, minWidth: 0, wordBreak: 'break-word' }}>
                        {item.product.name}
                        {item.flavour && ` (${item.flavour})`}
                        <Box component="span" sx={{ ml: 1 }}>× {item.quantity}</Box>
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                        £{Number(item.priceAtTime).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>

              <CardActions sx={{ p: { xs: 2, sm: 2 }, pt: 0, flexWrap: 'wrap', gap: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box', m: 0 }}>
                {order.status === "PENDING" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(order)}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      startIcon={<WarningAmberIcon />}
                      onClick={() => handleStatusChange(order.id, "UNFULFILLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Mark </Box>Unfulfilled
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleStatusChange(order.id, "FULFILLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Mark </Box>Fulfilled
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleStatusChange(order.id, "CANCELLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
                {order.status === "UNFULFILLED" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(order)}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleStatusChange(order.id, "FULFILLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Mark Fulfilled
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleStatusChange(order.id, "CANCELLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
                {order.status === "FULFILLED" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleStatusChange(order.id, "CANCELLED")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
                {order.status === "CANCELLED" && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleStatusChange(order.id, "PENDING")}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      Restore
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingOrderId === order.id}
                      sx={{ width: { xs: 'calc(50% - 4px)', sm: 'auto' }, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
                    >
                      {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSubmit}
        />
      )}

      <Dialog
        open={showDeleteAllConfirm}
        onClose={() => !deletingAll && setShowDeleteAllConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete All Orders & Faulty Returns</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all {orders.length} order{orders.length !== 1 ? "s" : ""}?
            This action cannot be undone. This will permanently delete all order history,
            including replacement orders, and all faulty returns.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowDeleteAllConfirm(false)}
            disabled={deletingAll}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAll}
            disabled={deletingAll}
            variant="contained"
            color="error"
            startIcon={deletingAll ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deletingAll ? "Deleting..." : "Delete All Orders & Faulty Returns"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
