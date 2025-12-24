"use client";

import PasswordChangeForm from "@/components/admin/PasswordChangeForm";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import AdminLayout from '@/components/layout/AdminLayout';

export default function SettingsPageClient() {
  return (
    <AdminLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Change End User Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the password that end users need to enter to access the store.
          </Typography>
          <PasswordChangeForm />
        </Paper>
      </Container>
    </AdminLayout>
  );
}
