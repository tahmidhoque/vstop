"use client";

import { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { FormTextField } from '@/components/common/FormFields';

interface Product {
  id: string;
  name: string;
}

interface OfferFormProps {
  offer?: {
    id: string;
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  };
  products: Product[];
  onSubmit: (data: {
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function OfferForm({
  offer,
  products,
  onSubmit,
  onCancel,
}: OfferFormProps) {
  const [name, setName] = useState(offer?.name || "");
  const [description, setDescription] = useState(offer?.description || "");
  const [quantity, setQuantity] = useState(offer?.quantity.toString() || "2");
  const [price, setPrice] = useState(offer?.price.toString() || "");
  const [active, setActive] = useState(offer?.active ?? true);
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "",
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(offer?.productIds || []),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (isNaN(quantityNum) || quantityNum < 2) {
      setError("Quantity must be at least 2");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (selectedProductIds.size === 0) {
      setError("Please select at least one product");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        quantity: quantityNum,
        price: priceNum,
        active,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        productIds: Array.from(selectedProductIds),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormTextField
            fullWidth
            label="Offer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Any 2 for £15"
            required
            disabled={loading}
            helperText="This will be displayed to customers"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about the offer"
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="2"
            inputProps={{ min: 2 }}
            required
            disabled={loading}
            helperText='Number of items required (e.g., 2 for "Any 2 for £X")'
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Offer Price (£)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="15.00"
            inputProps={{ step: 0.01, min: 0 }}
            required
            disabled={loading}
            helperText="Total price for the quantity (e.g., £15 for 2 items)"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Start Date (optional)"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="End Date (optional)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={loading}
              />
            }
            label="Active"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Only active offers will be applied to orders
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Eligible Products <Box component="span" color="error.main">*</Box>
            </Typography>
            <Button
              type="button"
              onClick={handleSelectAll}
              disabled={loading || products.length === 0}
              size="small"
            >
              {selectedProductIds.size === products.length ? "Deselect All" : "Select All"}
            </Button>
          </Box>
          {products.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No products available. Create products first.
            </Typography>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                maxHeight: 240,
                overflowY: 'auto',
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {products.map((product) => (
                  <FormControlLabel
                    key={product.id}
                    control={
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => handleToggleProduct(product.id)}
                        disabled={loading}
                      />
                    }
                    label={product.name}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
                      p: 1,
                      m: 0,
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Select products that qualify for this offer. The offer will apply to any combination of selected products.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              variant="outlined"
              size="large"
              sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: { sm: 120 } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: { sm: 120 } }}
            >
              {loading ? "Saving..." : offer ? "Update" : "Create"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
