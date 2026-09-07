from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from typing import Any, Iterable


GENESIS_HASH = "0" * 64


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _entry_hash(
    sequence: int,
    timestamp: str,
    event_type: str,
    payload: dict[str, Any],
    previous_hash: str,
) -> str:
    body = {
        "sequence": sequence,
        "timestamp": timestamp,
        "event_type": event_type,
        "payload": payload,
        "previous_hash": previous_hash,
    }
    return sha256(_canonical_json(body).encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class LedgerEntry:
    sequence: int
    timestamp: str
    event_type: str
    payload: dict[str, Any]
    previous_hash: str
    entry_hash: str


class AppendOnlyLedger:
    def __init__(self) -> None:
        self._entries: list[LedgerEntry] = []

    @property
    def entries(self) -> tuple[LedgerEntry, ...]:
        return tuple(self._entries)

    def append(
        self,
        event_type: str,
        payload: dict[str, Any],
        *,
        timestamp: datetime | None = None,
    ) -> LedgerEntry:
        at = timestamp or datetime.now(timezone.utc)
        timestamp_text = at.isoformat()
        sequence = len(self._entries) + 1
        previous_hash = (
            self._entries[-1].entry_hash if self._entries else GENESIS_HASH
        )
        stable_payload = json.loads(_canonical_json(payload))
        entry = LedgerEntry(
            sequence=sequence,
            timestamp=timestamp_text,
            event_type=event_type,
            payload=stable_payload,
            previous_hash=previous_hash,
            entry_hash=_entry_hash(
                sequence,
                timestamp_text,
                event_type,
                stable_payload,
                previous_hash,
            ),
        )
        self._entries.append(entry)
        return entry

    def verify(self) -> bool:
        return verify_entries(self._entries)

    def export(self) -> list[dict[str, Any]]:
        return [asdict(entry) for entry in self._entries]


def verify_entries(entries: Iterable[LedgerEntry]) -> bool:
    previous_hash = GENESIS_HASH
    expected_sequence = 1
    for entry in entries:
        if entry.sequence != expected_sequence:
            return False
        if entry.previous_hash != previous_hash:
            return False
        expected_hash = _entry_hash(
            entry.sequence,
            entry.timestamp,
            entry.event_type,
            entry.payload,
            entry.previous_hash,
        )
        if entry.entry_hash != expected_hash:
            return False
        previous_hash = entry.entry_hash
        expected_sequence += 1
    return True

