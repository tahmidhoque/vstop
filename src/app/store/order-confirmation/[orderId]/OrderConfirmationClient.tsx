"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrder } from "@/lib/actions";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface OrderConfirmationClientProps {
  orderId: string;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  flavour: string | null;
  quantity: number;
  priceAtTime: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
  variant: {
    id: string;
    flavour: string;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  username: string;
  status: string;
  createdAt: Date;
  items: OrderItem[];
}

export default function OrderConfirmationClient({
  orderId,
}: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await getOrder(orderId);
        if (!orderData) {
          setError("Order not found");
          return;
        }
        setOrder(orderData as Order);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order details..." />;
  }

  if (error || !order) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || "Order not found"}
          </Alert>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push("/store")}
            sx={{ minHeight: 48 }}
          >
            Return to Store
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate totals (simplified - assuming no offers applied at confirmation)
  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
    0,
  );
  const total = subtotal;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      {/* Success Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 3,
          bgcolor: 'success.light',
          border: 2,
          borderColor: 'success.main',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'success.main' }} />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700} color="success.dark" gutterBottom>
          Order Confirmed!
        </Typography>
        <Typography variant="body1" color="success.dark">
          Thank you for your order, {order.username}. Your order has been received and is being processed.
        </Typography>
      </Paper>

      {/* Order Details Card */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Order Details
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Order Number:</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
              {order.orderNumber}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Order Date:</Typography>
            <Typography variant="body2">
              {formatDate(order.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <Chip
              label={order.status}
              color={order.status === 'PENDING' ? 'warning' : 'success'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Items Ordered
        </Typography>
        <List disablePadding>
          {order.items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                py: 2,
                px: 0,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 2 }
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={600}>
                  {item.product.name}
                </Typography>
                {item.variant && (
                  <Typography variant="body2" color="text.secondary">
                    Flavour: {item.variant.flavour}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {item.quantity} × £{Number(item.priceAtTime).toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={700} sx={{ flexShrink: 0 }}>
                £{(Number(item.priceAtTime) * item.quantity).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
            <Typography variant="body2" fontWeight={600}>£{subtotal.toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Total:</Typography>
            <Typography variant="h5" fontWeight={700}>£{total.toFixed(2)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => router.push("/store")}
          startIcon={<ShoppingBagIcon />}
          sx={{ minHeight: 48 }}
        >
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
}
