import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import { verifyAdminPassword, createSession } from "@/lib/auth";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

async function handleLogin(password: string) {
  "use server";

  const isValid = await verifyAdminPassword(password);

  if (isValid) {
    await createSession("ADMIN");
    return { success: true };
  }

  return { success: false, error: "Invalid password" };
}

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session === "ADMIN") {
    redirect("/admin");
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                mb: 2,
              }}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Admin Login
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your admin password
            </Typography>
          </Box>
          <LoginForm type="admin" onSubmit={handleLogin} />
        </Paper>
      </Box>
    </Container>
  );
}
