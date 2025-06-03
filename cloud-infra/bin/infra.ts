#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeployWebAppStack } from '../lib/web-app/deploy-web-app-stack';
import { ProductServiceStack } from '../lib/product-service/product-service-stack';
import { ImportServiceStack } from '../lib/import-service/import-service-stack';
import { AuthorizationServiceStack } from '../lib/authorization-service/authorization-service-stack';
const app = new cdk.App();


new DeployWebAppStack(app, 'DeployWebAppStack', {});


const productServiceStack = new ProductServiceStack(app, 'ProductServiceStack', {});

const authorizationServiceStack = new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {});

new ImportServiceStack(app, 'ImportServiceStack', {
  catalogItemsQueueUrl: productServiceStack.catalogItemsQueue.queueUrl,
  basicAuthorizerLambda: authorizationServiceStack.basicAuthorizer,
});