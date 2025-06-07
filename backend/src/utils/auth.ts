import { APIGatewayProxyEvent } from 'aws-lambda';

export const validateApiToken = (event: APIGatewayProxyEvent): boolean => {
  const token = event.headers['x-api-key'];
  const expectedToken = process.env.API_TOKEN;

  if (!token || !expectedToken) {
    return false;
  }

  return token === expectedToken;
}; 