"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getFaultyReturns } from "@/lib/actions";
import type { FaultyReturn, FaultyReturnType } from "@/types";
import FaultyReturnList from "@/components/admin/FaultyReturnList";
import FaultyReturnForm from "@/components/admin/FaultyReturnForm";
import FaultyReturnModal from "@/components/admin/FaultyReturnModal";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AdminLayout from '@/components/layout/AdminLayout';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

interface FaultyPageClientProps {
  initialFaultyReturns: FaultyReturn[];
}

export default function FaultyPageClient({
  initialFaultyReturns,
}: FaultyPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [faultyReturns, setFaultyReturns] = useState<FaultyReturn[]>(
    initialFaultyReturns,
  );
  const [activeTab, setActiveTab] = useState<FaultyReturnType | "ALL">("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<FaultyReturn | null>(
    null,
  );

  const handleFilterChange = (type: FaultyReturnType | "ALL") => {
    setActiveTab(type);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type });
      setFaultyReturns(returns);
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type: activeTab });
      setFaultyReturns(returns);
    });
  };

  const handleViewDetails = (faultyReturn: FaultyReturn) => {
    setSelectedReturn(faultyReturn);
  };

  const handleModalClose = () => {
    setSelectedReturn(null);
    startTransition(async () => {
      const returns = await getFaultyReturns({ type: activeTab });
      setFaultyReturns(returns);
    });
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Faulty Returns & Stock
          </Typography>
          <Button
            variant={showCreateForm ? "outlined" : "contained"}
            startIcon={<ReportProblemIcon />}
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="large"
          >
            {showCreateForm ? "Cancel" : "Report Faulty Item"}
          </Button>
        </Box>

        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => handleFilterChange(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Returns" value="ALL" />
            <Tab label="Post-Sale Returns" value="POST_SALE" />
            <Tab label="Pre-Sale Faulty Stock" value="PRE_SALE" />
          </Tabs>
        </Paper>

        {showCreateForm && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <FaultyReturnForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </Paper>
        )}

        <FaultyReturnList
          faultyReturns={faultyReturns}
          onViewDetails={handleViewDetails}
          isPending={isPending}
        />

        {selectedReturn && (
          <FaultyReturnModal
            faultyReturn={selectedReturn}
            onClose={handleModalClose}
          />
        )}
      </Container>
    </AdminLayout>
  );
}

