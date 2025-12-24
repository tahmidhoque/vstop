"use client";

import Link from "next/link";
import { formatDate } from "@/lib/date-utils";
import type { OrderWithItems } from "@/types";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/common/StatCard';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface AdminDashboardClientProps {
  pendingOrders: number;
  unfulfilledOrders: number;
  lowStockProducts: number;
  recentOrders: OrderWithItems[];
}

export default function AdminDashboardClient({
  pendingOrders,
  unfulfilledOrders,
  lowStockProducts,
  recentOrders,
}: AdminDashboardClientProps) {
  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending Orders"
              value={pendingOrders}
              color="primary"
              icon={<PendingActionsIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Unfulfilled Orders"
              value={unfulfilledOrders}
              color="warning"
              icon={<WarningAmberIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Low Stock Products"
              value={lowStockProducts}
              color="warning"
              icon={<InventoryIcon />}
            />
          </Grid>
        </Grid>

        {/* Recent Orders */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Orders
            </Typography>
            {recentOrders.length > 0 && (
              <Button
                component={Link}
                href="/admin/orders"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All
              </Button>
            )}
          </Box>

          {recentOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No orders yet
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {recentOrders.map((order) => (
                <ListItem
                  key={order.id}
                  sx={{
                    py: 2,
                    px: 0,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {order.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)} • {order.items.length} item
                      {order.items.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Chip
                    label={order.status}
                    color={
                      order.status === 'PENDING'
                        ? 'warning'
                        : order.status === 'UNFULFILLED'
                        ? 'error'
                        : order.status === 'FULFILLED'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </AdminLayout>
  );
}
