from enum import Enum

import os
from tkinter.constants import NONE
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

class RequestStatus(Enum):
    STARTED = "STARTED"
    READY = "READY"
    COMPLETE = "COMPLETE"
    ERROR = "ERROR"


class TelemetryClient:
    _client = NONE
    _initialized = False

    @classmethod
    def log_request(
        cls,
        status: RequestStatus,
        user_email: str,
        method: str,
        type: str,
        job_id: str = None,
        msg: str = "",
    ):

        if not cls._initialized:
            cls._client = InfluxDBClient(
                url=os.getenv("INFLUXDB_ADDRESS"), 
                token=os.getenv("INFLUXDB_ADMIN_TOKEN")
            ).write_api(write_options=SYNCHRONOUS)
            cls._initialized = True

        point: Point = Point("request_status").field("status", status.value)

        point = point\
        .tag("user_email", user_email)\
        .tag("method", method)\
        .tag("type", type)

        if job_id:
            point = point.tag("job_id", job_id)

        if msg:
            point = point.tag("msg", msg)

        cls._client.write(
            bucket=os.getenv("INFLUXDB_BUCKET"),
            org=os.getenv("INFLUXDB_ORG"),
            record=point,
        )
