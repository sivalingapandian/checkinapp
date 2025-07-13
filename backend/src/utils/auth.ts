import { APIGatewayProxyEvent } from 'aws-lambda';

export const validateApiToken = (event: APIGatewayProxyEvent): boolean => {
  let token = event.headers['x-api-key'];
  const expectedToken = process.env.API_TOKEN;

  // If not in header, check query string
  if (!token && event.queryStringParameters && event.queryStringParameters['token']) {
    token = event.queryStringParameters['token'];
  }

  if (!token || !expectedToken) {
    return false;
  }

  return token === expectedToken;
}; 