package game

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

type Verifier struct {
	secret []byte
}

func NewJWTVerifier(secret string) *Verifier {
	return &Verifier{secret: []byte(secret)}
}

func (v *Verifier) Parse(tokenStr string) (string, error) {
	if len(v.secret) == 0 {
		return "", errors.New("jwt secret missing")
	}
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Header["alg"])
		}
		return v.secret, nil
	})
	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token: %w", err)
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}
	userID, _ := claims["sub"].(string)
	if userID == "" {
		return "", errors.New("missing user id")
	}
	return userID, nil
}

func HandleAuth(payload json.RawMessage, verifier *Verifier, conn *websocket.Conn) (string, error) {
	var request struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		sendAuthResult(conn, false, "invalid payload", nil)
		return "", err
	}

	userID, err := verifier.Parse(request.Token)
	if err != nil {
		sendAuthResult(conn, false, err.Error(), nil)
		return "", err
	}

	spawn := map[string]interface{}{
		"position": map[string]float64{"x": 0, "y": 10, "z": 0},
		"rotation": map[string]float64{"x": 0, "y": 0, "z": 0, "w": 1},
	}
	sendAuthResult(conn, true, "", spawn)

	seed := map[string]interface{}{
		"type": "S2C_WORLD_SEED",
		"payload": map[string]interface{}{
			"seed":      12345,
			"chunkSize": 256,
			"lod":       map[string]int{"near": 257, "mid": 129, "far": 65},
		},
	}
	_ = conn.WriteJSON(seed)
	return userID, nil
}

func sendAuthResult(conn *websocket.Conn, success bool, errMsg string, spawn map[string]interface{}) {
	payload := map[string]interface{}{
		"success": success,
	}
	if errMsg != "" {
		payload["error"] = errMsg
	}
	if spawn != nil {
		payload["spawnPoint"] = spawn
	}
	_ = conn.WriteJSON(map[string]interface{}{
		"type":    "S2C_AUTH_RESULT",
		"payload": payload,
	})
}

func SendUnknown(conn *websocket.Conn, msgType string) {
	_ = conn.WriteJSON(map[string]interface{}{
		"type": "S2C_ERROR",
		"payload": map[string]interface{}{
			"message": fmt.Sprintf("unhandled message type: %s", msgType),
		},
	})
}
