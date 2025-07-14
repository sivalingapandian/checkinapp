import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Box } from '@mui/material';
import TherapistManagement from './components/TherapistManagement';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function AppTherapist() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Therapist Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <TherapistManagement />
      </Box>
    </ThemeProvider>
  );
}

export default AppTherapist; 