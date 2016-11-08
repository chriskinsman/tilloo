#!/usr/bin/env bash

pushd ../nodeimage
docker build -t tilloo/nodeimage -f nodeimage.docker .
popd
