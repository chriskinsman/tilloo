#!/bin/bash -e

export DEBIAN_FRONTEND=noninteractive
export DOCKER_HOST_IP=$(route -n | awk '/UG[ \t]/{print $2}')