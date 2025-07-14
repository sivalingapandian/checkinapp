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
  'Access-Control-Allow-Origin': 'https://d238r13n2gk9ba.cloudfront.net',
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

    // Handle GET request to list therapists
    if (event.httpMethod === 'GET') {
      const therapists = await therapistModel.list();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(therapists),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Request body is required' }),
      };
    }

    const { therapistId, checkInTime } = JSON.parse(event.body);

    // Validate required fields
    if (!therapistId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Therapist ID is required' }),
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

    // Create check-in record
    const checkInRecord = {
      id: uuidv4(),
      therapistId,
      therapistName: therapist.name,
      checkInTime: checkInTime || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await appointmentModel.create(checkInRecord);

    // Send notification to therapist
    await notificationService.sendCheckInNotification(checkInRecord, therapist);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Check-in completed successfully',
        checkIn: checkInRecord,
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