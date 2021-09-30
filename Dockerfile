#
# ---- Base Node ----
FROM node:14-alpine AS base
WORKDIR /tilloo
COPY package.json package-lock.json /tilloo/
COPY app/public/package.json app/public/package-lock.json /tilloo/app/public/
COPY web/client/package.json web/client/package-lock.json /tilloo/web/client/

#
# ---- Dependencies ----
FROM base AS dependencies
# install required bits for npm
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
# install node packages
RUN cd /tilloo && npm ci --only=production && cd app/public && npm ci --only=production && cd /tilloo/web/client && npm ci --only=production

#
# ---- Build ----
FROM base AS build
# install required bits for npm
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh 
COPY web/client /tilloo/web/client
# install node packages
RUN cd /tilloo && npm ci
# build vue app
RUN cd /tilloo/web/client && npm ci && npm run build

#
# ---- Release ----
FROM base AS release
# repo URL
LABEL org.opencontainers.image.source = "https://github.com/chriskinsman/tilloo"
# copy production node_modules
COPY --from=dependencies /tilloo/node_modules ./node_modules
COPY --from=build /tilloo/web/client/dist ./web/client/dist
# copy app sources
COPY bin /tilloo/bin
COPY models /tilloo/models
COPY lib /tilloo/lib
COPY web/server /tilloo/web/server

