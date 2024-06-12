import { GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../dbClient';
import { PopulateParam } from '../types';
import { convertFromAWSFormat } from '../utils';

const DDBTable = process.env.TABLE_NAME;

// Get Item
export const getItem = async (
    key: Record<string, any>,
    attributes?: string[],
    tableName: string = DDBTable!,
    populate?: PopulateParam[],
): Promise<any> => {
    const params: GetItemCommandInput = {
        TableName: tableName,
        Key: Object.fromEntries(Object.entries(key).map(([k, v]) => [k, { S: v }])),
        ProjectionExpression: attributes ? attributes.join(', ') : undefined,
    };

    const command = new GetItemCommand(params);
    const item = await dbClient.send(command);

    // Populating fields
    if (populate && item.Item) {
        const promises = populate.map(async (pop) => {
            const relatedKey = { id: item.Item?.[pop.fieldName] };
            const relatedParams: GetItemCommandInput = {
                TableName: pop.tableName,
                Key: relatedKey as any,
                ProjectionExpression: pop.attributes ? pop.attributes.join(', ') : undefined,
            };

            const relatedCommand = new GetItemCommand(relatedParams);
            const relatedData = await dbClient.send(relatedCommand);
            if (item.Item && relatedData.Item) {
                item.Item[pop.fieldName] = relatedData.Item as any;
            }
        });

        await Promise.all(promises);
    }
    if (item.Item) {
        for (const key in item.Item) {
            item.Item[key] = convertFromAWSFormat(item.Item[key]);
        }
    }
    return item.Item;
};
