'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: 'primary' | 'error' | 'warning' | 'success' | 'default';
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, color = 'default', icon }: StatCardProps) {
  const getColor = () => {
    switch (color) {
      case 'primary':
        return 'primary.main';
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'success':
        return 'success.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {icon && <Box sx={{ color: getColor() }}>{icon}</Box>}
        </Box>
        <Typography variant="h3" component="div" sx={{ color: getColor(), fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

