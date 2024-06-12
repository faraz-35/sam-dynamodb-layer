import {
    UpdateItemCommand,
    GetItemCommand,
    UpdateItemCommandInput,
    UpdateItemCommandOutput,
    GetItemCommandOutput,
    AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { dbClient } from '../dbClient';

const DDBTable = process.env.TABLE_NAME;

// Update Item
export const updateItem = async (
    key: Record<string, any>,
    object: Record<string, any>,
    tableName: string = DDBTable!,
): Promise<Record<string, AttributeValue> | undefined> => {
    let updateExpression = 'SET ';
    const expressionAttributeNames: Record<string, any> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(object).forEach((attrKey, i) => {
        updateExpression += `#${attrKey} = :${attrKey}`;
        if (i !== Object.keys(object).length - 1) updateExpression += ', ';
        expressionAttributeNames[`#${attrKey}`] = attrKey;
        expressionAttributeValues[`:${attrKey}`] = { S: object[attrKey] };
    });

    const params: UpdateItemCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
    };
    const command = new UpdateItemCommand(params);
    const data = await dbClient.send(command);
    return data?.Attributes;
};

// Update append item to array
export const appendToArray = async (
    key: Record<string, any>,
    arrayName: string,
    value: any,
    tableName: string = DDBTable!,
): Promise<Record<string, AttributeValue> | undefined> => {
    const params: UpdateItemCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET #${arrayName} = list_append(if_not_exists(#${arrayName}, :empty_list), :new_value)`,
        ExpressionAttributeNames: {
            [`#${arrayName}`]: arrayName,
        },
        ExpressionAttributeValues: {
            ':new_value': { L: [{ S: value }] },
            ':empty_list': { L: [] },
        },
        ReturnValues: 'UPDATED_NEW',
    };
    const command = new UpdateItemCommand(params);
    const data = await dbClient.send(command);
    return data?.Attributes;
};

// Update remove item from array
export const removeFromArray = async (
    key: Record<string, any>,
    arrayName: string,
    value: any,
    tableName: string = DDBTable!,
): Promise<Record<string, AttributeValue> | undefined> => {
    // Get the current item
    const getItemParams = {
        TableName: tableName,
        Key: key,
    };
    const getItemCommand = new GetItemCommand(getItemParams);
    const currentItem: GetItemCommandOutput = await dbClient.send(getItemCommand);

    // Remove the value from the array
    const array = currentItem?.Item?.[arrayName]?.L;
    const index = array ? array.findIndex((item) => item.S === value) : -1;
    if (index !== -1) {
        array?.splice(index, 1);
    }

    // Update the item in DynamoDB
    const updateParams: UpdateItemCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET #${arrayName} = :new_array`,
        ExpressionAttributeNames: {
            [`#${arrayName}`]: arrayName,
        },
        ExpressionAttributeValues: {
            ':new_array': { L: array as any },
        },
        ReturnValues: 'UPDATED_NEW',
    };
    const command = new UpdateItemCommand(updateParams);
    const data = await dbClient.send(command);
    return data?.Attributes;
};
