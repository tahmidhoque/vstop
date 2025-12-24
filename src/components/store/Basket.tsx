"use client";

import { useState } from "react";
import type { BasketItem } from "@/types";
import { calculateOffers, type Offer } from "@/lib/offer-utils";
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface BasketProps {
  items: BasketItem[];
  offers?: Offer[];
  onUpdateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  onRemove: (productId: string, variantId?: string) => void;
  onCheckout: () => void;
}

export default function Basket({
  items,
  offers = [],
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: BasketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const basketTotal = calculateOffers(items, offers);
  const { subtotal, discounts, total, appliedOffers } = basketTotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const basketContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2" fontWeight={700}>
          Basket
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setIsOpen(false)} aria-label="Close basket">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {items.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Your basket is empty
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            <List disablePadding>
              {items.map((item) => (
                <ListItem
                  key={`${item.productId}-${item.variantId || "base"}`}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 2,
                    mb: 2,
                    '&:last-child': { borderBottom: 0, mb: 0 }
                  }}
                  disablePadding
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        £{item.price.toFixed(2)} each
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => onRemove(item.productId, item.variantId)}
                      size="small"
                      color="error"
                      aria-label="Remove item"
                      sx={{ ml: 1 }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.productId, Math.max(0, item.quantity - 1), item.variantId)}
                        aria-label="Decrease quantity"
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body1" fontWeight={600} sx={{ minWidth: 40, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.productId, Math.min(item.stock, item.quantity + 1), item.variantId)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Increase quantity"
                        sx={{ minWidth: 36, minHeight: 36 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" fontWeight={700}>
                      £{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>

            {appliedOffers.length > 0 && (
              <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: 'success.light', border: 1, borderColor: 'success.main', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.dark" gutterBottom>
                  Applied Offers
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {appliedOffers.map((offer) => (
                    <Box key={offer.offerId}>
                      <Typography variant="body2" fontWeight={600} color="success.dark">
                        {offer.offerName}
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        Save £{offer.discount.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>

          <Paper elevation={3} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ mb: 2 }}>
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
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => {
                onCheckout();
                setIsOpen(false);
              }}
              sx={{ minHeight: 48 }}
            >
              Proceed to Checkout
            </Button>
          </Paper>
        </>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Fab
          color="primary"
          aria-label="Open basket"
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.fab,
          }}
        >
          <Badge badgeContent={itemCount} color="error">
            <ShoppingCartIcon />
          </Badge>
        </Fab>

        <Drawer
          anchor="bottom"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          PaperProps={{
            sx: {
              maxHeight: '85vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }
          }}
        >
          {basketContent}
        </Drawer>
      </>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width: { md: 360 },
        height: { md: '100vh' },
        position: { md: 'sticky' },
        top: { md: 0 },
        borderLeft: { md: 1 },
        borderColor: 'divider',
        borderRadius: 0,
        display: { xs: 'none', md: 'block' },
      }}
    >
      {basketContent}
    </Paper>
  );
}
