"use strict";

const AWS = require("aws-sdk");
const { getResponseBody } = require("./util")
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.ORDER_TABLE;

//GET ALL ORDERS
module.exports.fetchOrders = async (event, context, callback) => {
    await getAll().then((data) => {
        callback(null, getResponseBody(200, data.Items))
    }).catch(() => {
        callback(new Error("Unable to Fetch Orders"));
    });
};

function getAll() {
    const params = {
        TableName: tableName,
    }
    
    return dynamoDB.scan(params).promise();
}

//CREATE AN ORDER
module.exports.createOrder = async (event, context, callback) => {
    const token = event.headers.Authorization;
    const tokenSections = token.split('.');
    const decodedJwt = JSON.parse(Buffer.from(tokenSections[1], 'base64').toString('utf8'));
    const user_name = decodedJwt['cognito:username'];
    const user_email = decodedJwt.email;
    const body = JSON.parse(event.body);
    const orderId = context.awsRequestId;
    const data = {orderId, user_name, user_email,...body};
    
    await createOne(data).then(() => {
        callback(null, getResponseBody(201, {
            Operation : 'SAVE',
            Message: 'SUCCESS',
            Item: data
        }));
    }).catch(() => {
        callback(new Error("Unable to Create a Order"));
    });
};

function createOne(data) {
    const params = {
        TableName: tableName,
        Item: data,
    }
    
    return dynamoDB.put(params).promise();
}

//GET ORDER OF A USER
module.exports.fetchOrderById = async (event, context, callback) => {
    let reqId = event.pathParameters.id || {};
    await getOne(reqId).then((data) => {
        callback(null, getResponseBody(200, data.Item));
    }).catch(() => {
        callback(new Error("Unable to Fetch User Order"));
    });
};

function getOne(reqId) {
    const params = {
        TableName: tableName,
        Key: {
           'orderId': reqId
        },
    }
    return dynamoDB.get(params).promise();
}

//UPDATE ORDER STATUS
module.exports.updateOrder = async (event, context, callback) => {
    let item = JSON.parse(event.body);
    let reqId = event.pathParameters.id || {};
    await updateOne(reqId, item).then((data) => {
        callback(null, getResponseBody(202, {
            Operation : 'UPDATE',
            Message: 'SUCCESS',
            Item: data.Attributes
        }));
    }).catch(() => {
        callback(new Error("Unable to Update Order Status"));
    });
};

function updateOne(reqId, item) {
    const params = {
        TableName: tableName,
        Key: {
        'orderId': reqId,
        },
        UpdateExpression: "set orderStatus = :os",
        ExpressionAttributeValues:{
        ":os": item.orderStatus,
        },
        ReturnValues:"UPDATED_NEW",
    }
    
    return dynamoDB.update(params).promise();
}

//DELETE/CANCEL AN ORDER
module.exports.cancelOrder = async (event, context, callback) => {
    let reqId = event.pathParameters.id || {};
    await deleteOne(reqId).then(() => {
        callback(null, getResponseBody(200, {
            Operation : 'DELETE',
            Message: 'SUCCESS'
        }));
    }).catch(() => {
        callback(new Error("Unable to Cancel User Order"));
    });
};

function deleteOne(reqId) {
    const params = {
        TableName: tableName,
        Key: {
            'orderId': reqId
        }
    }
    
    return dynamoDB.delete(params).promise();
}
