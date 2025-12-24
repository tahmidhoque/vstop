"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OfferForm from "@/components/admin/OfferForm";
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getProducts,
} from "@/lib/actions";
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
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AdminLayout from '@/components/layout/AdminLayout';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface Offer {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  price: number;
  active: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  productIds: string[];
}

interface Product {
  id: string;
  name: string;
}

interface OffersPageClientProps {
  initialOffers: Offer[];
  initialProducts: Product[];
}

export default function OffersPageClient({
  initialOffers,
  initialProducts,
}: OffersPageClientProps) {
  const [offers, setOffers] = useState(initialOffers);
  const [products, setProducts] = useState(initialProducts);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  useEffect(() => {
    if (products.length === 0) {
      getProducts(true).then((productsData) => {
        setProducts(
          productsData.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        );
      });
    }
  }, [products.length]);

  const handleCreate = async (data: {
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  }) => {
    try {
      await createOffer({
        name: data.name,
        description: data.description ?? undefined,
        quantity: data.quantity,
        price: data.price,
        active: data.active,
        startDate: data.startDate,
        endDate: data.endDate,
        productIds: data.productIds,
      });
      showSnackbar('Offer created successfully', 'success');
      router.refresh();
      setShowForm(false);
    } catch (error) {
      showSnackbar('Failed to create offer', 'error');
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string | null;
    quantity: number;
    price: number;
    active: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    productIds: string[];
  }) => {
    if (!editingOffer) return;
    try {
      await updateOffer(editingOffer.id, data);
      showSnackbar('Offer updated successfully', 'success');
      router.refresh();
      setEditingOffer(null);
      setShowForm(false);
    } catch (error) {
      showSnackbar('Failed to update offer', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        await deleteOffer(id);
        showSnackbar('Offer deleted successfully', 'success');
        router.refresh();
      } catch (error) {
        showSnackbar('Failed to delete offer', 'error');
      }
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOffer(null);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Offers
          </Typography>
          {!showForm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              disabled={products.length === 0}
              size="large"
            >
              Add Offer
            </Button>
          )}
        </Box>

        {showForm && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {editingOffer ? "Edit Offer" : "Add New Offer"}
            </Typography>
            <OfferForm
              offer={editingOffer || undefined}
              products={products}
              onSubmit={editingOffer ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </Paper>
        )}

        {products.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Note:</strong> You need to create products before you can create offers.{" "}
            <Link href="/admin/products" underline="always">
              Go to Products
            </Link>
          </Alert>
        )}

        {offers.length === 0 ? (
          <Paper elevation={2} sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No offers yet. Add your first offer to get started.
            </Typography>
          </Paper>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {offers.map((offer) => (
              <Card key={offer.id} elevation={2}>
                <CardContent>
                  <Typography variant="h6" component="h3" fontWeight={600} gutterBottom>
                    {offer.name}
                  </Typography>
                  {offer.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {offer.description}
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Any <strong>{offer.quantity}</strong> for <strong>£{offer.price.toFixed(2)}</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={offer.active ? "Active" : "Inactive"}
                      color={offer.active ? "success" : "default"}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {offer.productIds.length} product{offer.productIds.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Start:</strong> {formatDate(offer.startDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>End:</strong> {formatDate(offer.endDate)}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(offer)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(offer.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Offer Details</TableCell>
                  <TableCell>Eligible Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {offer.name}
                        </Typography>
                        {offer.description && (
                          <Typography variant="body2" color="text.secondary">
                            {offer.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Any <strong>{offer.quantity}</strong> for <strong>£{offer.price.toFixed(2)}</strong>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {offer.productIds.length} product{offer.productIds.length !== 1 ? "s" : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={offer.active ? "Active" : "Inactive"}
                        color={offer.active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>Start:</strong> {formatDate(offer.startDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>End:</strong> {formatDate(offer.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(offer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(offer.id)}
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

        <Dialog
          open={showForm}
          onClose={handleCancel}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {editingOffer ? 'Edit Offer' : 'Add New Offer'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <OfferForm
              offer={editingOffer || undefined}
              products={products}
              onSubmit={editingOffer ? handleUpdate : handleCreate}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}
