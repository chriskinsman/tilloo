#!/usr/bin/env bash
# Requires docker experimental CLI to be enabled for manifest commands

docker manifest push --purge tilloo/k8s:latest
docker manifest create tilloo/k8s:latest tilloo/k8s:latest-amd64 tilloo/k8s:latest-arm32v6
docker manifest annotate tilloo/k8s:latest tilloo/k8s:latest-arm32v6 --os linux --arch arm
docker manifest push tilloo/k8s:latest
