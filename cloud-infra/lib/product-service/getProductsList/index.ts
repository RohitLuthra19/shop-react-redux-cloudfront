import { Handler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const handler: Handler = async (event) => {
  try {
    // Log the incoming request
    console.log("Incoming request:", JSON.stringify(event, null, 2));

    // Fetch products from the Products table
    const productsCommand = new ScanCommand({ TableName: productsTableName });
    console.log(
      "Fetching products with command:",
      JSON.stringify(productsCommand, null, 2)
    );
    const productsResult = await dynamoDB.send(productsCommand);
    const products = productsResult.Items || [];

    // Fetch stock from the Stock table
    const stockCommand = new ScanCommand({ TableName: stockTableName });
    console.log(
      "Fetching stock with command:",
      JSON.stringify(stockCommand, null, 2)
    );
    const stockResult = await dynamoDB.send(stockCommand);
    const stock = stockResult.Items || [];

    // Join products and stock by productId
    const joinedProducts = products.map((product) => {
      const stockItem = stock.find((s) => s.product_id?.S === product.id?.S);
      return {
        id: product.id?.S || null,
        title: product.title?.S || null,
        description: product.description?.S || null,
        price: product.price?.N ? parseFloat(product.price.N) : 0,
        count: stockItem?.count?.N ? parseInt(stockItem.count.N) : 0,
      };
    });

    console.log(
      "Returning joined products and stock:",
      JSON.stringify(joinedProducts, null, 2)
    );
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (error) {
    // Log the error
    console.error("Error fetching products:", error);

    // Return a 500 error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error }),
    };
  }
};
