#!/bin/bash

cd workbench
uvicorn _api.main:app --host 0.0.0.0 --port 8000 --reload