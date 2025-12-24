"use client";

import { useState } from "react";
import PersonalUseOrderModal from "@/components/admin/PersonalUseOrderModal";
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
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AdminLayout from '@/components/layout/AdminLayout';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface Product {
  id: string;
  name: string;
  stock: number;
  visible?: boolean;
  variants?: Array<{ id: string; flavour: string; stock: number }>;
}

interface StockPageClientProps {
  products: Product[];
}

export default function StockPageClient({ products }: StockPageClientProps) {
  const [showPersonalUseModal, setShowPersonalUseModal] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSnackbar } = useSnackbar();

  const calculateTotalStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => total + variant.stock, 0);
    }
    return product.stock || 0;
  };

  const handleSuccess = () => {
    setShowPersonalUseModal(false);
    showSnackbar('Personal use order created successfully', 'success');
    window.location.reload();
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Stock Check
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShoppingBagIcon />}
              onClick={() => setShowPersonalUseModal(true)}
              size="large"
            >
              Create Personal Use Order
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<WarningAmberIcon />}
              href="/admin/faulty"
              size="large"
            >
              Report Faulty Stock
            </Button>
          </Stack>
        </Box>

        {products.length === 0 ? (
          <Paper elevation={2} sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No products found.
            </Typography>
          </Paper>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {products.map((product) => {
              const totalStock = calculateTotalStock(product);
              const isLowStock = totalStock <= 5;
              return (
                <Card key={product.id} elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {product.name}
                      </Typography>
                      {product.visible === false && (
                        <Chip label="Hidden" size="small" color="default" />
                      )}
                    </Box>
                    {product.variants && product.variants.length > 0 ? (
                      <Box>
                        <Chip
                          label={`Total Stock: ${totalStock}`}
                          color={isLowStock ? 'warning' : 'primary'}
                          sx={{ mb: 2, fontWeight: 600 }}
                        />
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Variants:
                        </Typography>
                        <Stack spacing={1}>
                          {product.variants.map((variant) => (
                            <Chip
                              key={variant.id}
                              label={`${variant.flavour}: ${variant.stock} available`}
                              size="small"
                              color={variant.stock <= 5 ? 'warning' : 'default'}
                              sx={{ justifyContent: 'flex-start' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ) : (
                      <Chip
                        label={`${product.stock} available`}
                        color={product.stock <= 5 ? 'warning' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Stock Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const totalStock = calculateTotalStock(product);
                  const isLowStock = totalStock <= 5;
                  return (
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
                        {product.variants && product.variants.length > 0 ? (
                          <Box>
                            <Chip
                              label={`Total Stock: ${totalStock}`}
                              color={isLowStock ? 'warning' : 'primary'}
                              sx={{ mb: 2, fontWeight: 600 }}
                            />
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Variants:
                            </Typography>
                            <Stack spacing={1}>
                              {product.variants.map((variant) => (
                                <Chip
                                  key={variant.id}
                                  label={`${variant.flavour}: ${variant.stock} available`}
                                  size="small"
                                  color={variant.stock <= 5 ? 'warning' : 'default'}
                                  sx={{ justifyContent: 'flex-start' }}
                                />
                              ))}
                            </Stack>
                          </Box>
                        ) : (
                          <Chip
                            label={`${product.stock} available`}
                            color={product.stock <= 5 ? 'warning' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {showPersonalUseModal && (
          <PersonalUseOrderModal
            onClose={() => setShowPersonalUseModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </Container>
    </AdminLayout>
  );
}
