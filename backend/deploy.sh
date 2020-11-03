#!/usr/bin/env bash
docker build . -t backend-chat
docker run -e TZ=Asia/Makassar -p 0.0.0.0:5000:8000 -v $(pwd):/app --name backend_chat_c -d backend-chat
