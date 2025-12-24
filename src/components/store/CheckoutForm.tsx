"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BasketItem } from "@/types";
import { calculateOffers, type Offer } from "@/lib/offer-utils";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface CheckoutFormProps {
  items: BasketItem[];
  offers?: Offer[];
  onSubmit: (
    username: string,
    items: BasketItem[],
  ) => Promise<{ id: string } | void>;
}

export default function CheckoutForm({
  items,
  offers = [],
  onSubmit,
}: CheckoutFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const basketTotal = calculateOffers(items, offers);
  const { subtotal, discounts, total, appliedOffers } = basketTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const order = await onSubmit(username, items);
      if (order && order.id) {
        router.push(`/store/order-confirmation/${order.id}`);
      } else {
        router.push("/store?success=true");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Checkout
      </Typography>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Order Summary
        </Typography>
        <List disablePadding sx={{ mb: 2 }}>
          {items.map((item) => (
            <ListItem
              key={`${item.productId}-${item.variantId || "base"}`}
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
                <Typography variant="body1" fontWeight={600} noWrap>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.quantity} × £{item.price.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={700} sx={{ flexShrink: 0 }}>
                £{(item.price * item.quantity).toFixed(2)}
              </Typography>
            </ListItem>
          ))}
        </List>

        {appliedOffers.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="success.main" gutterBottom>
                Applied Offers
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {appliedOffers.map((offer) => (
                  <Paper
                    key={offer.offerId}
                    elevation={0}
                    sx={{ p: 1.5, bgcolor: 'success.light', border: 1, borderColor: 'success.main' }}
                  >
                    <Typography variant="body2" fontWeight={600} color="success.dark">
                      {offer.offerName}
                    </Typography>
                    <Typography variant="body2" color="success.dark">
                      Save £{offer.discount.toFixed(2)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
            <Typography variant="body2">£{subtotal.toFixed(2)}</Typography>
          </Box>
          {discounts > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="success.main">Discounts:</Typography>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                -£{discounts.toFixed(2)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Total:</Typography>
            <Typography variant="h5" fontWeight={700}>£{total.toFixed(2)}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            required
            label="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder="Enter your name"
            helperText="This helps us identify who placed the order"
            InputProps={{
              startAdornment: <PersonOutlineIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => router.back()}
            disabled={loading}
            sx={{ minHeight: 48 }}
          >
            Back
          </Button>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || items.length === 0}
            sx={{ minHeight: 48 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
