import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dotenv from "dotenv";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load .env
    dotenv.config({ path: path.join(__dirname, "basicAuthorizer/.env") });

    
    this.basicAuthorizer = new NodejsFunction(this, "basicAuthorizer", {
      entry: path.join(__dirname, "basicAuthorizer/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: Object.fromEntries(
        Object.entries(process.env).filter(([_, v]) => typeof v === "string" && v !== undefined) as [string, string][]
      ),
    });
  }
}
