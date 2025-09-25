package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/wingsuits-io/game-server/internal/auth"
)

type Handler struct {
	Upgrader websocket.Upgrader
}

type incomingMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type authPayload struct {
	Token string `json:"token"`
}

type authResult struct {
	Type    string `json:"type"`
	Payload struct {
		Success bool   `json:"success"`
		Error   string `json:"error,omitempty"`
	} `json:"payload"`
}

func New() *Handler {
	return &Handler{Upgrader: websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}
			switch origin {
			case "http://localhost:3000", "http://127.0.0.1:3000":
				return true
			default:
				return false
			}
		},
	}}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}
	defer conn.Close()

	var msg incomingMessage
	if err := conn.ReadJSON(&msg); err != nil {
		log.Printf("failed to read message: %v", err)
		return
	}

	if msg.Type != "C2S_AUTH" {
		log.Printf("unexpected first message: %s", msg.Type)
		return
	}

	var payload authPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		log.Printf("invalid auth payload: %v", err)
		return
	}

	if _, err := auth.ValidateToken(payload.Token); err != nil {
		log.Printf("token validation failed: %v", err)
		conn.WriteJSON(authResult{Type: "S2C_AUTH_RESULT", Payload: struct {
			Success bool   `json:"success"`
			Error   string `json:"error,omitempty"`
		}{Success: false, Error: err.Error()}})
		return
	}

	authOK := authResult{Type: "S2C_AUTH_RESULT"}
	authOK.Payload.Success = true
	if err := conn.WriteJSON(authOK); err != nil {
		log.Printf("failed to write auth result: %v", err)
		return
	}

	// Echo any further messages for now to validate pipeline.
	for {
		var raw json.RawMessage
		if err := conn.ReadJSON(&raw); err != nil {
			log.Printf("read loop ended: %v", err)
			return
		}
		if err := conn.WriteJSON(raw); err != nil {
			log.Printf("echo error: %v", err)
			return
		}
	}
}
