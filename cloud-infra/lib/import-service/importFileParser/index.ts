import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { finished } from "stream/promises";
import csv from "csv-parser";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER;
const PARSED_FOLDER = process.env.PARSED_FOLDER;

async function getS3ObjectStream(key: string): Promise<Readable | null> {
  const getObjectCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(getObjectCommand);
  if (!response.Body) {
    console.error("S3 object has no body");
    return null;
  }
  return response.Body as Readable;
}

async function parseCsvStream(stream: Readable): Promise<void> {
  const parser = stream.pipe(csv());
  parser.on("data", (data: any) => {
    console.log("Parsed record:", data);
    // process the data here
  });
  parser.on("error", (error: any) => {
    console.error("Error parsing CSV:", error);
  });
  await finished(parser);
}

async function moveFile(key: string): Promise<void> {
  if (!UPLOADED_FOLDER || !PARSED_FOLDER) {
    throw new Error(
      "UPLOADED_FOLDER or PARSED_FOLDER environment variable is not defined"
    );
  }
  const parsedKey = key.replace(UPLOADED_FOLDER, PARSED_FOLDER);
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${key}`,
      Key: parsedKey,
    })
  );
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
  console.log(`Moved ${key} to ${parsedKey}`);
}

export const handler = async (event: { Records: any[] }) => {
  try {
    console.log("Received S3 event:", event);

    for (const record of event.Records) {
      const key = record.s3.object.key;
      console.log(`Processing file: ${key}`);

      const stream = await getS3ObjectStream(key);
      if (!stream) continue;

      await parseCsvStream(stream);
      console.log(`Finished processing file: ${key}`);

      await moveFile(key);
    }

    console.log("All files processed successfully.");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Files processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing S3 event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error processing S3 event", error }),
    };
  }
};
