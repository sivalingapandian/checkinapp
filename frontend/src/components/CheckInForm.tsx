import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import { Therapist } from '../types';
import { config } from '../config';

const CheckInForm: React.FC = () => {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchTherapists = async () => {
      const token = config.getApiToken();
      if (!token) {
        console.error('No API token provided');
        setTherapists([]);
        return;
      }

      try {
        // Fetch therapists from the check-in endpoint using GET
        const response = await fetch(config.apiEndpoint, {
          method: 'GET',
          headers: {
            'x-api-key': token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTherapists(data);
      } catch (error) {
        console.error('Error fetching therapists:', error);
        setTherapists([]);
      }
    };

    fetchTherapists();
  }, []);

  const handleCheckIn = async () => {
    if (!selectedTherapistId) {
      setMessage({ type: 'error', text: 'Please select a therapist' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const token = config.getApiToken();
    if (!token) {
      setMessage({ type: 'error', text: 'No API token provided. Please add ?token=YOUR_TOKEN to the URL.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token,
        },
        body: JSON.stringify({
          therapistId: selectedTherapistId,
          checkInTime: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Check-in submitted:', result);
      setMessage({ type: 'success', text: 'Check-in completed successfully!' });
      setSelectedTherapistId('');
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setMessage({ 
        type: 'error', 
        text: `Error completing check-in: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTherapistChange = (event: any) => {
    setSelectedTherapistId(event.target.value);
    setMessage(null); // Clear any previous messages
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Patient Check-in
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          Please select your therapist and click check-in
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Therapist</InputLabel>
            <Select
              value={selectedTherapistId}
              onChange={handleTherapistChange}
              label="Therapist"
              disabled={isSubmitting}
            >
              {therapists.map((therapist) => (
                <MenuItem key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            onClick={handleCheckIn}
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={!selectedTherapistId || isSubmitting}
          >
            {isSubmitting ? 'Checking In...' : 'Check In'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CheckInForm; 