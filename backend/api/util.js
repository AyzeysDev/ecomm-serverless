const getResponseBody = (status, body) => {
    return {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        statusCode: status,
        body: JSON.stringify(body),
      };
    };
    
module.exports = {
    getResponseBody,
};
    