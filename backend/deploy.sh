#!/usr/bin/env bash

docker build . -t backend-chat
docker run -d -p 0.0.0.0:5000:8000 backend-chat
