# Weather Activity Ranker

## Project Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Then use `deploy.sh` to manage the app:

```bash
./deploy.sh up       # build images and start all services
./deploy.sh down     # stop and remove all containers
./deploy.sh rebuild  # rebuild from scratch and start
./deploy.sh restart  # down + rebuild + start
./deploy.sh logs     # follow logs for all services
```

## URLs

Once the services are running:

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| GraphQL API | http://localhost:4000/graphql |
