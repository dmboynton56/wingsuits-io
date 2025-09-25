package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	ws "github.com/wingsuits-io/game-server/internal/websocket"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("warning: could not load .env file: %v", err)
	}

	addr := ":8080"
	if fromEnv := os.Getenv("WORLD_SERVER_ADDR"); fromEnv != "" {
		addr = fromEnv
	}

	http.Handle("/ws", ws.New())
	log.Printf("world server listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
