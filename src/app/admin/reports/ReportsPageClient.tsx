"use client";

import React, { useState, useTransition, useMemo, useEffect, useCallback } from "react";
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
import ButtonGroup from '@mui/material/ButtonGroup';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/common/StatCard';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

type DatePreset = '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

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
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('7days');
  const [showFilters, setShowFilters] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Auto-update when filters change
  const fetchReportData = useCallback(async () => {
    startTransition(async () => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

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
      } catch (error) {
        showSnackbar("Failed to fetch report data", "error");
        console.error(error);
      }
    });
  }, [startDate, endDate, statusFilters, showSnackbar]);

  // Auto-update when dates or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReportData();
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, statusFilters, fetchReportData]);

  // Handle date preset selection
  const handleDatePreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case '7days':
        start.setDate(today.getDate() - 7);
        break;
      case '30days':
        start.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        return; // Don't change dates for custom
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const totalValue = (order: OrderWithItems) => {
    // If total override is set, use it
    if (order.totalOverride) {
      return Number(order.totalOverride);
    }
    
    // Calculate subtotal
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0,
    );
    
    // Apply manual discount if set
    const manualDiscount = order.manualDiscount ? Number(order.manualDiscount) : 0;
    
    return Math.max(0, subtotal - manualDiscount);
  };

  // Export to CSV functionality
  const exportToCSV = () => {
    try {
      // Product breakdown CSV
      const productHeaders = ['Product', 'Quantity Sold', 'Total Revenue', 'Number of Orders'];
      const productRows = sortedProductBreakdown.map(p => [
        p.productName,
        p.totalQuantity.toString(),
        p.totalRevenue.toFixed(2),
        p.orderCount.toString()
      ]);
      
      // Transactions CSV
      const transactionHeaders = ['Date', 'Order Number', 'Customer', 'Status', 'Items', 'Total'];
      const transactionRows = filteredTransactions.map(order => [
        formatDate(order.createdAt),
        order.orderNumber || '',
        order.username,
        order.status,
        order.items.map(item => `${item.product.name}${item.flavour ? ` (${item.flavour})` : ''} x${item.quantity}`).join('; '),
        totalValue(order).toFixed(2)
      ]);

      // Combine into one CSV
      let csv = '=== SUMMARY ===\n';
      csv += `Date Range:,${startDate} to ${endDate}\n`;
      csv += `Total Orders:,${reportsData.totalOrders}\n`;
      csv += `Fulfilled Orders:,${reportsData.fulfilledOrders}\n`;
      csv += `Cancelled Orders:,${reportsData.cancelledOrders}\n`;
      csv += `Unfulfilled Orders:,${reportsData.unfulfilledOrders}\n`;
      csv += `Total Sales:,£${reportsData.totalSales.toFixed(2)}\n\n`;

      if (reportsData.faultyLosses) {
        csv += `Faulty Losses:,£${reportsData.faultyLosses.totalLoss.toFixed(2)}\n`;
        csv += `Pre-Sale Losses:,£${reportsData.faultyLosses.preSaleLoss.toFixed(2)}\n`;
        csv += `Post-Sale Losses:,£${reportsData.faultyLosses.postSaleLoss.toFixed(2)}\n\n`;
      }

      csv += '\n=== PRODUCT BREAKDOWN ===\n';
      csv += productHeaders.join(',') + '\n';
      csv += productRows.map(row => row.join(',')).join('\n');

      csv += '\n\n=== TRANSACTIONS ===\n';
      csv += transactionHeaders.join(',') + '\n';
      csv += transactionRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSnackbar('Report exported successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to export report', 'error');
      console.error(error);
    }
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

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!transactionSearch.trim()) {
      return reportsData.orders;
    }
    
    const searchLower = transactionSearch.toLowerCase();
    return reportsData.orders.filter(order => 
      order.username.toLowerCase().includes(searchLower) ||
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.items.some(item => 
        item.product.name.toLowerCase().includes(searchLower) ||
        item.flavour?.toLowerCase().includes(searchLower)
      )
    );
  }, [reportsData.orders, transactionSearch]);

  // Limit displayed transactions
  const displayedTransactions = showAllTransactions 
    ? filteredTransactions 
    : filteredTransactions.slice(0, 10);

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
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
              >
                Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                {startDate} to {endDate}
                {isPending && (
                  <CircularProgress size={16} sx={{ ml: 2 }} />
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  minWidth: { xs: 44, sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Filters</Box>
                <FilterListIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                onClick={exportToCSV}
                disabled={isPending}
                sx={{ 
                  borderRadius: '8px', 
                  fontWeight: 600,
                  minWidth: { xs: 44, sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Export</Box>
                <DownloadIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Collapsible Filters Section */}
        <Collapse in={showFilters}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 }, bgcolor: 'grey.50' }}>
            {/* Date Range Presets */}
            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarTodayIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Date Range
                </Typography>
                <Tooltip title="Select a preset period or choose custom dates">
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
              
              {/* Mobile-friendly preset buttons */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' },
                gap: 1,
                mb: 3
              }}>
                <Button
                  onClick={() => handleDatePreset('7days')}
                  variant={selectedPreset === '7days' ? 'contained' : 'outlined'}
                  disabled={isPending}
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    py: 1
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  onClick={() => handleDatePreset('30days')}
                  variant={selectedPreset === '30days' ? 'contained' : 'outlined'}
                  disabled={isPending}
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    py: 1
                  }}
                >
                  Last 30 Days
                </Button>
                <Button
                  onClick={() => handleDatePreset('thisMonth')}
                  variant={selectedPreset === 'thisMonth' ? 'contained' : 'outlined'}
                  disabled={isPending}
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    py: 1
                  }}
                >
                  This Month
                </Button>
                <Button
                  onClick={() => handleDatePreset('lastMonth')}
                  variant={selectedPreset === 'lastMonth' ? 'contained' : 'outlined'}
                  disabled={isPending}
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    py: 1
                  }}
                >
                  Last Month
                </Button>
                <Button
                  onClick={() => setSelectedPreset('custom')}
                  variant={selectedPreset === 'custom' ? 'contained' : 'outlined'}
                  disabled={isPending}
                  fullWidth
                  sx={{ 
                    borderRadius: '8px',
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    py: 1
                  }}
                >
                  Custom
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    disabled={isPending}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: 'background.paper',
                        borderRadius: '8px'
                      } 
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    disabled={isPending}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: 'background.paper',
                        borderRadius: '8px'
                      } 
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Status Filters */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FilterListIcon color="primary" fontSize="small" />
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Order Status Filters
                </Typography>
                <Tooltip title="Select which order statuses to include in the report. Changes are applied automatically.">
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
              
              <Grid container spacing={2}>
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                          Pending
                        </Typography>
                        <Chip 
                          label={reportsData.orders.filter(o => o.status === 'PENDING').length} 
                          size="small"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </Box>
                    }
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                          Unfulfilled
                        </Typography>
                        <Chip 
                          label={reportsData.unfulfilledOrders} 
                          size="small"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </Box>
                    }
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                          Fulfilled
                        </Typography>
                        <Chip 
                          label={reportsData.fulfilledOrders} 
                          size="small" 
                          color="success"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </Box>
                    }
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
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                          Cancelled
                        </Typography>
                        <Chip 
                          label={reportsData.cancelledOrders} 
                          size="small"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Collapse>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Tooltip title="Total number of customer orders in the selected period">
              <Box>
                <StatCard
                  title="Total Orders"
                  value={reportsData.totalOrders}
                  color="primary"
                />
              </Box>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Tooltip title="Orders that have been successfully completed">
              <Box>
                <StatCard
                  title="Fulfilled Orders"
                  value={reportsData.fulfilledOrders}
                  color="success"
                />
              </Box>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Tooltip title="Orders awaiting fulfilment">
              <Box>
                <StatCard
                  title="Unfulfilled Orders"
                  value={reportsData.unfulfilledOrders}
                  color="warning"
                />
              </Box>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Tooltip title="Orders that were cancelled (stock restored)">
              <Box>
                <StatCard
                  title="Cancelled Orders"
                  value={reportsData.cancelledOrders}
                  color="error"
                />
              </Box>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Total Sales Card */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: { xs: 3, sm: 4 },
            border: 2,
            borderColor: 'primary.main',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              fontWeight={600}
              sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
            >
              Total Sales Revenue
            </Typography>
            <Tooltip title="Total revenue from customer orders. Excludes cancelled orders, personal use orders, replacement orders, and adjusts for faulty returns.">
              <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
          <Typography 
            variant="h2" 
            component="div" 
            fontWeight={700} 
            color="primary.main" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
              wordBreak: 'break-word'
            }}
          >
            {formatCurrency(reportsData.totalSales)}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
          >
            Based on active filters • Customer orders only
          </Typography>
        </Paper>

        {/* Faulty Losses & Replacement Orders */}
        {reportsData.faultyLosses && (
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  border: 2,
                  borderColor: 'error.main',
                  bgcolor: '#fef2f2',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Faulty Stock Losses
                  </Typography>
                  <Tooltip title="Total value of faulty stock in this period">
                    <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
                <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: { xs: 2, sm: 3 }, 
                  p: { xs: 1.5, sm: 2 }, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                  >
                    Total Loss
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={700} 
                    color="error.main"
                    sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                  >
                    {formatCurrency(reportsData.faultyLosses.totalLoss)}
                  </Typography>
                </Box>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper', borderRadius: 2 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                      >
                        Pre-Sale Faulty
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={700} 
                        color="warning.main" 
                        sx={{ my: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {formatCurrency(reportsData.faultyLosses.preSaleLoss)}
                      </Typography>
                      <Chip 
                        label={`${reportsData.faultyLosses.preSaleCount} item(s)`}
                        size="small"
                        sx={{ mt: 0.5, fontSize: { xs: '0.688rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper', borderRadius: 2 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                      >
                        Post-Sale Returns
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={700} 
                        color="secondary.main" 
                        sx={{ my: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {formatCurrency(reportsData.faultyLosses.postSaleLoss)}
                      </Typography>
                      <Chip 
                        label={`${reportsData.faultyLosses.postSaleCount} item(s)`}
                        size="small"
                        sx={{ mt: 0.5, fontSize: { xs: '0.688rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
                <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.813rem' } }}
                >
                  Total faulty items: <strong>{reportsData.faultyLosses.count}</strong>
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  border: 2,
                  borderColor: 'success.main',
                  bgcolor: '#f0fdf4',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Replacement Orders
                  </Typography>
                  <Tooltip title="Free replacement orders for faulty items (not included in revenue)">
                    <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
                <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: { xs: 2, sm: 3 }, 
                  p: { xs: 1.5, sm: 2 }, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                  >
                    Total Replacements
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={700} 
                    color="success.main"
                    sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                  >
                    {reportsData.replacementOrders?.length || 0}
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                  >
                    Replacement orders are free replacements for faulty items and do not count towards revenue.
                  </Typography>
                </Alert>
                {reportsData.replacementOrders && reportsData.replacementOrders.length > 0 && (
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                    >
                      Recent Replacements:
                    </Typography>
                    <Paper sx={{ maxHeight: 150, overflowY: 'auto', p: { xs: 1, sm: 1.5 }, bgcolor: 'background.paper' }}>
                      {reportsData.replacementOrders.slice(0, 5).map((order) => (
                        <Box 
                          key={order.id} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: { xs: 0.75, sm: 1 },
                            borderBottom: 1,
                            borderColor: 'divider',
                            gap: 1,
                            '&:last-child': { borderBottom: 0 }
                          }}
                        >
                          <Chip 
                            label={order.orderNumber} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: { xs: '0.688rem', sm: '0.75rem' },
                              height: { xs: 20, sm: 24 }
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.688rem', sm: '0.75rem' } }}
                          >
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Product Breakdown */}
        <Paper elevation={2} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Product Breakdown
              </Typography>
              {isPending && <CircularProgress size={20} />}
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
            >
              Sales breakdown by product for the selected period
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 0, sm: 3 } }}>
            {!reportsData.productBreakdown || reportsData.productBreakdown.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No product sales found in the selected date range
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <TableSortLabel
                          active={sortBy === "product"}
                          direction={sortBy === "product" ? sortDirection : "asc"}
                          onClick={() => handleSort("product")}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            Product
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <TableSortLabel
                          active={sortBy === "quantity"}
                          direction={sortBy === "quantity" ? sortDirection : "asc"}
                          onClick={() => handleSort("quantity")}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            Qty
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <TableSortLabel
                          active={sortBy === "revenue"}
                          direction={sortBy === "revenue" ? sortDirection : "asc"}
                          onClick={() => handleSort("revenue")}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            Revenue
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>
                        <TableSortLabel
                          active={sortBy === "orders"}
                          direction={sortBy === "orders" ? sortDirection : "asc"}
                          onClick={() => handleSort("orders")}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            Orders
                          </Typography>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedProductBreakdown.map((product, index) => (
                      <TableRow
                        key={`${product.productId}-${product.variantId || 'base'}`}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell sx={{ py: { xs: 1, sm: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                            <Chip 
                              label={index + 1} 
                              size="small" 
                              sx={{ 
                                width: { xs: 24, sm: 32 }, 
                                height: { xs: 20, sm: 24 },
                                fontSize: { xs: '0.688rem', sm: '0.75rem' },
                                bgcolor: 'grey.200',
                                fontWeight: 600
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ 
                                fontSize: { xs: '0.813rem', sm: '0.875rem' },
                                wordBreak: 'break-word'
                              }}
                            >
                              {product.productName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 1, sm: 2 } }}>
                          <Chip 
                            label={product.totalQuantity}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              height: { xs: 20, sm: 24 },
                              fontSize: { xs: '0.688rem', sm: '0.75rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 1, sm: 2 } }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={700} 
                            color="success.main"
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            {formatCurrency(product.totalRevenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                          >
                            {product.orderCount}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableRow sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.light !important' } }}>
                    <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="body1" 
                        fontWeight={700} 
                        color="white"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="body1" 
                        fontWeight={700} 
                        color="white"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {sortedProductBreakdown.reduce(
                          (sum, p) => sum + p.totalQuantity,
                          0,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="body1" 
                        fontWeight={700} 
                        color="white"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {formatCurrency(
                          sortedProductBreakdown.reduce(
                            (sum, p) => sum + p.totalRevenue,
                            0,
                          ),
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: { xs: 1.5, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography 
                        variant="body1" 
                        fontWeight={700} 
                        color="white"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
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
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Transactions
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                >
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} 
                  {transactionSearch && ` matching "${transactionSearch}"`}
                </Typography>
              </Box>
              <TextField
                placeholder="Search..."
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                size="small"
                sx={{ 
                  minWidth: { xs: '100%', sm: 250 },
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '8px'
                  } 
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {filteredTransactions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {transactionSearch 
                    ? `No transactions found matching "${transactionSearch}"`
                    : "No transactions found in the selected date range"}
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                  {displayedTransactions.map((order) => (
                    <Box
                      key={order.id}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        pb: { xs: 2, sm: 3 },
                        '&:last-child': { borderBottom: 0, pb: 0 },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography 
                              variant="h6" 
                              fontWeight={600}
                              sx={{ 
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                                wordBreak: 'break-word'
                              }}
                            >
                              {order.username}
                            </Typography>
                            {order.orderNumber && (
                              <Chip 
                                label={order.orderNumber} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontSize: { xs: '0.688rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 }
                                }}
                              />
                            )}
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.688rem', sm: '0.75rem' },
                              height: { xs: 20, sm: 24 }
                            }}
                          />
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                          >
                            {formatCurrency(totalValue(order))}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={600} 
                        gutterBottom
                        sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                      >
                        Items:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {order.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              gap: 1,
                              alignItems: 'flex-start'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: { xs: '0.813rem', sm: '0.875rem' },
                                flex: 1,
                                wordBreak: 'break-word'
                              }}
                            >
                              {item.product.name}
                              {item.flavour && ` (${item.flavour})`} × {item.quantity}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ 
                                fontSize: { xs: '0.813rem', sm: '0.875rem' },
                                flexShrink: 0
                              }}
                            >
                              {formatCurrency(Number(item.priceAtTime) * item.quantity)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      {order.manualDiscount && order.manualDiscount > 0 && (
                        <Box sx={{ mt: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              color="warning.main" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                            >
                              Manual Discount
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="warning.main" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                            >
                              -{formatCurrency(Number(order.manualDiscount))}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {order.totalOverride && (
                        <Box sx={{ mt: 1 }}>
                          <Typography 
                            variant="caption" 
                            color="info.main"
                            sx={{ fontSize: { xs: '0.688rem', sm: '0.75rem' } }}
                          >
                            Total Override Applied
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
                
                {filteredTransactions.length > 10 && (
                  <Box sx={{ textAlign: 'center', mt: { xs: 2, sm: 3 } }}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                      endIcon={showAllTransactions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      fullWidth={Boolean(typeof window !== 'undefined' && window.innerWidth < 600)}
                      sx={{ 
                        borderRadius: '8px',
                        maxWidth: { xs: '100%', sm: 300 },
                        fontSize: { xs: '0.813rem', sm: '0.875rem' }
                      }}
                    >
                      {showAllTransactions 
                        ? 'Show Less' 
                        : `Show All ${filteredTransactions.length} Transactions`}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </AdminLayout>
  );
}
