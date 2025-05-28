import { SQSEvent } from "aws-lambda";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stockTableName = process.env.STOCK_TABLE_NAME!;
const topicArn = process.env.CREATE_PRODUCT_TOPIC_ARN!;

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const productId = uuidv4();
    const transactCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTableName,
            Item: {
              id: { S: productId },
              title: { S: body.title },
              description: { S: body.description },
              price: { N: body.price.toString() },
            },
          },
        },
        {
          Put: {
            TableName: stockTableName,
            Item: {
              product_id: { S: productId },
              count: { N: body.count.toString() },
            },
          },
        },
      ],
    });
    await dynamoDB.send(transactCommand);

    // Publish to SNS
    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: "New product created",
        Message: JSON.stringify({ ...body, productId }),
        MessageAttributes: {
          title: { DataType: "String", StringValue: body.title },
        },
      })
    );
  }
  return { statusCode: 200 };
};
