import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Appointment } from '../models/appointment';
import { Therapist } from '../models/therapist';

const sesClient = new SESClient({});
const snsClient = new SNSClient({});

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'sivalingapandian@yahoo.com';

export class NotificationService {
  async sendAppointmentConfirmation(appointment: Appointment, therapist: Therapist) {
    try {
      // Send email
      const emailCommand = new SendEmailCommand({
        Source: NOTIFICATION_EMAIL,
        Destination: {
          ToAddresses: [therapist.email],
        },
        Message: {
          Subject: {
            Data: `New Appointment: ${appointment.patientName}`,
          },
          Body: {
            Text: {
              Data: `A new appointment has been scheduled:\n\nPatient: ${appointment.patientName}\nDate: ${appointment.date}\nTime: ${appointment.timeSlot}\nStatus: ${appointment.status}`,
            },
          },
        },
      });

      await sesClient.send(emailCommand);

      // Send SMS if phone number is available
      if (therapist.phone) {
        const smsCommand = new PublishCommand({
          PhoneNumber: therapist.phone,
          Message: `New appointment scheduled with ${appointment.patientName} on ${appointment.date} at ${appointment.timeSlot}`,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: 'THERAPY',
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional',
            },
          },
        });
        await snsClient.send(smsCommand);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
} 