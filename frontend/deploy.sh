#!/usr/bin/env bash
docker build . -t frontend-chat
docker run --rm -p 0.0.0.0:5001:80 --name frontend_chat_c -d frontend-chat
