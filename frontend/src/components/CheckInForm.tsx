import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Container,
  Paper,
} from '@mui/material';
import { CheckInFormData, Therapist, TimeSlot } from '../types';
import { config } from '../config';

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 7; hour <= 19; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      slots.push({
        value: time,
        label: time,
      });
    }
  }
  return slots;
};

const CheckInForm: React.FC = () => {
  const [formData, setFormData] = useState<CheckInFormData>({
    patientName: '',
    therapistId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
  });

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const timeSlots = generateTimeSlots();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = config.getApiToken();
    if (!token) {
      alert('No API token provided. Please add ?token=YOUR_TOKEN to the URL.');
      return;
    }

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Form submitted:', result);
      alert('Check-in submitted successfully!');
      setFormData({
        patientName: '',
        therapistId: '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error submitting check-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | 
    (Event & { target: { value: string; name: string } })
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Therapist Check-in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Patient Name"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            required
            margin="normal"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Therapist</InputLabel>
            <Select
              name="therapistId"
              value={formData.therapistId}
              onChange={handleChange}
              label="Therapist"
            >
              {therapists.map((therapist) => (
                <MenuItem key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Time Slot</InputLabel>
            <Select
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              label="Time Slot"
            >
              {timeSlots.map((slot) => (
                <MenuItem key={slot.value} value={slot.value}>
                  {slot.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
          >
            Check In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CheckInForm; 