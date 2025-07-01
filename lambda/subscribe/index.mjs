import AWS from 'aws-sdk';
import querystring from 'querystring';

// Initialize SNS client
const sns = new AWS.SNS();

/**
 * Lambda handler function to subscribe an email to an SNS topic
 * @param {Object} event - API Gateway request object
 * @returns {Object} - HTTP response object
 */
export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event));

    if (!event.body) {
        console.error("Request body is missing");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Request body is missing' })
        };
    }

    let email;

    try {
        // Detect content-type header
        const contentTypeHeader =
            event.headers["Content-Type"] ||
            event.headers["content-type"] ||
            "";

        let requestBody;

        if (contentTypeHeader.includes("application/x-www-form-urlencoded")) {
            // Handle URL-encoded form data
            requestBody = querystring.parse(event.body);
        } else {
            // Default to JSON parsing
            requestBody = JSON.parse(event.body);
        }

        email = requestBody.email;

        if (!email) {
            console.warn("Email is required but not provided");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Email is required' })
            };
        }

    } catch (err) {
        console.error("Error parsing request body:", err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid request body',
                error: err.message
            })
        };
    }

    // Prepare SNS subscription parameters
    const params = {
        Protocol: 'email',
        TopicArn: process.env.SNS_TOPIC_ARN,
        Endpoint: email
    };

    try {
        console.log(`Subscribing ${email} to topic ${params.TopicArn}`);
        await sns.subscribe(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Subscription request sent' })
        };
    } catch (error) {
        console.error("Failed to subscribe:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to subscribe',
                error: error.message
            })
        };
    }
};
