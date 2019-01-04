#!/usr/bin/env bash
kubectl apply -f namespace.yaml
helm install --namespace tilloo-services stable/mongodb --name mongodb --set mongodbRootPassword=kFGJgJEdrE
sleep 120
kubectl apply -f app.yaml
