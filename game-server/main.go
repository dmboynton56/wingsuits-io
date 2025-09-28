package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"

	game "github.com/wingsuits-io/game-server/game"
	ws "github.com/wingsuits-io/game-server/websocket"
)

func main() {
	// Load .env file
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("warning: could not load .env file: %v", err)
	}

	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("SUPABASE_JWT_SECRET is required")
	}

	verifier := game.NewJWTVerifier(jwtSecret)
	hub := ws.NewHub(256)
	upgrader := websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("upgrade failed: %v", err)
			return
		}
		defer func() {
			hub.Unregister(conn)
			conn.Close()
		}()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("read error: %v", err)
				break
			}

			var envelope struct {
				Type    string          `json:"type"`
				Payload json.RawMessage `json:"payload"`
			}
			if err := json.Unmarshal(msg, &envelope); err != nil {
				log.Printf("invalid payload: %v", err)
				continue
			}

			switch envelope.Type {
			case "C2S_AUTH":
				userID, err := game.HandleAuth(envelope.Payload, verifier, conn)
				if err != nil {
					log.Printf("auth failed: %v", err)
					continue
				}
				hub.Register(userID, conn)

			case "C2S_PLAYER_UPDATE":
				if userID, ok := hub.UserID(conn); ok {
					hub.HandlePlayerUpdate(envelope.Payload, userID)
				}

			case "C2S_START_RACE":
				if userID, ok := hub.UserID(conn); ok {
					hub.HandleStartRace(conn, envelope.Payload, userID)
				}

			default:
				game.SendUnknown(conn, envelope.Type)
			}
		}
	})

	addr := ":8080"
	if val := os.Getenv("WORLD_SERVER_ADDR"); val != "" {
		addr = val
	}

	log.Printf("world server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
