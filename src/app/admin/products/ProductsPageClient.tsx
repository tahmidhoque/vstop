"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AdminLayout from '@/components/layout/AdminLayout';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface Product {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  visible?: boolean;
  variants?: Array<{ id: string; flavour: string; stock: number }>;
}

interface ProductsPageClientProps {
  initialProducts: Product[];
}

export default function ProductsPageClient({
  initialProducts,
}: ProductsPageClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sync products when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleCreate = async (data: {
    name: string;
    price: number;
    stock: number;
    visible?: boolean;
    variants: Array<{ flavour: string; stock: number }>;
  }) => {
    try {
      await createProduct(data);
      showSnackbar('Product created successfully', 'success');
      router.refresh();
      setShowForm(false);
    } catch (error) {
      showSnackbar('Failed to create product', 'error');
    }
  };

  const handleUpdate = async (data: {
    name: string;
    price: number;
    stock: number;
    visible?: boolean;
    variants: Array<{ id?: string; flavour: string; stock: number }>;
  }) => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, data);
      showSnackbar('Product updated successfully', 'success');
      router.refresh();
      setEditingProduct(null);
      setShowForm(false);
    } catch (error) {
      showSnackbar('Failed to update product', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        showSnackbar('Product deleted successfully', 'success');
        router.refresh();
      } catch (error) {
        showSnackbar('Failed to delete product', 'error');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Products
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            size="large"
          >
            Add Product
          </Button>
        </Box>

        {products.length === 0 ? (
          <Paper elevation={2} sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No products yet. Add your first product to get started.
            </Typography>
          </Paper>
        ) : isMobile ? (
          // Mobile Card View
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {products.map((product) => (
              <Card key={product.id} elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                      {product.name}
                    </Typography>
                    {product.visible === false && (
                      <Chip label="Hidden" size="small" color="default" />
                    )}
                  </Box>
                  <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom>
                    £{Number(product.price).toFixed(2)}
                  </Typography>
                  {product.variants && product.variants.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Variants:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {product.variants.map((variant) => (
                          <Typography
                            key={variant.id}
                            variant="body2"
                            color={variant.stock <= 5 ? 'warning.main' : 'text.secondary'}
                          >
                            {variant.flavour}: {variant.stock > 5 ? 'In Stock' : `${variant.stock} available`}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color={product.stock <= 5 ? 'warning.main' : 'text.secondary'}
                    >
                      {product.stock > 5 ? 'In Stock' : `${product.stock} available`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop Table View
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      opacity: product.visible === false ? 0.6 : 1,
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {product.name}
                        </Typography>
                        {product.visible === false && (
                          <Chip label="Hidden" size="small" color="default" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        £{Number(product.price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {product.variants && product.variants.length > 0 ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Variants:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {product.variants.map((variant) => (
                              <Typography
                                key={variant.id}
                                variant="body2"
                                color={variant.stock <= 5 ? 'warning.main' : 'text.secondary'}
                              >
                                {variant.flavour}: {variant.stock > 5 ? 'In Stock' : `${variant.stock} available`}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Chip
                          label={product.stock > 5 ? 'In Stock' : `${product.stock} available`}
                          size="small"
                          color={product.stock <= 5 ? 'warning' : 'default'}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(product.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Product Form Dialog */}
        <Dialog
          open={showForm}
          onClose={handleCancel}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <ProductForm
              product={
                editingProduct
                  ? {
                      ...editingProduct,
                      price: Number(editingProduct.price),
                    }
                  : undefined
              }
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}
