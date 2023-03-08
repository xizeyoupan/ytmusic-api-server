FROM alpine:3.17

ARG UID
ARG GID
ARG PORT

ENV UID=${UID:-1010}
ENV GID=${GID:-1010}
ENV PORT=${PORT:-3000}

WORKDIR /app
COPY . /app

RUN apk add --update nano nodejs npm python3 py3-pip caddy \
    && pip3 install -r requirements.txt \
    && npm i --omit=dev && cd whatis-core && npm i --omit=dev && cd .. && mv whatis-core node_modules/

RUN addgroup -g ${GID} --system ytmusicapi \
    && adduser -G ytmusicapi --system -D -s /bin/sh -u ${UID} ytmusicapi

RUN chown -R ytmusicapi:ytmusicapi /app
USER ytmusicapi

EXPOSE ${PORT}

CMD caddy start --config /app/Caddyfile && node index.js
