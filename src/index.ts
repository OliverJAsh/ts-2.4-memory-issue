import { createServer, Server } from 'http';
import * as bodyParser from 'body-parser';
import * as createRedisStore from 'connect-redis';
import * as express from 'express';
import * as session from 'express-session';

import { redisClient } from './redis-client';
import * as routes from './routes';

const app = express();

app.use(express.static(`${__dirname}/client`));

app.use(bodyParser.json());

const RedisStore = createRedisStore(session);
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        // TODO: Configure for security
        secret: 'keyboard cat',
        // Required options:
        resave: false,
        saveUninitialized: false,
    }),
);

app.get('/auth', routes.authIndex);
app.get('/auth/callback', routes.authCallback);
app.get('/', routes.home);

app.post('/api/push-subscription', routes.apiPushSubscription);

const onListen = (server: Server) => {
    const { port } = server.address();

    console.log(`Server running on port ${port}`); // eslint-disable-line no-console
};

const httpServer = createServer(app);
httpServer.listen(8080, () => onListen(httpServer));
