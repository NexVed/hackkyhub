import json
import unittest
import types
from unittest.mock import MagicMock, patch

from app.kafka_transport import config, decode_event
from app.telemetry import initialize
from scripts import kafka_to_frontend


class OperationsTests(unittest.TestCase):
    def test_missing_kafka_credentials_fail_before_network(self):
        with patch.dict('os.environ', {}, clear=True):
            with self.assertRaises(RuntimeError):
                config()

    def test_public_event_schema_and_unsafe_urls(self):
        record = {"url": "https://devpost.com/hackathons/example", "name": "Example"}
        self.assertEqual(decode_event(json.dumps({"version": 1, "hackathon": record})), record)
        for event in ({"version": 2, "hackathon": record}, {"version": 1, "hackathon": []},
                      {"version": 1, "hackathon": {"url": "javascript:alert(1)"}}):
            with self.assertRaises(ValueError):
                decode_event(json.dumps(event))

    def test_monitoring_is_optional_without_credentials(self):
        with patch.dict('os.environ', {}, clear=True):
            self.assertIsNone(initialize())

    def exercise_consumer(self, sync_error=None, dlq_pending=0):
        message = MagicMock()
        message.error.return_value = None
        message.value.return_value = json.dumps({"version": 1, "hackathon": {"url": "https://devpost.com/x"}}).encode()
        message.topic.return_value = "events"
        message.partition.return_value = 0
        message.offset.return_value = 1
        message.key.return_value = b"https://devpost.com/x"
        consumer = MagicMock()
        consumer.poll.side_effect = [message, RuntimeError("test complete")]
        producer = MagicMock()
        producer.flush.return_value = dlq_pending
        producer.produce.side_effect = lambda *args, **kwargs: kwargs["on_delivery"](None, message)
        sdk = types.SimpleNamespace(Consumer=lambda config: consumer, Producer=lambda config: producer)
        with patch.dict("sys.modules", {"confluent_kafka": sdk}), \
             patch.dict("os.environ", {"FRONTEND_SYNC_URL": "https://example.convex.site/api/hackathons/sync", "SCRAPER_SYNC_TOKEN": "test-only"}), \
             patch.object(kafka_to_frontend, "config", return_value={}), \
             patch.object(kafka_to_frontend, "push", side_effect=sync_error) as sync, \
             patch.object(kafka_to_frontend.time, "sleep"), \
             patch.object(kafka_to_frontend.signal, "signal"):
            with self.assertRaises(RuntimeError):
                kafka_to_frontend.main()
        consumer.close.assert_called_once()
        return consumer, producer, sync

    def test_successful_sync_commits_without_dead_letter(self):
        consumer, producer, sync = self.exercise_consumer()
        sync.assert_called_once()
        consumer.commit.assert_called_once()
        producer.produce.assert_not_called()

    def test_exhausted_sync_retries_commit_after_dlq_delivery(self):
        consumer, producer, sync = self.exercise_consumer(RuntimeError("sync unavailable"))
        self.assertEqual(sync.call_count, 3)
        producer.produce.assert_called_once()
        consumer.commit.assert_called_once()

    def test_failed_dlq_delivery_never_commits_source_offset(self):
        consumer, producer, sync = self.exercise_consumer(RuntimeError("sync unavailable"), dlq_pending=1)
        producer.produce.assert_called_once()
        consumer.commit.assert_not_called()
