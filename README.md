# Notification Service Setup Guide

## Service Overview
- Consumes trip, payment, and driver-related events from Kafka to orchestrate rider and driver notifications.
- Persists notification payloads and delivery state in MongoDB for auditing and retries.
- Exposes REST endpoints under `/v1/notifications` for on-demand sending and querying, plus `/metrics` for Prometheus monitoring.
- Processes queued notifications in the background and records delivery metrics (sent, failed, queued).

## How It Works
- `Express` powers the HTTP API with middleware for JSON parsing, correlation IDs, and centralized error handling.
- Kafka consumer (`kafkajs`) subscribes to the configured topics and dispatches messages to dedicated use-cases (trip, payment, driver events).
- `SendNotificationUseCase` routes messages through channel providers defined in `src/infrastructure/notification-channels` before updating MongoDB.
- Metrics counters (see `src/infrastructure/metrics`) track notification throughput and are exposed on `/metrics` in Prometheus text format.

## Local Setup
1. **Node.js**: install Node.js `v22.x` and use the bundled npm `v10+`.
   ```bash
   nvm install 22
   nvm use 22
   ```
2. **Install dependencies**:
   ```bash
   cd notification-service
   npm install
   ```
3. **Environment variables**: configure a `.env` file or export the variables below before running the service:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `PORT` | optional (`3004`) | HTTP port for the service. |
   | `MONGODB_URI` | **yes** | MongoDB connection string (e.g. `mongodb://localhost:27019`). |
   | `MONGODB_DB_NAME` | optional (`notification-service`) | Database name storing notification documents. |
   | `KAFKA_BROKERS` | **yes** | Comma-separated Kafka brokers (e.g. `localhost:9092`). |
   | `KAFKA_CLIENT_ID` | optional (`notification-service`) | Kafka client id used by the consumer. |
   | `KAFKA_GROUP_ID` | optional (`notification-service-group`) | Consumer group for partition coordination. |
   | `KAFKA_TOPIC_TRIP_EVENTS` | optional (`trip-events`) | Kafka topic for trip domain events. |
   | `KAFKA_TOPIC_PAYMENT_EVENTS` | optional (`payment-events`) | Kafka topic for payment domain events. |
   | `KAFKA_TOPIC_DRIVER_NOTIFICATIONS` | optional (`driver-notifications`) | Topic where driver updates that trigger notifications are published. |

   Additional overrides such as `NOTIFICATION_COLLECTION` can be provided when running inside Docker.

4. **Start dependencies**: the service requires MongoDB and Kafka. From the repository root you can start them via Docker:
   ```bash
   docker compose up -d mongodb-notification kafka zookeeper
   ```

5. **Run the service**:
   - Development (TypeScript watch mode): `npm run dev`
   - Production build: `npm run build && npm start`

## Useful Endpoints
- `GET /health` – Basic health check.
- `POST /v1/notifications` – Enqueue or send an immediate notification.
- `GET /v1/notifications/:id` – Retrieve a specific notification.
- `GET /v1/notifications/recipients/:recipientId` – List notifications for a recipient.
- `GET /metrics` – Prometheus metrics covering sent/failed/queued counts.

Refer to service-specific API details in `API.md` (if present) and inspect `src/application/notification/usecases` for payload structures.

## Running with Docker Compose
- The repository-level `docker-compose.yml` defines the `notification-service`. From the project root run:
  ```bash
  docker compose up notification-service
  ```
- Docker Compose will start the MongoDB replica and Kafka broker declared as dependencies, then expose the service on port `3004`.

## Troubleshooting
- **Kafka consumer stuck**: validate broker connectivity and that topics listed in the environment variables exist; the service will log subscription failures.
- **Mongo connection errors**: ensure the URI includes credentials if required and that port `27019` (default compose mapping) is reachable.
- **High queued counts**: check `/metrics` to confirm processing status; review logs for downstream channel errors (e.g. email/SMS providers).

