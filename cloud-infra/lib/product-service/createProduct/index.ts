import { Handler } from "aws-lambda";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const handler: Handler = async (event) => {
  try {
    console.log("Incoming request:", JSON.stringify(event, null, 2)); // Log the incoming request

    const body = JSON.parse(event.body || "{}");

    // Validate input
    if (!body.title || !body.price || body.count === undefined) {
      console.error("Validation error: Missing title, price, or count");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Title, price, and count are required",
        }),
      };
    }

    const productId = uuidv4();

    // Create a transaction to write to both tables
    const command = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTableName,
            Item: {
              id: { S: productId },
              title: { S: body.title },
              description: { S: body.description || "" },
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

    console.log(
      "DynamoDB TransactWriteItemsCommand:",
      JSON.stringify(command, null, 2)
    ); // Log the transaction command
    await dynamoDB.send(command);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Product and stock created successfully",
        product: {
          id: productId,
          title: body.title,
          description: body.description || "",
          price: body.price,
          count: body.count,
        },
      }),
    };
  } catch (error) {
    console.error("Error creating product and stock:", error); // Log the error
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error!", error }),
    };
  }
};
