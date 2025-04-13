"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentService = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const path = './resources/build';
class DeploymentService extends constructs_1.Construct {
    constructor(scope, id) {
        super(scope, id);
        const hostingBucket = new aws_cdk_lib_1.aws_s3.Bucket(this, 'FrontendBucket', {
            blockPublicAccess: aws_cdk_lib_1.aws_s3.BlockPublicAccess.BLOCK_ALL,
        });
        const distribution = new aws_cdk_lib_1.aws_cloudfront.Distribution(this, 'CloudfrontDistribution', {
            defaultBehavior: {
                origin: aws_cdk_lib_1.aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(hostingBucket),
                viewerProtocolPolicy: aws_cdk_lib_1.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });
        new aws_cdk_lib_1.aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
            sources: [aws_cdk_lib_1.aws_s3_deployment.Source.asset(path)],
            destinationBucket: hostingBucket,
            distribution,
            distributionPaths: ['/*'],
        });
        new aws_cdk_lib_1.CfnOutput(this, 'CloudFrontURL', {
            value: distribution.domainName,
            description: 'The distribution URL',
            exportName: 'CloudfrontURL',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'BucketName', {
            value: hostingBucket.bucketName,
            description: 'The name of the S3 bucket',
            exportName: 'BucketName',
        });
    }
}
exports.DeploymentService = DeploymentService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95bWVudC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVwbG95bWVudC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQU11QjtBQUNyQiwyQ0FBdUM7QUFFekMsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7QUFFL0IsTUFBYSxpQkFBa0IsU0FBUSxzQkFBUztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVTtRQUN0QyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sYUFBYSxHQUFHLElBQUksb0JBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzlELGlCQUFpQixFQUFFLG9CQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUztTQUN0RCxDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLDRCQUFjLENBQUMsWUFBWSxDQUNsRCxJQUFJLEVBQ0osd0JBQXdCLEVBQ3hCO1lBQ0UsZUFBZSxFQUFFO2dCQUNmLE1BQU0sRUFBRSxvQ0FBc0IsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQ25FLGFBQWEsQ0FDZDtnQkFDRCxvQkFBb0IsRUFBRSw0QkFBYyxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQjthQUM1RTtZQUNELGlCQUFpQixFQUFFLFlBQVk7WUFDL0IsY0FBYyxFQUFFO2dCQUNkO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7aUJBQ2hDO2FBQ0Y7U0FDRixDQUNGLENBQUM7UUFFRixJQUFJLCtCQUFpQixDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMvRCxPQUFPLEVBQUUsQ0FBQywrQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLGlCQUFpQixFQUFFLGFBQWE7WUFDaEMsWUFBWTtZQUNaLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDO1NBQzFCLENBQUMsQ0FBQztRQUNILElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ25DLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVTtZQUM5QixXQUFXLEVBQUUsc0JBQXNCO1lBQ25DLFVBQVUsRUFBRSxlQUFlO1NBQzVCLENBQUMsQ0FBQztRQUVILElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2hDLEtBQUssRUFBRSxhQUFhLENBQUMsVUFBVTtZQUMvQixXQUFXLEVBQUUsMkJBQTJCO1lBQ3hDLFVBQVUsRUFBRSxZQUFZO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9DRCw4Q0ErQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIGF3c19jbG91ZGZyb250LFxuICAgIGF3c19jbG91ZGZyb250X29yaWdpbnMsXG4gICAgYXdzX3MzLFxuICAgIGF3c19zM19kZXBsb3ltZW50LFxuICAgIENmbk91dHB1dFxuICB9IGZyb20gJ2F3cy1jZGstbGliJztcbiAgaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG4gIFxuY29uc3QgcGF0aCA9ICcuL3Jlc291cmNlcy9idWlsZCc7XG5cbiAgZXhwb3J0IGNsYXNzIERlcGxveW1lbnRTZXJ2aWNlIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nKSB7XG4gICAgICBzdXBlcihzY29wZSwgaWQpO1xuICBcbiAgICAgIGNvbnN0IGhvc3RpbmdCdWNrZXQgPSBuZXcgYXdzX3MzLkJ1Y2tldCh0aGlzLCAnRnJvbnRlbmRCdWNrZXQnLCB7XG4gICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBhd3NfczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgfSk7XG4gIFxuICAgICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGF3c19jbG91ZGZyb250LkRpc3RyaWJ1dGlvbihcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ0Nsb3VkZnJvbnREaXN0cmlidXRpb24nLFxuICAgICAgICB7XG4gICAgICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgICAgICBvcmlnaW46IGF3c19jbG91ZGZyb250X29yaWdpbnMuUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0NvbnRyb2woXG4gICAgICAgICAgICAgIGhvc3RpbmdCdWNrZXRcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogYXdzX2Nsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIG5ldyBhd3NfczNfZGVwbG95bWVudC5CdWNrZXREZXBsb3ltZW50KHRoaXMsICdCdWNrZXREZXBsb3ltZW50Jywge1xuICAgICAgICBzb3VyY2VzOiBbYXdzX3MzX2RlcGxveW1lbnQuU291cmNlLmFzc2V0KHBhdGgpXSxcbiAgICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IGhvc3RpbmdCdWNrZXQsXG4gICAgICAgIGRpc3RyaWJ1dGlvbixcbiAgICAgICAgZGlzdHJpYnV0aW9uUGF0aHM6IFsnLyonXSxcbiAgICAgIH0pO1xuICAgICAgbmV3IENmbk91dHB1dCh0aGlzLCAnQ2xvdWRGcm9udFVSTCcsIHtcbiAgICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kb21haW5OYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBkaXN0cmlidXRpb24gVVJMJyxcbiAgICAgICAgZXhwb3J0TmFtZTogJ0Nsb3VkZnJvbnRVUkwnLFxuICAgICAgfSk7XG4gIFxuICAgICAgbmV3IENmbk91dHB1dCh0aGlzLCAnQnVja2V0TmFtZScsIHtcbiAgICAgICAgdmFsdWU6IGhvc3RpbmdCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgbmFtZSBvZiB0aGUgUzMgYnVja2V0JyxcbiAgICAgICAgZXhwb3J0TmFtZTogJ0J1Y2tldE5hbWUnLFxuICAgICAgfSk7XG4gICAgfVxuICB9Il19