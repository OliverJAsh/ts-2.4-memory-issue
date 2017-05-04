import * as redis from 'redis';

// Redis stores:
// - session (userId)
// - user Twitter credentials
// - user web push subscription
export const redisClient = redis.createClient({
    host: 'redis',
    port: 6379,
});
