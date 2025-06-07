import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export class TherapistModel {
  private readonly tableName: string;

  constructor() {
    const tableName = process.env.THERAPISTS_TABLE;
    if (!tableName) {
      throw new Error('THERAPISTS_TABLE environment variable is not set');
    }
    this.tableName = tableName;
  }

  async create(therapist: Therapist): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: therapist,
    });

    await docClient.send(command);
  }

  async get(id: string): Promise<Therapist | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const response = await docClient.send(command);
    return response.Item as Therapist || null;
  }

  async list(): Promise<Therapist[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await docClient.send(command);
    return response.Items as Therapist[] || [];
  }

  async update(id: string, therapist: Partial<Therapist>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression dynamically based on provided fields
    Object.entries(therapist).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      return;
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });

    await docClient.send(command);
  }
} 