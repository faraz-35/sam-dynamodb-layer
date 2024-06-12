import { DeleteItemCommand, DeleteItemCommandInput, DeleteItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../dbClient';
import { convertToAWSFormat } from '../utils';

const DDBTable = process.env.TABLE_NAME;

// Delete Item
export const deleteItem = async (
    key: Record<string, any>,
    tableName: string = DDBTable!,
): Promise<DeleteItemCommandOutput> => {
    const params: DeleteItemCommandInput = {
        TableName: tableName,
        Key: Object.fromEntries(Object.entries(key).map(([k, v]) => [k, convertToAWSFormat(v)])),
    };
    const command = new DeleteItemCommand(params);
    return await dbClient.send(command);
};
