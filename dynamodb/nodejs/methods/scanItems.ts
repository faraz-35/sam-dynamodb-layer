import { ScanCommand, ScanCommandInput, BatchGetItemCommand, BatchGetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { dbClient } from '../dbClient';
import { PopulateParam } from '../types';
import { convertFromAWSFormat } from '../utils';

const DDBTable = process.env.TABLE_NAME;

// Scan
export const scanItems = async (
    limit?: number,
    exclusiveStartKey?: string,
    attributes?: string,
    tableName: string = DDBTable!,
    filter?: { [key: string]: any },
    populate?: PopulateParam[],
    populateFilter?: { fieldName: string; filter: { [key: string]: any } }[],
): Promise<any> => {
    const params: ScanCommandInput = {
        TableName: tableName,
        Limit: limit ?? undefined,
    };
    if (exclusiveStartKey) {
        params.ExclusiveStartKey = { id: { S: exclusiveStartKey } };
    }
    if (attributes && attributes.length > 0) {
        params.ProjectionExpression = attributes.split(',').join(', ');
    }
    if (filter) {
        const filterExpressions = Object.keys(filter).map((key) => `#${key} = :${key}`);
        params.FilterExpression = filterExpressions.join(' AND ');
        params.ExpressionAttributeNames = {};
        params.ExpressionAttributeValues = {};
        for (const key in filter) {
            params.ExpressionAttributeNames[`#${key}`] = key;
            params.ExpressionAttributeValues[`:${key}`] = { S: filter[key] };
        }
    }
    const command = new ScanCommand(params);
    const data = await dbClient.send(command);

    // Populate fields
    if (populate && data.Items) {
        const promises = populate.map(async (pop) => {
            if (data.Items) {
                let keys = data.Items.map((item) => ({ id: { S: item[pop.fieldName].S } }));
                keys = keys.filter((v, i, a) => a.findIndex((t) => t.id.S === v.id.S) === i);
                const relatedParams: BatchGetItemCommandInput = {
                    RequestItems: {
                        [pop.tableName]: {
                            Keys: keys as any,
                            ProjectionExpression: pop.attributes ? pop.attributes.join(', ') : undefined,
                        },
                    },
                };
                const relatedCommand = new BatchGetItemCommand(relatedParams);
                const relatedData = await dbClient.send(relatedCommand);
                const relatedItems = relatedData.Responses?.[pop.tableName];
                for (let i = 0; i < data.Items.length; i++) {
                    const relatedItem = relatedItems?.find((item) => item.id.S === data.Items?.[i][pop.fieldName].S);
                    data.Items[i][pop.fieldName] = relatedItem as any;
                }
            }
        });
        await Promise.all(promises);
    }

    // Filtering fields based on populateFilter
    if (populate && populateFilter && data.Items) {
        data.Items = data.Items.filter((item) => {
            return populateFilter.every((popFilter) => {
                const value = popFilter.filter;
                const itemValue = item[popFilter.fieldName];
                return (
                    itemValue &&
                    Object.keys(value).every((key) => (itemValue as Record<string, any>)[key].S === value[key])
                );
            });
        });
    }
    if (data.Items) {
        data.Items = data.Items.map((item) => {
            const jsItem: Record<string, any> = {};
            for (const key in item) {
                jsItem[key] = convertFromAWSFormat(item[key]);
            }
            return jsItem;
        });
    }
    return {
        Items: data.Items,
        LastEvaluatedKey: data.LastEvaluatedKey?.id.S,
        Count: data.Count,
    };
};
