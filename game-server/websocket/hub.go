package websocket

import (
	"encoding/json"
	"log"
	"math"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type PlayerState struct {
	Position [3]float64 `json:"position"`
	Rotation [4]float64 `json:"rotation"`
	Velocity [3]float64 `json:"velocity,omitempty"`
	Mode     string     `json:"mode"`
}

type Hub struct {
	mu           sync.RWMutex
	connToUser   map[*websocket.Conn]string
	playerStates map[string]PlayerState
	chunkSize    float64
}

func NewHub(chunkSize float64) *Hub {
	if chunkSize <= 0 {
		chunkSize = 256
	}
	return &Hub{
		connToUser:   make(map[*websocket.Conn]string),
		playerStates: make(map[string]PlayerState),
		chunkSize:    chunkSize,
	}
}

func (h *Hub) Register(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.connToUser[conn] = userID
}

func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if userID, ok := h.connToUser[conn]; ok {
		delete(h.connToUser, conn)
		delete(h.playerStates, userID)
	}
}

func (h *Hub) UserID(conn *websocket.Conn) (string, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	uid, ok := h.connToUser[conn]
	return uid, ok
}

func (h *Hub) HandlePlayerUpdate(payload json.RawMessage, userID string) {
	var update struct {
		Type    string      `json:"type"`
		Payload PlayerState `json:"payload"`
	}
	if err := json.Unmarshal(payload, &update); err != nil {
		log.Printf("invalid player update: %v", err)
		return
	}
	if update.Type != "C2S_PLAYER_UPDATE" {
		return
	}

	h.mu.Lock()
	h.playerStates[userID] = update.Payload
	h.mu.Unlock()

	cx := int(update.Payload.Position[0] / h.chunkSize)
	cz := int(update.Payload.Position[2] / h.chunkSize)

	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn, otherID := range h.connToUser {
		if otherID == userID {
			continue
		}
		state := h.playerStates[otherID]
		ocx := int(state.Position[0] / h.chunkSize)
		ocz := int(state.Position[2] / h.chunkSize)
		if math.Abs(float64(ocx-cx)) <= 1 && math.Abs(float64(ocz-cz)) <= 1 {
			packet := map[string]interface{}{
				"type": "S2C_WORLD_STATE_UPDATE",
				"payload": map[string]interface{}{
					"entities":  []PlayerState{update.Payload},
					"timestamp": time.Now().UnixMilli(),
				},
			}
			_ = conn.WriteJSON(packet)
		}
	}
}

func (h *Hub) HandleStartRace(conn *websocket.Conn, payload json.RawMessage, userID string) {
	var message struct {
		Type    string `json:"type"`
		Payload struct {
			RouteID string `json:"routeId"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(payload, &message); err != nil {
		log.Printf("invalid start race payload: %v", err)
		return
	}
	if message.Type != "C2S_START_RACE" {
		return
	}

	log.Printf("User %s starting race %s", userID, message.Payload.RouteID)

	event := map[string]interface{}{
		"type": "S2C_RACE_EVENT",
		"payload": map[string]interface{}{
			"event":   "countdown",
			"routeId": message.Payload.RouteID,
			"data":    map[string]int{"countdown": 3},
		},
	}
	_ = conn.WriteJSON(event)
}
