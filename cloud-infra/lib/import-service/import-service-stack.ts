import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3notifications from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

function createImportBucket(scope: cdk.Stack) {
  const importBucket = new s3.Bucket(scope, "ImportBucket", {
    bucketName: "import-service-bucket-" + scope.account + "-" + scope.region,
    versioned: true,
    cors: [
      {
        allowedOrigins: ["*"],
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
        allowedHeaders: ["Content-Type"],
        maxAge: 3000,
      },
    ],
  });

  return importBucket;
}

function createImportProductsFileLambda(
  scope: cdk.Stack,
  importBucket: s3.Bucket,
  uploadedFolderName: string
) {
  const lambdaFn = new lambda.Function(scope, "ImportProductsFileFunction", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "index.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "importProductsFile")),
    environment: {
      BUCKET_NAME: importBucket.bucketName,
      UPLOADED_FOLDER: uploadedFolderName,
    },
  });

  importBucket.grantReadWrite(lambdaFn);

  // Policy for pre-signed URLs
  const putObjectPolicyStatement = new iam.PolicyStatement({
    actions: ["s3:PutObject"],
    resources: [`${importBucket.bucketArn}/${uploadedFolderName}/*`],
  });
  lambdaFn.addToRolePolicy(putObjectPolicyStatement);

  return lambdaFn;
}

function createImportFileParserLambda(
  scope: cdk.Stack,
  importBucket: s3.Bucket,
  uploadedFolderName: string,
  parsedFolderName: string,
  catalogItemsQueueUrl: string
) {
  const lambdaFn = new NodejsFunction(scope, "ImportFileParserFunction", {
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, "./importFileParser/index.ts"),
    handler: "handler",
    timeout: cdk.Duration.seconds(10),
    environment: {
      BUCKET_NAME: importBucket.bucketName,
      UPLOADED_FOLDER: uploadedFolderName,
      PARSED_FOLDER: parsedFolderName,
      CATALOG_ITEMS_QUEUE_URL: catalogItemsQueueUrl,
    },
  });

  importBucket.grantReadWrite(lambdaFn);

  // S3 event notification
  importBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(lambdaFn),
    { prefix: `${uploadedFolderName}/` }
  );

  return lambdaFn;
}

function createApiGateway(
  scope: cdk.Stack,
  importProductsFileLambda: lambda.Function
) {
  const api = new apigateway.RestApi(scope, "ImportServiceAPI");
  const importResource = api.root.addResource("import");
  importResource.addMethod(
    "GET",
    new apigateway.LambdaIntegration(importProductsFileLambda)
  );
  return api;
}

interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueueUrl: string;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const uploadedFolderName = "uploaded";
    const parsedFolderName = "parsed";

    const importBucket = createImportBucket(this);
    const importProductsFileLambda = createImportProductsFileLambda(
      this,
      importBucket,
      uploadedFolderName
    );
    createApiGateway(this, importProductsFileLambda);

    const catalogItemsQueue = sqs.Queue.fromQueueAttributes(
      this,
      "CatalogItemsQueueRef",
      {
        queueUrl: props.catalogItemsQueueUrl,
        queueArn: `arn:aws:sqs:${cdk.Stack.of(this).region}:${
          cdk.Stack.of(this).account
        }:ProductServiceStack-catalogItemsQueue*`,
      }
    );
    const importFileParserLambda = createImportFileParserLambda(
      this,
      importBucket,
      uploadedFolderName,
      parsedFolderName,
      props.catalogItemsQueueUrl
    );
    catalogItemsQueue.grantSendMessages(importFileParserLambda);
  }
}
