import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TherapistModel } from '../models/therapist';
import { validateApiToken } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

// Add console type definition
declare const console: {
  error(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
};

const therapistModel = new TherapistModel();

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://d3elxw865x0zp9.cloudfront.net',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Validate token
  if (!validateApiToken(event)) {
    return createResponse(401, { message: 'Unauthorized' });
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters?.id) {
          const therapist = await therapistModel.get(event.pathParameters.id);
          if (!therapist) {
            return createResponse(404, { message: 'Therapist not found' });
          }
          return createResponse(200, therapist);
        } else {
          const therapists = await therapistModel.list();
          return createResponse(200, therapists);
        }

      case 'POST':
        if (!event.body) {
          return createResponse(400, { message: 'Request body is required' });
        }
        const therapistData = JSON.parse(event.body);
        // Check for required fields
        if (!therapistData.name || !therapistData.email || !therapistData.phone) {
          return createResponse(400, {
            message: 'Missing required fields. Name, email, and phone are required.'
          });
        }

        // Format phone number to E.164 format
        let phoneNumber = therapistData.phone.replace(/\D/g, ''); // Remove non-digits
        if (!phoneNumber.startsWith('1')) {
          phoneNumber = '1' + phoneNumber; // Add US country code if not present
        }
        if (phoneNumber.length !== 11) {
          return createResponse(400, {
            message: 'Invalid phone number format. Please provide a valid US phone number.'
          });
        }
        therapistData.phone = '+' + phoneNumber;

        // Check for duplicate therapist by name
        const existingTherapists = await therapistModel.list();
        const isDuplicate = existingTherapists.some(t => t.name.toLowerCase() === therapistData.name.toLowerCase());
        if (isDuplicate) {
          return createResponse(409, {
            message: 'A therapist with this name already exists'
          });
        }
        const newTherapist = {
          ...therapistData,
          id: uuidv4(),
        };
        try {
          await therapistModel.create(newTherapist);
          return createResponse(201, newTherapist);
        } catch (error) {
          console.error('Error creating therapist:', error);
          return createResponse(500, {
            message: 'Error creating therapist',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'PUT':
        if (!event.pathParameters?.id) {
          return createResponse(400, { message: 'Therapist ID is required' });
        }
        if (!event.body) {
          return createResponse(400, { message: 'Request body is required' });
        }
        const updateData = JSON.parse(event.body);
        await therapistModel.update(event.pathParameters.id, updateData);
        const updatedTherapist = await therapistModel.get(event.pathParameters.id);
        if (!updatedTherapist) {
          return createResponse(404, { message: 'Therapist not found' });
        }
        return createResponse(200, updatedTherapist);

      case 'DELETE':
        if (!event.pathParameters?.id) {
          return createResponse(400, { message: 'Therapist ID is required' });
        }
        await therapistModel.delete(event.pathParameters.id);
        return createResponse(200, { message: 'Therapist deleted successfully' });

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(500, {
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 