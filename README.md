# Therapist Check-in System

A serverless application for managing therapist appointments and patient check-ins.

## Features

- Patient check-in system accessible via iPad
- Therapist management (name, email, phone)
- Appointment scheduling (7 AM - 7 PM, 30-minute intervals)
- Email/SMS notifications to therapists
- Simple token-based protection
- AWS Serverless architecture

## Tech Stack

- Frontend: React.js
- Backend: AWS Lambda (Node.js)
- Database: Amazon DynamoDB
- API Gateway: AWS API Gateway
- Authentication: Simple token-based
- Notifications: AWS SES (Email) / SNS (SMS)

## Project Structure

```
therapist-checkin/
├── frontend/          # React application
├── backend/           # Lambda functions
└── infrastructure/    # AWS CDK/CloudFormation templates
```

## Setup Instructions

1. Prerequisites:
   - Node.js (v14 or later)
   - AWS CLI configured
   - AWS CDK installed

2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install

   # Infrastructure
   cd ../infrastructure
   npm install
   ```

3. Environment Setup:
   - Create a `.env` file in the frontend directory
   - Configure AWS credentials
   - Set up required environment variables

4. Deployment:
   ```bash
   # Deploy infrastructure
   cd infrastructure
   cdk deploy

   # Deploy backend
   cd ../backend
   npm run deploy

   # Build and deploy frontend
   cd ../frontend
   npm run build
   ```

## Security

The application uses a simple token-based protection system. The token should be configured in the environment variables and shared securely with authorized users.

## License

MIT 