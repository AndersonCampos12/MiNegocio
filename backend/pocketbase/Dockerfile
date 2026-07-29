FROM alpine:3.21

ARG POCKETBASE_VERSION=0.39.9

RUN apk add --no-cache ca-certificates unzip wget \
    && wget -O /tmp/pocketbase.zip \
       "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pocketbase.zip -d /pb \
    && rm /tmp/pocketbase.zip

WORKDIR /pb

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
