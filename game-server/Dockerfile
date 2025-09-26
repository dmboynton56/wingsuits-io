# Development Dockerfile for Go game server
FROM golang:1.23-alpine AS dev

# Install air for hot reload
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Create air config for hot reload
RUN echo 'root = "."' > .air.toml && \
    echo 'testdata_dir = "testdata"' >> .air.toml && \
    echo 'tmp_dir = "tmp"' >> .air.toml && \
    echo '' >> .air.toml && \
    echo '[build]' >> .air.toml && \
    echo '  args_bin = []' >> .air.toml && \
    echo '  bin = "./tmp/main"' >> .air.toml && \
    echo '  cmd = "go build -o ./tmp/main ./cmd/server"' >> .air.toml && \
    echo '  delay = 1000' >> .air.toml && \
    echo '  exclude_dir = ["assets", "tmp", "vendor", "testdata"]' >> .air.toml && \
    echo '  exclude_file = []' >> .air.toml && \
    echo '  exclude_regex = ["_test.go"]' >> .air.toml && \
    echo '  exclude_unchanged = false' >> .air.toml && \
    echo '  follow_symlink = false' >> .air.toml && \
    echo '  full_bin = ""' >> .air.toml && \
    echo '  include_dir = []' >> .air.toml && \
    echo '  include_ext = ["go", "tpl", "tmpl", "html"]' >> .air.toml && \
    echo '  kill_delay = "0s"' >> .air.toml && \
    echo '  log = "build-errors.log"' >> .air.toml && \
    echo '  send_interrupt = false' >> .air.toml && \
    echo '  stop_on_root = false' >> .air.toml

EXPOSE 8080

# Use air for hot reload in development
CMD ["air"]
