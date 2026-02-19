FROM mcr.microsoft.com/devcontainers/base:alpine

RUN apk add --no-cache nodejs npm gcompat git && npm install -g corepack && npm cache clean --force && apk del npm

ENTRYPOINT [ "/bin/bash" ]
