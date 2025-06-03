import { Handler } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const handler: Handler = async (event) => {
  try {
    // Log the incoming request
    console.log("Incoming request:", JSON.stringify(event, null, 2));

    const productId = event.pathParameters?.productId;

    // Log the extracted productId
    console.log("Extracted productId:", productId);

    if (!productId) {
      console.error("Validation error: Product ID is required");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    // Fetch product details from the Products table
    const productCommand = new GetItemCommand({
      TableName: productsTableName,
      Key: { id: { S: productId } },
    });

    console.log(
      "Fetching product details with command:",
      JSON.stringify(productCommand, null, 2)
    );
    const productResult = await dynamoDB.send(productCommand);

    if (!productResult.Item) {
      console.error("Product not found for ID:", productId);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const product = {
      id: productResult.Item.id.S,
      title: productResult.Item.title.S,
      description: productResult.Item.description.S,
      price: parseFloat(productResult.Item.price.N || "0"),
    };

    // Fetch stock details from the Stock table
    const stockCommand = new GetItemCommand({
      TableName: stockTableName,
      Key: { product_id: { S: productId } },
    });

    console.log(
      "Fetching stock details with command:",
      JSON.stringify(stockCommand, null, 2)
    );
    const stockResult = await dynamoDB.send(stockCommand);

    const stockCount = stockResult.Item
      ? parseInt(stockResult.Item.count.N || "0")
      : 0;

    // Combine product and stock details
    const productWithStock = {
      ...product,
      count: stockCount,
    };

    console.log(
      "Returning combined product and stock details:",
      JSON.stringify(productWithStock, null, 2)
    );
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(productWithStock),
    };
  } catch (error) {
    // Log the error
    console.error("Error fetching product by ID:", error);

    // Return a 500 error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error }),
    };
  }
};
