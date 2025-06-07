import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Therapist } from '../types';
import { config } from '../config';

const TherapistManagement: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [formData, setFormData] = useState<Partial<Therapist>>({
    name: '',
    email: '',
    phone: '',
  });

  const fetchTherapists = async () => {
    try {
      console.log('Fetching therapists from:', config.therapistsEndpoint);
      const response = await fetch(config.therapistsEndpoint, {
        headers: {
          'x-api-key': config.getApiToken(),
        },
        mode: 'cors',
        credentials: 'omit'
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch therapists');
      }
      const data = await response.json();
      console.log('Fetched therapists:', data);
      setTherapists(data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        alert('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        alert('Failed to fetch therapists: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const handleOpen = (therapist?: Therapist) => {
    if (therapist) {
      setEditingTherapist(therapist);
      setFormData(therapist);
    } else {
      setEditingTherapist(null);
      setFormData({ name: '', email: '', phone: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTherapist(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = config.getApiToken();
    if (!token) {
      alert('No API token provided');
      return;
    }

    try {
      const url = editingTherapist
        ? `${config.therapistsEndpoint}/${editingTherapist.id}`
        : config.therapistsEndpoint;
      const method = editingTherapist ? 'PUT' : 'POST';

      console.log('Submitting therapist data:', {
        url,
        method,
        data: formData
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token,
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 409) {
          alert('A therapist with this name already exists');
        } else {
          alert(data.message || 'Failed to save therapist');
        }
        return;
      }

      handleClose();
      fetchTherapists();
    } catch (error) {
      console.error('Error saving therapist:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        alert('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        alert(`Failed to save therapist: ${error.message}`);
      } else {
        alert('Failed to save therapist: Unknown error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this therapist?')) return;

    const token = config.getApiToken();
    if (!token) {
      alert('No API token provided');
      return;
    }

    try {
      const response = await fetch(`${config.therapistsEndpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': token,
        },
      });

      if (!response.ok) throw new Error('Failed to delete therapist');

      fetchTherapists();
    } catch (error) {
      console.error('Error deleting therapist:', error);
      alert('Failed to delete therapist');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Therapist Management
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Therapist
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {therapists.map((therapist) => (
              <TableRow key={therapist.id}>
                <TableCell>{therapist.name}</TableCell>
                <TableCell>{therapist.email}</TableCell>
                <TableCell>{therapist.phone}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(therapist)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(therapist.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingTherapist ? 'Edit Therapist' : 'Add Therapist'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingTherapist ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TherapistManagement; 