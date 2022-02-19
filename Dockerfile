#
# ---- Base Node ----
FROM node:16-alpine AS base
WORKDIR /tilloo
COPY package.json package-lock.json /tilloo/

# Base with tools
FROM base as tools
# install required bits for npm
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

#
# ---- Dependencies ----
FROM tools AS dependencies
# install node packages
RUN cd /tilloo && \
    npm ci --only=production --ignore-scripts

#
# ---- Release ----
FROM base AS release
# repo URL
LABEL org.opencontainers.image.source = "https://github.com/chriskinsman/tilloo"
# copy production node_modules
COPY --from=dependencies /tilloo/node_modules ./node_modules
# copy app sources
COPY bin /tilloo/bin
COPY models /tilloo/models
COPY lib /tilloo/lib
COPY web/server /tilloo/web/server
COPY web/client/dist ./web/client/dist

