#
# ---- Base Node ----
FROM node:lts-alpine AS base
WORKDIR /tilloo
COPY package.json package-lock.json /tilloo/
COPY app/public/package.json app/public/package-lock.json /tilloo/app/public/

#
# ---- Build ----
FROM base AS build
# install required bits for npm
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh && \
    apk add --no-cache --virtual .gyp python make g++
# install node packages
RUN cd /tilloo && npm ci && cd app/public && npm ci && npm run lint

#
# ---- Dependencies ----
FROM base AS dependencies
# install required bits for npm
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh & \
    apk add --no-cache --virtual .gyp python make g++
# install node packages
RUN cd /tilloo && npm ci --only=production && cd app/public && npm ci --only=production

#
# ---- Release ----
FROM base AS release
# repo URL
LABEL org.opencontainers.image.source = "https://github.com/chriskinsman/tilloo"
# copy production node_modules
COPY --from=dependencies /tilloo/node_modules ./node_modules
COPY --from=dependencies /tilloo/app/public/node_modules ./app/public/node_modules
# copy app sources
COPY app /tilloo/app 
COPY bin /tilloo/bin
COPY models /tilloo/models
COPY lib /tilloo/lib
