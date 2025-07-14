import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export interface Appointment {
  id: string;
  patientName?: string; // Optional for HIPAA-compliant check-ins
  therapistId: string;
  therapistName: string;
  date?: string; // Optional for HIPAA-compliant check-ins
  timeSlot?: string; // Optional for HIPAA-compliant check-ins
  status?: 'scheduled' | 'completed' | 'cancelled'; // Optional for HIPAA-compliant check-ins
  checkInTime?: string; // New field for check-in time
  createdAt: string;
}

export class AppointmentModel {
  private readonly tableName: string;

  constructor() {
    const tableName = process.env.APPOINTMENTS_TABLE;
    if (!tableName) {
      throw new Error('APPOINTMENTS_TABLE environment variable is not set');
    }
    this.tableName = tableName;
  }

  async create(appointment: Appointment): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: appointment,
    });

    await docClient.send(command);
  }

  async get(id: string): Promise<Appointment | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const response = await docClient.send(command);
    return response.Item as Appointment || null;
  }

  async getByTherapistAndDate(therapistId: string, date: string): Promise<Appointment[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TherapistDateIndex',
      KeyConditionExpression: 'therapistId = :therapistId AND #date = :date',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':therapistId': therapistId,
        ':date': date,
      },
    });

    const response = await docClient.send(command);
    return response.Items as Appointment[] || [];
  }
} 