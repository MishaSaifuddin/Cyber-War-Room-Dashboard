"""
Cyber War Room - Anomaly Detection
Statistical anomaly detection using rolling baselines
"""
import time
from collections import deque


class AnomalyDetector:
    """Detects statistical anomalies in telemetry data."""

    def __init__(self, window_size=30, std_dev_threshold=3.0):
        """
        window_size: number of samples to keep for baseline calculation
        std_dev_threshold: number of standard deviations to flag anomaly
        """
        self.cpu_samples = deque(maxlen=window_size)
        self.ram_samples = deque(maxlen=window_size)
        self.network_samples = deque(maxlen=window_size)
        self.process_samples = deque(maxlen=window_size)
        self.std_dev_threshold = std_dev_threshold
        self.anomalies = []
        self.anomaly_history = []

    def add_sample(self, key, value):
        """Add a data sample to the appropriate deque."""
        if key == "cpu":
            self.cpu_samples.append(value)
        elif key == "ram":
            self.ram_samples.append(value)
        elif key == "network":
            self.network_samples.append(value)
        elif key == "process_count":
            self.process_samples.append(value)

    def check_anomaly(self, key, value):
        """
        Check if a value is anomalous compared to the baseline.
        Returns: (is_anomaly, z_score, mean, std_dev)
        """
        samples = {
            "cpu": self.cpu_samples,
            "ram": self.ram_samples,
            "network": self.network_samples,
            "process_count": self.process_samples,
        }.get(key, None)

        if not samples or len(samples) < 10:  # Need enough samples for reliable stats
            return (False, 0, 0, 0)

        mean = sum(samples) / len(samples)
        variance = sum((x - mean) ** 2 for x in samples) / len(samples)
        std_dev = variance ** 0.5

        if std_dev == 0:
            return (False, 0, mean, 0)

        z_score = abs(value - mean) / std_dev
        is_anomaly = z_score > self.std_dev_threshold

        if is_anomaly:
            self._record_anomaly(key, value, mean, z_score)

        return (is_anomaly, z_score, mean, std_dev)

    def _record_anomaly(self, key, value, mean, z_score):
        """Record an anomaly event."""
        anomaly = {
            "key": key,
            "value": round(value, 2),
            "mean": round(mean, 2),
            "z_score": round(z_score, 2),
            "time": time.time(),
            "severity": "HIGH" if z_score > 4 else "MEDIUM",
        }
        self.anomalies.append(anomaly)
        self.anomaly_history.append(anomaly)

        # Keep only recent anomalies
        self.anomalies = [
            a for a in self.anomalies
            if time.time() - a["time"] < 120
        ]

        if len(self.anomaly_history) > 200:
            self.anomaly_history = self.anomaly_history[-200:]

    def get_active_anomalies(self):
        """Get currently active anomalies."""
        return self.anomalies

    def get_anomaly_stats(self):
        """Get summary statistics."""
        return {
            "cpu_mean": round(sum(self.cpu_samples) / len(self.cpu_samples), 1) if self.cpu_samples else 0,
            "ram_mean": round(sum(self.ram_samples) / len(self.ram_samples), 1) if self.ram_samples else 0,
            "sample_count": len(self.cpu_samples),
            "anomaly_count": len(self.anomalies),
        }


detector = AnomalyDetector()
