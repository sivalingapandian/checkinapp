const getApiToken = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) {
    console.warn('No API token provided in URL. Please add ?token=YOUR_TOKEN to the URL.');
  }
  return token || '';
};

export const config = {
  apiEndpoint: 'https://n8e34x2h6f.execute-api.us-east-1.amazonaws.com/prod/check-in',
  therapistsEndpoint: 'https://n8e34x2h6f.execute-api.us-east-1.amazonaws.com/prod/therapists',
  getApiToken,
}; 