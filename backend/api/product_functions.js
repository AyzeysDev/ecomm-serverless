"use strict";

const AWS = require("aws-sdk");
const { getResponseBody } = require("./util")
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.PRODUCT_TABLE;

//GET ALL PRODUCTS
module.exports.fetchProducts = async (event, context, callback) => {
    await getAll().then((data) => {
        callback(null, getResponseBody(200, data.Items))
    }).catch(() => {
        callback(new Error("Unable to Fetch Products"));
    });
};

function getAll() {
    const params = {
        TableName: tableName,
    }
    
    return dynamoDB.scan(params).promise();
}

//CREATE A PRODUCT
module.exports.createProduct = async (event, context, callback) => {
    const id = context.awsRequestId
    const body = JSON.parse(event.body)
    const data = {id, ...body}
    await createOne(data).then(() => {
        callback(null, getResponseBody(201, {
            Operation : 'SAVE',
            Message: 'SUCCESS',
            Item: data
        }));
    }).catch(() => {
        callback(new Error("Unable to Create a Product"));
    });
};

function createOne(data) {
    const params = {
        TableName: tableName,
        Item: data
    }
    
    return dynamoDB.put(params).promise();
}

//DELETE A PRODUCT
module.exports.deleteProduct = async (event, context, callback) => {
    let reqId = event.pathParameters.id || {};
    await deleteOne(reqId).then(() => {
        callback(null, getResponseBody(200, {
            Operation : 'DELETE',
            Message: 'SUCCESS'
        }));
    }).catch(() => {
        callback(new Error("Unable to Delete a Product"));
    });
};

function deleteOne(reqId) {
    const params = {
        TableName: tableName,
        Key: {
            'id': reqId
         }
    }
    
    return dynamoDB.delete(params).promise();
}

//GET PRODUCT BY ID
module.exports.fetchProductById = async (event, context, callback) => {
    let reqId = event.pathParameters.id || {};
    await getOne(reqId).then((data) => {
        callback(null, getResponseBody(200, data.Item));
    }).catch(() => {
        callback(new Error("Unable to Fetch Product"));
    });
};

function getOne(reqId) {
    const params = {
        TableName: tableName,
        Key: {
           'id': reqId
        },
    }
    return dynamoDB.get(params).promise();
}

//UPDATE PRODUCT
module.exports.updateProduct = async (event, context, callback) => {
    let item = JSON.parse(event.body);
    let reqId = event.pathParameters.id || {};
    await updateOne(reqId, item).then((data) => {
        callback(null, getResponseBody(202, {
            Operation : 'UPDATE',
            Message: 'SUCCESS',
            Item: data.Attributes
        }));
    }).catch(() => {
        callback(new Error("Unable to Update Product Details"));
    });
};

function updateOne(reqId, item) {
    const params = {
        TableName: tableName,
        Key: {
        'id': reqId,
        },
        UpdateExpression: "set productName = :pn, productCategory = :pc, productDescription = :pd, availablityStatus = :as, quantity = :q, price = :p",
        ExpressionAttributeValues:{
        ":pn": item.productName,
        ":pc": item.productCategory,
        ":pd": item.productDescription,
        ":as": item.availablityStatus,
        ":q": item.quantity,
        ":p": item.price,
        },
        ReturnValues:"UPDATED_NEW",
    }
    
    return dynamoDB.update(params).promise();
}