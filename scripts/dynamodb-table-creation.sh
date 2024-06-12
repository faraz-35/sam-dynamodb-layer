test_table_definition='{
  "TableName": "TestTable",
  "AttributeDefinitions": [
    { "AttributeName": "id", "AttributeType": "S" },
    { "AttributeName": "searchId", "AttributeType": "S" }
  ],
  "KeySchema": [
    { "AttributeName": "id", "KeyType": "HASH" }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "searchId",
      "KeySchema": [
        { "AttributeName": "searchId", "KeyType": "HASH" }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ]
}'
test2_table_definition='{
  "TableName": "Test2Table",
  "AttributeDefinitions": [
    { "AttributeName": "id", "AttributeType": "S" },
    { "AttributeName": "searchId", "AttributeType": "S" }
  ],
  "KeySchema": [
    { "AttributeName": "id", "KeyType": "HASH" }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "searchId",
      "KeySchema": [
        { "AttributeName": "searchId", "KeyType": "HASH" }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ]
}'

# Check if TestTable exists
if ! aws dynamodb describe-table --table-name TestTable --endpoint-url http://localhost:8000 > /dev/null 2>&1
then
  # Create TestTable
  aws dynamodb create-table --cli-input-json "$test_table_definition" --endpoint-url http://localhost:8000 > /dev/null
fi

# Check if Test2Table exists
if ! aws dynamodb describe-table --table-name Test2Table --endpoint-url http://localhost:8000 > /dev/null 2>&1
then
  # Create Test2Table
  aws dynamodb create-table --cli-input-json "$test2_table_definition" --endpoint-url http://localhost:8000 > /dev/null
fi