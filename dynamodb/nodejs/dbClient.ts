// dbClient.js (or dbClient.ts)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const isLocal = process.env.ENV === 'LOCAL';

export const dbClient = new DynamoDBClient({
    endpoint: isLocal ? 'http://localhost:8000' : undefined,
    region: isLocal ? 'ca-central-1' : undefined,
});
