package websocket

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

func TestAuthSuccess(t *testing.T) {
	h := New()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)

	u := "ws" + srv.URL[len("http"):] + "/"
	conn, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	secret := "secret"
	t.Setenv("SUPABASE_JWT_SECRET", secret)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "user-123",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	})
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed signing: %v", err)
	}

	authMsg := map[string]any{
		"type":    "C2S_AUTH",
		"payload": map[string]string{"token": signed},
	}
	if err := conn.WriteJSON(authMsg); err != nil {
		t.Fatalf("write auth failed: %v", err)
	}

	var resp struct {
		Type    string `json:"type"`
		Payload struct {
			Success bool `json:"success"`
		} `json:"payload"`
	}
	if err := conn.ReadJSON(&resp); err != nil {
		t.Fatalf("read auth result failed: %v", err)
	}

	if resp.Type != "S2C_AUTH_RESULT" || !resp.Payload.Success {
		t.Fatalf("unexpected auth response: %+v", resp)
	}
}

func TestAuthFailure(t *testing.T) {
	h := New()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)

	u := "ws" + srv.URL[len("http"):] + "/"
	conn, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	t.Setenv("SUPABASE_JWT_SECRET", "secret")

	authMsg := map[string]any{
		"type":    "C2S_AUTH",
		"payload": map[string]string{"token": "bad"},
	}
	if err := conn.WriteJSON(authMsg); err != nil {
		t.Fatalf("write auth failed: %v", err)
	}

	var resp map[string]any
	if err := conn.ReadJSON(&resp); err != nil {
		t.Fatalf("read auth result failed: %v", err)
	}

	payload := resp["payload"].(map[string]any)
	if payload["success"].(bool) {
		t.Fatalf("expected failure response")
	}
}

func TestUnexpectedFirstMessage(t *testing.T) {
	h := New()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)

	u := "ws" + srv.URL[len("http"):] + "/"
	conn, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	conn.WriteJSON(map[string]string{"type": "C2S_PLAYER_UPDATE"})

	// Expect the connection to be closed soon.
	var raw json.RawMessage
	if err := conn.ReadJSON(&raw); err == nil {
		t.Fatalf("expected close")
	}
}
