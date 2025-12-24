"use client";

import { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

interface Variant {
  id?: string;
  flavour: string;
  stock: number;
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    visible?: boolean;
    variants?: Variant[];
  };
  onSubmit: (data: {
    name: string;
    price: number;
    stock: number;
    visible?: boolean;
    variants: Variant[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [stock, setStock] = useState(product?.stock.toString() || "0");
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [variants, setVariants] = useState<Variant[]>(product?.variants || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddVariant = () => {
    setVariants([...variants, { flavour: "", stock: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: "flavour" | "stock",
    value: string | number,
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: field === "stock" ? parseInt(String(value), 10) || 0 : value,
    };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number");
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError("Stock must be a non-negative number");
      return;
    }

    // Validate variants
    const validVariants = variants.filter((v) => v.flavour.trim() !== "");
    for (const variant of validVariants) {
      if (variant.stock < 0) {
        setError("Variant stock must be non-negative");
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: priceNum,
        stock: stockNum,
        visible,
        variants: validVariants,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
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
        <Grid size={12}>
          <TextField
            fullWidth
            required
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label="Price (£)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
            inputProps={{ step: "0.01", min: "0" }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type="number"
            label="Base Stock Quantity"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={loading}
            helperText="Used if no variants are defined"
            inputProps={{ min: "0" }}
          />
        </Grid>

        <Grid size={12}>
          <FormControlLabel
            control={
              <Switch
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                disabled={loading}
              />
            }
            label="Visible to customers"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            When unchecked, this product will be hidden from the customer store view
          </Typography>
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Flavour Variants (optional)
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddVariant}
              disabled={loading}
            >
              Add Variant
            </Button>
          </Box>

          {variants.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No variants. Product will use base stock.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {variants.map((variant, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Flavour name"
                        placeholder="e.g., Vanilla, Chocolate"
                        value={variant.flavour}
                        onChange={(e) =>
                          handleVariantChange(index, "flavour", e.target.value)
                        }
                        disabled={loading}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 10, sm: 5 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Stock"
                        value={variant.stock}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "stock",
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        disabled={loading}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 1 }}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveVariant(index)}
                        disabled={loading}
                        aria-label="Remove variant"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  Saving...
                </>
              ) : (
                product ? 'Update' : 'Create'
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
