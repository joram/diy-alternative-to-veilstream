package httpx

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/veilstream/chinook-api/internal/auth"
)

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

func BearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}

func RequireSession(w http.ResponseWriter, r *http.Request, store *auth.Store, role auth.Role) (*auth.Session, bool) {
	token := BearerToken(r)
	if token == "" {
		Error(w, http.StatusUnauthorized, "unauthorized")
		return nil, false
	}
	sess, ok := store.Get(token)
	if !ok {
		Error(w, http.StatusUnauthorized, "unauthorized")
		return nil, false
	}
	if role != "" && sess.Role != role {
		Error(w, http.StatusForbidden, "forbidden")
		return nil, false
	}
	return sess, true
}
