"""Run an optional, at-least-once Kafka consumer. Requires requirements-ops.txt."""
import json
import logging
import os
import signal
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv
from app.kafka_transport import config, decode_event
from app.telemetry import initialize
from scripts.sync_to_frontend import push

sentry = None


def main():
    from confluent_kafka import Consumer, Producer
    sync_url = os.getenv("FRONTEND_SYNC_URL", "")
    token = os.getenv("SCRAPER_SYNC_TOKEN", "")
    if not sync_url.startswith("https://") or not token:
        raise RuntimeError("An HTTPS sync endpoint and sync credential are required")
    consumer = Consumer({**config(), "group.id": os.getenv("KAFKA_GROUP_ID", "hackkyhub-sync-v1"),
                         "enable.auto.commit": False, "auto.offset.reset": "earliest", "max.poll.interval.ms": 600000})
    producer = Producer({**config(), "enable.idempotence": True, "acks": "all"})
    consumer.subscribe([os.getenv("KAFKA_TOPIC", "hackkyhub.hackathons.v1")])
    running = True

    def stop(*args):
        nonlocal running
        running = False
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        while running:
            message = consumer.poll(1)
            if message is None:
                continue
            if message.error():
                raise RuntimeError("Kafka polling failed; inspect broker health")
            record = None
            for attempt in range(3):
                try:
                    record = decode_event(message.value())
                    push([record], sync_url, token)
                    break
                except (ValueError, TypeError, KeyError):
                    record = None
                    break  # malformed data goes directly to the DLQ
                except Exception:
                    if attempt < 2:
                        time.sleep(2 ** attempt)
            else:
                record = None
            # Commit only after a successful sync. Decode failures and exhausted
            # retries preserve the raw public event on a durable dead-letter topic.
            if record is None:
                delivered = []
                body = json.dumps({"source_topic": message.topic(), "partition": message.partition(),
                                   "offset": message.offset(), "payload": message.value().decode("utf-8", errors="replace")})
                producer.produce(os.getenv("KAFKA_DLQ_TOPIC", "hackkyhub.hackathons.dlq.v1"),
                                 key=message.key(), value=body.encode(),
                                 on_delivery=lambda error, msg: delivered.append(error))
                if producer.flush(60) or not delivered or delivered[0]:
                    raise RuntimeError("DLQ delivery failed; source offset was not committed")
                if sentry:
                    sentry.capture_message("Kafka record routed to the DLQ", level="error")
            consumer.commit(message=message, asynchronous=False)
    finally:
        consumer.close()


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    sentry = initialize()
    logging.basicConfig(level=logging.WARNING)
    try:
        main()
    except Exception as exc:
        if sentry:
            sentry.capture_exception(exc)
        raise
    finally:
        if sentry:
            sentry.flush(timeout=5)
