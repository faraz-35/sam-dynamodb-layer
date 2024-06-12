import { AttributeValue } from '@aws-sdk/client-dynamodb';

export const convertToAWSFormat = (value: any): AttributeValue => {
    if (typeof value === 'string') {
        return { S: value };
    } else if (typeof value === 'number') {
        return { N: value.toString() };
    } else if (Array.isArray(value)) {
        return { SS: value.map(String) };
    } else if (typeof value === 'object') {
        const awsObject: Record<string, AttributeValue> = {};
        for (const key in value) {
            awsObject[key] = convertToAWSFormat(value[key]);
        }
        return { M: awsObject };
    } else {
        throw new Error(`Unsupported type: ${typeof value}`);
    }
};

export const convertFromAWSFormat = (value: AttributeValue): any => {
    if (value.S !== undefined) {
        return value.S;
    } else if (value.N !== undefined) {
        return Number(value.N);
    } else if (value.SS !== undefined) {
        return value.SS;
    } else if (value.M !== undefined) {
        const jsObject: Record<string, any> = {};
        for (const key in value.M) {
            jsObject[key] = convertFromAWSFormat(value.M[key]);
        }
        return jsObject;
    } else if (typeof value === 'object' && value !== null) {
        const jsObject: Record<string, any> = {};
        for (const key in value) {
            jsObject[key] = convertFromAWSFormat((value as Record<string, any>)[key]);
        }
        return jsObject;
    } else {
        throw new Error(`Unsupported type: ${JSON.stringify(value)}`);
    }
};
