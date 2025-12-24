"use client";

import { useState, useEffect } from "react";
import { createPersonalUseOrder, getProducts } from "@/lib/actions";
import type { BasketItem } from "@/types";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface PersonalUseOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PersonalUseOrderModal({
  onClose,
  onSuccess,
}: PersonalUseOrderModalProps) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      variants?: Array<{ id: string; flavour: string; stock: number }>;
    }>
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts(true);
      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
          variants: p.variants?.map(
            (v: { id: string; flavour: string; stock: number }) => ({
              id: v.id,
              flavour: v.flavour,
              stock: v.stock,
            }),
          ),
        })),
      );
    }

    loadProducts();
  }, []);

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const hasVariants = selectedProductData?.variants && selectedProductData.variants.length > 0;

  const addItem = () => {
    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    if (hasVariants && !selectedVariant) {
      setError("Please select a flavour");
      return;
    }

    let stock = product.stock;
    let flavour: string | undefined = undefined;
    let variantId: string | undefined = undefined;
    let name = product.name;

    if (hasVariants && selectedVariant) {
      const variant = product.variants?.find((v) => v.id === selectedVariant);
      if (variant) {
        stock = variant.stock;
        flavour = variant.flavour;
        variantId = variant.id;
        name = `${product.name} (${variant.flavour})`;
      }
    }

    if (quantity > stock) {
      setError(`Insufficient stock. Only ${stock} available.`);
      return;
    }

    const existingItemIndex = items.findIndex(
      (item) =>
        item.productId === selectedProduct &&
        item.variantId === (variantId || undefined),
    );

    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct,
          name,
          price: product.price,
          quantity,
          stock,
          variantId,
          flavour,
        },
      ]);
    }

    setSelectedProduct("");
    setSelectedVariant("");
    setQuantity(1);
    setError("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (newQuantity > item.stock) {
      setError(`Insufficient stock for ${item.name}. Only ${item.stock} available.`);
      return;
    }

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    newItems[index].quantity = newQuantity;
    setItems(newItems);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createPersonalUseOrder(items);
      showSnackbar('Personal use order created successfully', 'success');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      setError(message);
      showSnackbar(message, 'error');
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ bgcolor: 'secondary.light' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Create Personal Use Order
            </Typography>
            <Typography variant="body2" color="secondary.dark" sx={{ mt: 0.5 }}>
              Track stock taken for personal use (not counted in revenue)
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Add Item
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: hasVariants ? 6 : 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    label="Product"
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setSelectedVariant("");
                    }}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a product</em>
                    </MenuItem>
                    {products.map((product) => {
                      // Calculate total stock - use variant stock if product has variants, otherwise use base stock
                      const totalStock = product.variants && product.variants.length > 0
                        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                        : product.stock;
                      return (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} (Stock: {totalStock})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {hasVariants && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Flavour</InputLabel>
                    <Select
                      value={selectedVariant}
                      label="Flavour"
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <em>Select a flavour</em>
                      </MenuItem>
                      {selectedProductData?.variants?.map((variant) => (
                        <MenuItem key={variant.id} value={variant.id}>
                          {variant.flavour} (Stock: {variant.stock})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: hasVariants ? 12 : 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={addItem}
              disabled={loading}
              size="large"
            >
              Add Item
            </Button>
          </Paper>

          {items.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Items ({items.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map((item, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock available: {item.stock}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(index, parseInt(e.target.value) || 1)
                          }
                          inputProps={{ min: 1, max: item.stock }}
                          size="small"
                          sx={{ width: 80 }}
                          disabled={loading}
                        />
                        <IconButton
                          onClick={() => removeItem(index)}
                          color="error"
                          size="small"
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 2 }}>
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading || items.length === 0}
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
          >
            {loading ? "Creating..." : "Create Personal Use Order"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
