package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestValidateTokenMissingSecret(t *testing.T) {
	t.Setenv("SUPABASE_JWT_SECRET", "")
	_, err := ValidateToken("token")
	if err != ErrSecretNotConfigured {
		t.Fatalf("expected ErrSecretNotConfigured, got %v", err)
	}
}

func TestValidateTokenSuccess(t *testing.T) {
	secret := "super-secret"
	t.Setenv("SUPABASE_JWT_SECRET", secret)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "user-123",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	})

	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed signing token: %v", err)
	}

	claims, err := ValidateToken(signed)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if claims.Subject != "user-123" {
		t.Fatalf("expected subject user-123, got %s", claims.Subject)
	}
}

func TestValidateTokenInvalid(t *testing.T) {
	secret := "super-secret"
	t.Setenv("SUPABASE_JWT_SECRET", secret)
	t.Setenv("SOMETHING_ELSE", "value")

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "user-123",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	})

	signed, err := token.SignedString([]byte("wrong-secret"))
	if err != nil {
		t.Fatalf("failed signing token: %v", err)
	}

	if _, err := ValidateToken(signed); err == nil {
		t.Fatalf("expected error for invalid signature")
	}
}
