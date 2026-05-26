# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/chinook-api ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget \
  && adduser -D -u 10001 app
USER app
WORKDIR /home/app
COPY --from=build /out/chinook-api /usr/local/bin/chinook-api
EXPOSE 8080
ENV ADDR=:8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
ENTRYPOINT ["/usr/local/bin/chinook-api"]
