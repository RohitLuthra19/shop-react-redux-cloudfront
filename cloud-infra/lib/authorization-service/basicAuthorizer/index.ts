import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  if (!event.authorizationToken) {
    throw new Error("Unauthorized"); // API Gateway returns 401
  }

  const token = event.authorizationToken.replace("Basic ", "");
  const decoded = Buffer.from(token, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");

  const envPassword = process.env[username];

  if (!envPassword) {
    return generatePolicy("user", "Deny", event.methodArn, 403);
  }

  if (envPassword !== password) {
    return generatePolicy("user", "Deny", event.methodArn, 403);
  }

  return generatePolicy("user", "Allow", event.methodArn);
};

function generatePolicy(principalId: string, effect: "Allow" | "Deny", resource: string, statusCode?: number) {
  const policy = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: statusCode ? { statusCode } : {},
  };
  return policy;
}