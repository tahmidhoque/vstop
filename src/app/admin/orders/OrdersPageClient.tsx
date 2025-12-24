"use client";

import OrderList from "@/components/admin/OrderList";
import type { OrderWithItems } from "@/types";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AdminLayout from '@/components/layout/AdminLayout';

interface OrdersPageClientProps {
  orders: OrderWithItems[];
}

export default function OrdersPageClient({ orders }: OrdersPageClientProps) {
  return (
    <AdminLayout>
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Orders
          </Typography>
          <OrderList orders={orders} />
        </Container>
      </Box>
    </AdminLayout>
  );
}
