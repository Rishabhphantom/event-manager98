import AWS from 'aws-sdk';

const s3 = new AWS.S3();

const BUCKET_NAME = 'event-manager98'; // Replace with your S3 bucket name
const FILE_KEY = 'build/data/events.json'; // Path to your events.json

export const handler = async (event) => {
    try {
        const data = await s3.getObject({
            Bucket: BUCKET_NAME,
            Key: FILE_KEY
        }).promise();

        const events = JSON.parse(data.Body.toString());

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Allow all origins (for testing)
            },
            body: JSON.stringify(events)
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ message: "Failed to load events" })
        };
    }
};
