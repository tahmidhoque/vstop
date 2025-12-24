import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import { verifyCustomerPassword, createSession } from "@/lib/auth";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import StorefrontIcon from '@mui/icons-material/Storefront';

async function handleLogin(password: string) {
  "use server";

  const isValid = await verifyCustomerPassword(password);

  if (isValid) {
    await createSession("CUSTOMER");
    return { success: true };
  }

  return { success: false, error: "Invalid password" };
}

export default async function HomePage() {
  const session = await getSession();

  if (session === "CUSTOMER") {
    redirect("/store");
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
              <StorefrontIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Welcome
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please enter your password to access the store
            </Typography>
          </Box>
          <LoginForm type="customer" onSubmit={handleLogin} />
        </Paper>
      </Box>
    </Container>
  );
}
