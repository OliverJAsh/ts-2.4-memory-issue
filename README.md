# Twitter PWA

Auth using Sign In with Twitter (not 3 legged)
https://dev.twitter.com/web/sign-in/implementing

## Docker

``` bash
docker-compose up

# Redis CLI
docker exec -it twitterpaper_redis_1 redis-cli
```

Workaround for time sync issues:
https://github.com/docker/for-mac/issues/17#issuecomment-290667509

Without compose:

``` bash

# Create image with tag
docker build --tag twitter-paper .

# View created image
docker images

# Copy new Yarn lockfile to working directory so it can be commited
docker run --rm --entrypoint cat twitter-paper:latest /tmp/yarn.lock > yarn.lock

# If containers already exist, we just need to start them
docker start redis
docker start twitter-paper

# If they exist but we want new ones, we need to remove them
docker rm redis
docker rm twitter-paper
# If it's running, we must force
docker rm --force twitter-paper

# Create container for images and start
# Redis image is created on-the-fly
docker run --publish 6379:6379 --detach --name redis redis
docker run --publish 8080:8080 --detach --name twitter-paper --env-file ./conf/dev.conf --expose 8080 --link redis:redis twitter-paper yarn start

# View containers
docker ps
docker ps --all

docker logs --follow twitter-paper

curl http://localhost:8080/

# Run tests (remove on exit)
docker run --rm twitter-paper yarn test

# Access Redis CLI (remove of exit)
docker run -it --link redis:redis --rm redis redis-cli -h redis -p 6379

# Start!
docker build --tag twitter-paper . \
    && docker rm --force twitter-paper \
    && docker run --publish 8080:8080 --detach --name twitter-paper --env-file ./conf/dev.conf --expose 8080 --link redis:redis twitter-paper yarn start \
    && docker logs --follow twitter-paper
```

## Chrome

```
 /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure=http://localhost:8080/ --user-data-dir=chrome http://localhost:8080/auth
 ```

## Design

Twitter's timeline API is limited to 800 tweets. Therefore we have some edge
cases that require explanation to the user:

- Range begins after the last available tweet.
- Range begins in available tweets but possibly ends after the last available
  tweet.

### Entity relationship diagram
Twitter user - User
User - 0 or many Subscription

### Time zone

Currently we derive this from the IP of the successful authentication request:

IP -> Location -> Time zone

In the future it could come from:

- Twitter user profile (although it is nullable; https://dev.twitter.com/overview/api/users)
- Client location detection
- User input

UTC offset will not suffice as it doesn't care for Daylight Saving Time (DST)
