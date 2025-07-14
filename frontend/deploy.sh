#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  source .env
fi

# Check if required environment variables are set
if [ -z "$S3_BUCKET_CHECKIN" ]; then
    echo "Error: S3_BUCKET_CHECKIN environment variable is not set"
    exit 1
fi

if [ -z "$S3_BUCKET_THERAPIST" ]; then
    echo "Error: S3_BUCKET_THERAPIST environment variable is not set"
    exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID_CHECKIN" ]; then
    echo "Error: CLOUDFRONT_DISTRIBUTION_ID_CHECKIN environment variable is not set"
    exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID_THERAPIST" ]; then
    echo "Error: CLOUDFRONT_DISTRIBUTION_ID_THERAPIST environment variable is not set"
    exit 1
fi

# Build check-in app
echo "Building check-in app..."
npm run build:checkin

# Upload check-in app to S3
echo "Uploading check-in app to S3..."
aws s3 sync build/ s3://$S3_BUCKET_CHECKIN/ --delete

# Invalidate check-in CloudFront cache
echo "Invalidating check-in CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID_CHECKIN --paths "/*"

# Build therapist management app
echo "Building therapist management app..."
npm run build:therapist

# Upload therapist management app to S3
echo "Uploading therapist management app to S3..."
aws s3 sync build/ s3://$S3_BUCKET_THERAPIST/ --delete

# Invalidate therapist CloudFront cache
echo "Invalidating therapist CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID_THERAPIST --paths "/*"

echo "Deployment completed successfully!"
echo "Check-in app: https://$CLOUDFRONT_DISTRIBUTION_ID_CHECKIN.cloudfront.net/"
echo "Therapist management: https://$CLOUDFRONT_DISTRIBUTION_ID_THERAPIST.cloudfront.net/" 