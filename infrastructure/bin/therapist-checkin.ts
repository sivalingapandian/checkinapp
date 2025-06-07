#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TherapistCheckinStack } from '../lib/therapist-checkin-stack';

const app = new cdk.App();
new TherapistCheckinStack(app, 'TherapistCheckinStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}); 