import AWS from 'aws-sdk';
import querystring from 'querystring';

const s3 = new AWS.S3();
const sns = new AWS.SNS();

const BUCKET_NAME = process.env.BUCKET_NAME;
const EVENTS_FILE_KEY = 'build/data/events.json';

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (!event.body) {
        return respond(400, { message: 'Request body missing' });
    }

    let body;
    try {
        const contentType = event.headers['Content-Type'] || event.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            body = JSON.parse(event.body);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            body = querystring.parse(event.body);
        } else {
            return respond(400, { message: 'Unsupported content type. Use JSON or form-urlencoded.' });
        }
    } catch (err) {
        return respond(400, { message: 'Invalid request format', error: err.message });
    }

    // Support alt keys too
    const name = body.name || body.title;
    const date = body.date;
    const description = body.description || body.desc;

    if (!name || !date || !description) {
        return respond(400, { message: 'Missing required fields: name, date, description' });
    }

    try {
        let events = [];
        try {
            const result = await s3.getObject({ Bucket: BUCKET_NAME, Key: EVENTS_FILE_KEY }).promise();
            events = JSON.parse(result.Body.toString());
        } catch (err) {
            if (err.code !== 'NoSuchKey') throw err;
        }

        const newEvent = { name, date, description };
        events.push(newEvent);

        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: EVENTS_FILE_KEY,
            Body: JSON.stringify(events, null, 2),
            ContentType: 'application/json'
        }).promise();

        await sns.publish({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: `New event added:\nName: ${name}\nDate: ${date}\nDescription: ${description}`,
            Subject: 'New Event Created'
        }).promise();

        return respond(200, { message: 'Event created and notification sent' });

    } catch (err) {
        console.error('Internal error:', err);
        return respond(500, { message: 'Failed to create event', error: err.message });
    }
};

function respond(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(body)
    };
}
