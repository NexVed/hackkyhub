"""Optional managed Kafka transport for public hackathon records.

No user profiles, credentials or authentication data belong on these topics.
The consumer commits only after a successful URL upsert or confirmed DLQ write.
"""
import json
import os
from datetime import datetime, timezone


def config():
    required = ("KAFKA_BOOTSTRAP_SERVERS", "KAFKA_API_KEY", "KAFKA_API_SECRET")
    if any(not os.getenv(key) for key in required):
        raise RuntimeError("Kafka bootstrap servers and both API credentials are required")
    return {
        "bootstrap.servers": os.environ[required[0]],
        "security.protocol": "SASL_SSL",
        "sasl.mechanism": "PLAIN",
        "sasl.username": os.environ[required[1]],
        "sasl.password": os.environ[required[2]],
        "client.id": "hackkyhub-ingestion",
    }


def publish(records):
    from confluent_kafka import Producer
    producer = Producer({**config(), "enable.idempotence": True, "acks": "all", "delivery.timeout.ms": 120000})
    failures = []
    topic = os.getenv("KAFKA_TOPIC", "hackkyhub.hackathons.v1")

    def delivered(error, message):
        if error:
            failures.append(str(error))

    for record in records:
        envelope = {"version": 1, "collected_at": datetime.now(timezone.utc).isoformat(), "hackathon": record}
        data = json.dumps(envelope).encode()
        if len(data) > 512_000:
            raise ValueError("Kafka event exceeds the 512KB application limit")
        while True:
            try:
                producer.produce(topic, key=record["url"].encode(), value=data, on_delivery=delivered)
                break
            except BufferError:
                producer.poll(1)
        producer.poll(0)
    remaining = producer.flush(120)
    if remaining or failures:
        raise RuntimeError(f"Kafka delivery failed: pending={remaining}, failed={len(failures)}")
    return {"published": len(records)}


def decode_event(value):
    envelope = json.loads(value)
    if envelope.get("version") != 1 or not isinstance(envelope.get("hackathon"), dict):
        raise ValueError("Unsupported Kafka event schema")
    record = envelope["hackathon"]
    if not isinstance(record.get("url"), str) or not record["url"].startswith("https://"):
        raise ValueError("Kafka event requires an HTTPS hackathon URL")
    return record
