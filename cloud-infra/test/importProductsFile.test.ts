const awsSdkMock = require('aws-sdk-mock');

process.env.BUCKET_NAME = 'test-bucket';
process.env.UPLOADED_FOLDER = 'uploaded';

const { handler } = require('../lib/import-service/importProductsFile');

describe('importProductsFile Lambda', () => {
  afterEach(() => {
    awsSdkMock.restore();
    jest.resetModules();
  });

  it('should return 400 if file name is missing', async () => {
    const event = { queryStringParameters: {} };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('File name is required');
  });

  it('should return signed URL if file name is provided', async () => {
    jest.mock('@aws-sdk/s3-request-presigner', () => ({
      getSignedUrl: jest.fn().mockResolvedValue('https://signed-url')
    }));

    const { handler: mockedHandler } = require('../lib/import-service/importProductsFile');
    const event = { queryStringParameters: { name: 'test.csv' } };
    const result = await mockedHandler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).signedUrl).toBe('https://signed-url');
  });

  it('should handle errors gracefully', async () => {
    jest.mock('@aws-sdk/s3-request-presigner', () => ({
      getSignedUrl: jest.fn().mockRejectedValue(new Error('fail'))
    }));

    const { handler: mockedHandler } = require('../lib/import-service/importProductsFile');
    const event = { queryStringParameters: { name: 'test.csv' } };
    const result = await mockedHandler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Failed to generate signed URL');
  });
});