#!/usr/bin/env bash
kubectl apply -f namespace.yaml
helm install mongodb --set mongodbRootPassword=kFGJgJEdrE --namespace tilloo-services stable/mongodb
sleep 120
kubectl apply -f app.yaml
