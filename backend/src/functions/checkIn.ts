import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { AppointmentModel } from '../models/appointment';
import { TherapistModel } from '../models/therapist';
import { NotificationService } from '../services/notification';
import { validateApiToken } from '../utils/auth';

const appointmentModel = new AppointmentModel();
const therapistModel = new TherapistModel();
const notificationService = new NotificationService();

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d3elxw865x0zp9.cloudfront.net',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Validate token
    if (!validateApiToken(event)) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Request body is required' }),
      };
    }

    const { patientName, therapistId, date, timeSlot } = JSON.parse(event.body);

    // Validate required fields
    if (!patientName || !therapistId || !date || !timeSlot) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Get therapist information
    const therapist = await therapistModel.get(therapistId);
    if (!therapist) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Therapist not found' }),
      };
    }

    // Check if time slot is available
    const existingAppointments = await appointmentModel.getByTherapistAndDate(therapistId, date);
    const isTimeSlotAvailable = !existingAppointments.some(
      (appointment) => appointment.timeSlot === timeSlot && appointment.status === 'scheduled'
    );

    if (!isTimeSlotAvailable) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Time slot is not available' }),
      };
    }

    // Create appointment
    const appointment = {
      id: uuidv4(),
      patientName,
      therapistId,
      therapistName: therapist.name,
      date,
      timeSlot,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    };

    await appointmentModel.create(appointment);

    // Send notification
    await notificationService.sendAppointmentConfirmation(appointment, therapist);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Appointment scheduled successfully',
        appointment,
      }),
    };
  } catch (error) {
    console.error('Error processing check-in:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}; 