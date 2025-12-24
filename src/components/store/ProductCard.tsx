"use client";

import { useState, useEffect } from "react";
import type { BasketItem } from "@/types";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface Variant {
  id: string;
  flavour: string;
  stock: number;
}

interface Offer {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  price: number;
  active: boolean;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  variants?: Variant[];
  offers?: Offer[];
  onAddToBasket: (item: BasketItem) => void;
}

export default function ProductCard({
  id,
  name,
  price,
  stock,
  variants = [],
  offers = [],
  onAddToBasket,
}: ProductCardProps) {
  // Get active offers
  const activeOffers = offers.filter((offer) => offer.active);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? null : null,
  );
  const [quantity, setQuantity] = useState(1);

  // Calculate display stock - use variant stock if selected, otherwise base stock
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : stock;

  const isOutOfStock = displayStock === 0;
  const maxQuantity = Math.max(1, displayStock);

  // Reset quantity when variant changes or stock changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id, displayStock]);

  const handleQuantityChange = (newQuantity: number) => {
    // Clamp quantity between 1 and available stock
    const clampedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    setQuantity(clampedQuantity);
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for better UX
    if (value === "") {
      setQuantity(1);
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      handleQuantityChange(numValue);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const handleAdd = () => {
    if (displayStock > 0 && quantity > 0) {
      // If product has variants but none selected, don't allow adding
      if (variants.length > 0 && !selectedVariant) {
        return;
      }

      const displayName = selectedVariant
        ? `${name} (${selectedVariant.flavour})`
        : name;

      onAddToBasket({
        productId: id,
        name: displayName,
        price: Number(price),
        quantity: Math.min(quantity, maxQuantity),
        stock: displayStock,
        variantId: selectedVariant?.id,
        flavour: selectedVariant?.flavour,
      });
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0, wordBreak: 'break-word' }}>
            {name}
          </Typography>
          {activeOffers.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
              {activeOffers.map((offer) => (
                <Chip
                  key={offer.id}
                  icon={<LocalOfferIcon />}
                  label={offer.name}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                />
              ))}
            </Box>
          )}
        </Box>

        {variants.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Flavour</InputLabel>
              <Select
                value={selectedVariant?.id || ""}
                label="Select Flavour"
                onChange={(e) => {
                  const variant = variants.find((v) => v.id === e.target.value);
                  setSelectedVariant(variant || null);
                }}
              >
                <MenuItem value="">
                  <em>Choose a flavour...</em>
                </MenuItem>
                {variants.map((variant) => (
                  <MenuItem key={variant.id} value={variant.id}>
                    {variant.flavour} ({variant.stock > 5 ? "In Stock" : `${variant.stock} available`})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography variant="h5" component="p" sx={{ fontWeight: 700, color: 'primary.main' }}>
            £{Number(price).toFixed(2)}
          </Typography>
          <Chip
            label={
              isOutOfStock
                ? "Out of Stock"
                : displayStock > 5
                ? "In Stock"
                : `${displayStock} left`
            }
            size="small"
            color={isOutOfStock ? "error" : displayStock <= 5 ? "warning" : "default"}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {!isOutOfStock && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup variant="outlined" size="small">
              <IconButton
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <RemoveIcon />
              </IconButton>
              <Button
                disableRipple
                sx={{
                  minWidth: 60,
                  minHeight: 44,
                  fontWeight: 600,
                  cursor: 'default',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                {quantity}
              </Button>
              <IconButton
                onClick={incrementQuantity}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <AddIcon />
              </IconButton>
            </ButtonGroup>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: { xs: 2, sm: 2 }, pt: 0, px: { xs: 2, sm: 2 } }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleAdd}
          disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
          startIcon={<AddShoppingCartIcon />}
          sx={{ minHeight: { xs: 44, sm: 48 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {quantity > 1 ? `Add ${quantity} to Basket` : "Add to Basket"}
        </Button>
      </CardActions>
    </Card>
  );
}
