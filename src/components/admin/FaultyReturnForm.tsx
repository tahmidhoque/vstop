"use client";

import React, { useState, useEffect } from "react";
import { createFaultyReturn, getProducts, getOrders } from "@/lib/actions";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { FormTextField } from '@/components/common/FormFields';

interface FaultyReturnFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaultyReturnForm({
  onSuccess,
  onCancel,
}: FaultyReturnFormProps) {
  const [type, setType] = useState<"PRE_SALE" | "POST_SALE">("PRE_SALE");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [faultyReason, setFaultyReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [productsData, ordersData] = await Promise.all([
        getProducts(true),
        getOrders(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product);
      setVariantId("");
    } else {
      setSelectedProduct(null);
    }
  }, [productId, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!productId) {
        throw new Error("Please select a product");
      }

      if (!faultyReason.trim()) {
        throw new Error("Please provide a reason for the faulty item");
      }

      if (type === "POST_SALE" && !orderId) {
        throw new Error("Please select an order for post-sale returns");
      }

      await createFaultyReturn({
        orderId: type === "POST_SALE" ? orderId : null,
        orderNumber: type === "POST_SALE" ? orderNumber : null,
        productId,
        variantId: variantId || null,
        quantity,
        faultyReason,
        notes: notes.trim() || null,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create faulty return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Report Faulty Item
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Type
          </Typography>
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, newType) => newType && setType(newType)}
            fullWidth
            size="large"
          >
            <ToggleButton value="PRE_SALE">Pre-Sale Faulty Stock</ToggleButton>
            <ToggleButton value="POST_SALE">Post-Sale Return</ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        {type === "POST_SALE" && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={orderId}
                label="Order"
                onChange={(e) => {
                  const selectedOrder = orders.find(
                    (o) => o.id === e.target.value,
                  );
                  setOrderId(e.target.value);
                  setOrderNumber(selectedOrder?.orderNumber || "");
                }}
                required
              >
                <MenuItem value="">
                  <em>Select an order</em>
                </MenuItem>
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.username} ({new Date(order.createdAt).toLocaleDateString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Product</InputLabel>
            <Select
              value={productId}
              label="Product"
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <MenuItem value="">
                <em>Select a product</em>
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} - £{product.price.toFixed(2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Variant</InputLabel>
              <Select
                value={variantId}
                label="Variant"
                onChange={(e) => setVariantId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Base Product</em>
                </MenuItem>
                {selectedProduct.variants.map((variant: any) => (
                  <MenuItem key={variant.id} value={variant.id}>
                    {variant.flavour} (Stock: {variant.stock})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1 }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <FormTextField
            fullWidth
            label="Faulty Reason"
            value={faultyReason}
            onChange={(e) => setFaultyReason(e.target.value)}
            placeholder="e.g., Damaged packaging, Expired, Defective"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
          />
        </Grid>

        {type === "PRE_SALE" && (
          <Grid item xs={12}>
            <Alert severity="warning">
              <strong>Warning:</strong> This will automatically deduct {quantity} unit(s) from stock.
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              size="large"
              sx={{ flexGrow: 1, minHeight: 48 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  Creating...
                </>
              ) : (
                'Create Faulty Return'
              )}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
              size="large"
              sx={{ minHeight: 48 }}
            >
              Cancel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

