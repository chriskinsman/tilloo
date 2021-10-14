#!/usr/bin/env bash

# Used to connect rabbitmq and mongodb to local dev machine for debugging
kubectl port-forward -n tilloo-services service/rabbitmq-service 5672 &
kubectl port-forward -n tilloo-services service/mongodb-service 27017 &
kubectl port-forward -n tilloo-services service/scheduler-service 8081:80 &

