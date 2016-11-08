#!/usr/bin/env bash

./build-nodeimage.sh
./build-tilloo-base.sh
docker build -t tilloo/cli -f ../cli.docker ..
docker build -t tilloo/scheduler -f ../scheduler.docker ..
docker build -t tilloo/webserver -f ../webserver.docker ..
docker build -t tilloo/worker -f ../worker.docker ..