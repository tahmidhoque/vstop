"use client";

import React, { useState, useTransition, useMemo } from "react";
import { getReportsData } from "@/lib/actions";
import { formatDate } from "@/lib/date-utils";
import type { OrderWithItems, ReportsData } from "@/types";
import { OrderStatus } from "@/generated/enums";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/common/StatCard';
import { useSnackbar } from '@/components/common/SnackbarProvider';

interface StatusFilters {
  PENDING: boolean;
  UNFULFILLED: boolean;
  FULFILLED: boolean;
  CANCELLED: boolean;
}

interface ReportsPageClientProps {
  initialData: ReportsData;
  initialStartDate: Date;
  initialEndDate: Date;
  initialStatusFilters: StatusFilters;
}

export default function ReportsPageClient({
  initialData,
  initialStartDate,
  initialEndDate,
  initialStatusFilters,
}: ReportsPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [reportsData, setReportsData] = useState<ReportsData>(initialData);
  const [startDate, setStartDate] = useState<string>(
    initialStartDate.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate.toISOString().split("T")[0],
  );
  const [statusFilters, setStatusFilters] =
    useState<StatusFilters>(initialStatusFilters);
  const [sortBy, setSortBy] = useState<
    "product" | "quantity" | "revenue" | "orders"
  >("revenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { showSnackbar } = useSnackbar();

  const handleDateRangeChange = () => {
    startTransition(async () => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        showSnackbar("Start date must be before or equal to end date", "error");
        return;
      }

      const includeStatuses: OrderStatus[] = [];
      if (statusFilters.PENDING) includeStatuses.push(OrderStatus.PENDING);
      if (statusFilters.UNFULFILLED)
        includeStatuses.push(OrderStatus.UNFULFILLED);
      if (statusFilters.FULFILLED) includeStatuses.push(OrderStatus.FULFILLED);
      if (statusFilters.CANCELLED)
        includeStatuses.push(OrderStatus.CANCELLED);

      const data = await getReportsData(start, end, includeStatuses);
      setReportsData(data);
    });
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const totalValue = (order: OrderWithItems) => {
    return order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0,
    );
  };

  const sortedProductBreakdown = useMemo(() => {
    const breakdown = [...(reportsData.productBreakdown || [])];
    breakdown.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "product":
          comparison = a.productName.localeCompare(b.productName);
          break;
        case "quantity":
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case "revenue":
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case "orders":
          comparison = a.orderCount - b.orderCount;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return breakdown;
  }, [reportsData.productBreakdown, sortBy, sortDirection]);

  const handleSort = (column: "product" | "quantity" | "revenue" | "orders") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
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

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
          Reports
        </Typography>

        {/* Date Range Selector */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Date Range
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handleDateRangeChange}
            disabled={isPending}
            size="large"
            startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isPending ? "Loading..." : "Update Report"}
          </Button>
        </Paper>

        {/* Status Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Order Status Filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select which order statuses to include in the report. Filters apply to all statistics, sales calculations, and the transactions list.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilters.PENDING}
                    onChange={(e) =>
                      setStatusFilters({
                        ...statusFilters,
                        PENDING: e.target.checked,
                      })
                    }
                    disabled={isPending}
                  />
                }
                label="Pending"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilters.UNFULFILLED}
                    onChange={(e) =>
                      setStatusFilters({
                        ...statusFilters,
                        UNFULFILLED: e.target.checked,
                      })
                    }
                    disabled={isPending}
                  />
                }
                label="Unfulfilled"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilters.FULFILLED}
                    onChange={(e) =>
                      setStatusFilters({
                        ...statusFilters,
                        FULFILLED: e.target.checked,
                      })
                    }
                    disabled={isPending}
                  />
                }
                label="Fulfilled"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={statusFilters.CANCELLED}
                    onChange={(e) =>
                      setStatusFilters({
                        ...statusFilters,
                        CANCELLED: e.target.checked,
                      })
                    }
                    disabled={isPending}
                  />
                }
                label="Cancelled"
              />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ bgcolor: 'info.light' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              How to Use Status Filters
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>Check the boxes for statuses you want to include in the report</li>
              <li>Click &quot;Update Report&quot; after changing filters to refresh the data</li>
              <li>Example: To see only completed orders, check &quot;Fulfilled&quot; and uncheck all others</li>
              <li>Note: Cancelled orders, personal use orders, and replacement orders are always excluded from sales calculations</li>
            </Box>
          </Alert>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Orders"
              value={reportsData.totalOrders}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Cancelled Orders"
              value={reportsData.cancelledOrders}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Fulfilled Orders"
              value={reportsData.fulfilledOrders}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Unfulfilled Orders"
              value={reportsData.unfulfilledOrders}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Total Sales Card */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            border: 2,
            borderColor: 'primary.main',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Sales
          </Typography>
          <Typography variant="h3" component="div" fontWeight={700} color="primary.main" gutterBottom>
            {formatCurrency(reportsData.totalSales)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Based on selected filters (excluding cancelled orders, personal use orders, replacement orders, and faulty returns from sales)
          </Typography>
        </Paper>

        {/* Faulty Losses & Replacement Orders */}
        {reportsData.faultyLosses && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  border: 2,
                  borderColor: 'error.main',
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Faulty Stock Losses
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Total Loss</Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {formatCurrency(reportsData.faultyLosses.totalLoss)}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Pre-Sale Faulty</Typography>
                    <Typography variant="h6" fontWeight={600} color="warning.main">
                      {formatCurrency(reportsData.faultyLosses.preSaleLoss)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reportsData.faultyLosses.preSaleCount} item(s)
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">Post-Sale Returns</Typography>
                    <Typography variant="h6" fontWeight={600} color="secondary.main">
                      {formatCurrency(reportsData.faultyLosses.postSaleLoss)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reportsData.faultyLosses.postSaleCount} item(s)
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Total faulty items: {reportsData.faultyLosses.count}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  border: 2,
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Replacement Orders
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Total Replacements</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {reportsData.replacementOrders?.length || 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Replacement orders are free replacements for faulty items and do not count towards revenue.
                </Typography>
                {reportsData.replacementOrders && reportsData.replacementOrders.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Recent Replacements:
                    </Typography>
                    <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                      {reportsData.replacementOrders.slice(0, 5).map((order) => (
                        <Box key={order.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                          <Typography variant="caption">{order.orderNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Product Breakdown */}
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Product Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales breakdown by product for the selected period
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            {!reportsData.productBreakdown || reportsData.productBreakdown.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No product sales found in the selected date range
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === "product"}
                          direction={sortBy === "product" ? sortDirection : "asc"}
                          onClick={() => handleSort("product")}
                        >
                          Product
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortBy === "quantity"}
                          direction={sortBy === "quantity" ? sortDirection : "asc"}
                          onClick={() => handleSort("quantity")}
                        >
                          Quantity Sold
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortBy === "revenue"}
                          direction={sortBy === "revenue" ? sortDirection : "asc"}
                          onClick={() => handleSort("revenue")}
                        >
                          Total Revenue
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortBy === "orders"}
                          direction={sortBy === "orders" ? sortDirection : "asc"}
                          onClick={() => handleSort("orders")}
                        >
                          Orders
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedProductBreakdown.map((product) => (
                      <TableRow
                        key={product.productId}
                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {product.productName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {product.totalQuantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(product.totalRevenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {product.orderCount}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>Total</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {sortedProductBreakdown.reduce(
                          (sum, p) => sum + p.totalQuantity,
                          0,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(
                          sortedProductBreakdown.reduce(
                            (sum, p) => sum + p.totalRevenue,
                            0,
                          ),
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {reportsData.orders
                          .filter((order) => order.status !== "CANCELLED")
                          .length}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        {/* Transactions List */}
        <Paper elevation={2}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reportsData.orders.length} transaction{reportsData.orders.length !== 1 ? "s" : ""} in selected date range
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            {reportsData.orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No transactions found in the selected date range
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {reportsData.orders.map((order) => (
                  <Box
                    key={order.id}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      pb: 3,
                      '&:last-child': { borderBottom: 0, pb: 0 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {order.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(totalValue(order))}
                        </Typography>
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
                          sx={{ display: 'flex', justifyContent: 'space-between' }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {item.product.name}
                            {item.flavour && ` (${item.flavour})`} × {item.quantity}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(Number(item.priceAtTime))}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </AdminLayout>
  );
}
