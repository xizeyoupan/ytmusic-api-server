FROM alpine:3.20.2

ARG UID
ARG GID
ARG PORT

ENV UID=${UID:-1010}
ENV GID=${GID:-1010}
ENV PORT=${PORT:-3000}

WORKDIR /app
COPY . /app

RUN apk add --update nano nodejs npm python3 caddy ffmpeg poetry \
    && npm i --omit=dev

RUN addgroup -g ${GID} --system ytmusicapi \
    && adduser -G ytmusicapi --system -D -s /bin/sh -u ${UID} ytmusicapi

RUN chown -R ytmusicapi:ytmusicapi /app
USER ytmusicapi

EXPOSE ${PORT}

CMD poetry install && caddy start --config /app/Caddyfile && node index.js
