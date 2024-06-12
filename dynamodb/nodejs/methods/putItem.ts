import { AttributeValue, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../dbClient';
import { convertToAWSFormat } from '../utils';

const DDBTable = process.env.TABLE_NAME;

export const putItem = async (
    item: Record<string, string | number | string[] | Record<string, unknown>>,
    tableName = DDBTable,
): Promise<string> => {
    const id = Date.now().toString(16) + Math.round(Math.random() * 1e9).toString(16);
    const dynamoItem: Record<string, AttributeValue> = { id: { S: id } };
    for (const key in item) {
        dynamoItem[key] = convertToAWSFormat(item[key]);
    }
    const params: PutItemCommandInput = {
        TableName: tableName,
        Item: dynamoItem,
        ReturnValues: 'ALL_OLD',
    };
    const command = new PutItemCommand(params);
    await dbClient.send(command);
    return id;
};
