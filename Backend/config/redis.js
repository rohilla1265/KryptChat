import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: 'Mq0o5SpkQPg1m52KzuGL0T6huIhy7SjC',
    socket: {
        host: 'redis-17702.crce214.us-east-1-3.ec2.cloud.redislabs.com',
        port: 17702
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on("connect", () => {
    console.log("Redis connected successfully");
});
await redisClient.connect();
export default redisClient;