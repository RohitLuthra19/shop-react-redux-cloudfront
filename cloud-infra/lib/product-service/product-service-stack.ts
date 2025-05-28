import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the DynamoDB table
    const PRODUCTS_TABLE_NAME = "products";
    const STOCK_TABLE_NAME = "stock";

    /*  const productsTable = new dynamodb.Table(this, "ProductsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: PRODUCTS_TABLE_NAME,
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      tableName: STOCK_TABLE_NAME,
    }); */
    // Import existing DynamoDB tables
    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      PRODUCTS_TABLE_NAME
    );
    const stockTable = dynamodb.Table.fromTableName(
      this,
      "StockTable",
      STOCK_TABLE_NAME
    );

    // Lambda function for getProductsList
    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "getProductsList")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    // Lambda function for getProductsById
    const getProductsByIdLambda = new lambda.Function(
      this,
      "GetProductsByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "getProductsById")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    // Grant Lambda permissions to read from the tables
    productsTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductsListLambda);

    productsTable.grantReadData(getProductsByIdLambda);
    stockTable.grantReadData(getProductsByIdLambda);

    // Lambda function for createProduct
    /* const createProductLambda = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "createProduct")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      }
    ); */

    const createProductLambda = new NodejsFunction(
      this,
      "CreateProductFunction",
      {
        entry: path.join(__dirname, "./createProduct/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    // Grant Lambda permissions to write to the Products table
    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "ProductServiceAPI", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://localhost:3000"],
        allowMethods: ["GET", "POST", "OPTIONS"],
      },
    });
    const productsResource = api.root.addResource("products");
    // Add a resource for getting all products
    // GET /products -> getProductsList
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda)
    );
    // Add a resource for creating a product
    // POST /products -> createProduct
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda)
    );
    // Add a resource for getting a product by ID
    // GET /products/{productId} -> getProductsById
    const productResource = productsResource.addResource("{productId}");
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambda)
    );

    this.catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
      visibilityTimeout: cdk.Duration.seconds(60),
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    const createProductTopic = new sns.Topic(this, "createProductTopic");
    createProductTopic.addSubscription(
      new subs.EmailSubscription("rohit.luthra19@gmail.com")
    );

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "catalogBatchProcess",
      {
        entry: path.join(__dirname, "./catalogBatchProcess/index.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(30),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
        events: [
          new lambdaEventSources.SqsEventSource(this.catalogItemsQueue, {
            batchSize: 5,
          }),
        ],
      }
    );
    createProductTopic.grantPublish(catalogBatchProcessLambda);
  }
}
