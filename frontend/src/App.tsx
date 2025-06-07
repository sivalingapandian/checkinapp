import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import CheckInForm from './components/CheckInForm';
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

function App() {
  const [currentPage, setCurrentPage] = useState<'checkin' | 'therapists'>('checkin');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Therapist Check-in System
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => setCurrentPage('checkin')}
            sx={{ mr: 2 }}
          >
            Check-in
          </Button>
          <Button 
            color="inherit" 
            onClick={() => setCurrentPage('therapists')}
          >
            Manage Therapists
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        {currentPage === 'checkin' ? <CheckInForm /> : <TherapistManagement />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
