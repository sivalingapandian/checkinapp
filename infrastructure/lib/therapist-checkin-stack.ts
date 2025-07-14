import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class TherapistCheckinStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const therapistsTable = new dynamodb.Table(this, 'TherapistsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const appointmentsTable = new dynamodb.Table(this, 'AppointmentsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Add GSI for appointments
    appointmentsTable.addGlobalSecondaryIndex({
      indexName: 'TherapistDateIndex',
      partitionKey: { name: 'therapistId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
    });

    // Create SNS Topic for SMS notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      displayName: 'Therapist Notification Topic',
    });

    // Lambda Function
    const checkInFunction = new lambda.Function(this, 'CheckInFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/checkIn.handler',
      code: lambda.Code.fromAsset('../backend', {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          user: 'root',
          command: [
            'bash', '-c', [
              'npm ci',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp package.json /asset-output/',
              'cp package-lock.json /asset-output/',
              'cd /asset-output && npm ci --production'
            ].join(' && ')
          ],
        },
      }),
      environment: {
        API_TOKEN: process.env.CHECKIN_API_TOKEN || 'checkin-token-here',
        THERAPISTS_TABLE: therapistsTable.tableName,
        APPOINTMENTS_TABLE: appointmentsTable.tableName,
        NOTIFICATION_EMAIL: 'akhilan2007@gmail.com',
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      }
    });

    // Therapists Lambda Function
    const therapistsFunction = new lambda.Function(this, 'TherapistsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/therapists.handler',
      code: lambda.Code.fromAsset('../backend', {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          user: 'root',
          command: [
            'bash', '-c', [
              'npm ci',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp package.json /asset-output/',
              'cp package-lock.json /asset-output/',
              'cd /asset-output && npm ci --production'
            ].join(' && ')
          ],
        },
      }),
      environment: {
        API_TOKEN: process.env.THERAPIST_API_TOKEN || 'therapist-token-here',
        THERAPISTS_TABLE: therapistsTable.tableName,
        APPOINTMENTS_TABLE: appointmentsTable.tableName,
        NOTIFICATION_EMAIL: 'akhilan2007@gmail.com',
        SNS_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    // Grant permissions
    therapistsTable.grantReadData(checkInFunction);
    therapistsTable.grantReadData(therapistsFunction);
    therapistsTable.grantWriteData(therapistsFunction);
    appointmentsTable.grantReadWriteData(checkInFunction);
    notificationTopic.grantPublish(checkInFunction);

    // Add explicit policy for TherapistsFunction
    therapistsFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem'
        ],
        resources: [
          therapistsTable.tableArn,
          `${therapistsTable.tableArn}/index/*`
        ]
      })
    );

    checkInFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'sns:Publish'],
        resources: ['*'],
      })
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'TherapistCheckinApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'https://d3elxw865x0zp9.cloudfront.net',
          'https://d238r13n2gk9ba.cloudfront.net',
          'https://dmuca84s4ilj5.cloudfront.net'
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'x-api-key'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const checkIn = api.root.addResource('check-in');
    checkIn.addMethod('POST', new apigateway.LambdaIntegration(checkInFunction));
    checkIn.addMethod('GET', new apigateway.LambdaIntegration(checkInFunction));

    const therapists = api.root.addResource('therapists');
    therapists.addMethod('GET', new apigateway.LambdaIntegration(therapistsFunction));
    therapists.addMethod('POST', new apigateway.LambdaIntegration(therapistsFunction));

    const therapist = therapists.addResource('{id}');
    therapist.addMethod('GET', new apigateway.LambdaIntegration(therapistsFunction));
    therapist.addMethod('PUT', new apigateway.LambdaIntegration(therapistsFunction));
    therapist.addMethod('DELETE', new apigateway.LambdaIntegration(therapistsFunction));

    // S3 Bucket for frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for check-in app
    const checkinBucket = new s3.Bucket(this, 'CheckinBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for therapist management app
    const therapistBucket = new s3.Bucket(this, 'TherapistBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution for main app
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    // CloudFront Distribution for check-in app
    const checkinDistribution = new cloudfront.Distribution(this, 'CheckinDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(checkinBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    // CloudFront Distribution for therapist management app
    const therapistDistribution = new cloudfront.Distribution(this, 'TherapistDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(therapistBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'CheckinUrl', {
      value: checkinDistribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'TherapistUrl', {
      value: therapistDistribution.distributionDomainName,
    });
  }
} 