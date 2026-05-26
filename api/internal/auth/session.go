package auth

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

type Role string

const (
	RoleCustomer Role = "customer"
	RoleAdmin    Role = "admin"
)

// ViewMode distinguishes customer self-service from support-agent tooling.
type ViewMode string

const (
	ViewAsCustomer ViewMode = "customer"
	ViewAsSupport  ViewMode = "support"
)

type Session struct {
	Role       Role
	CustomerID int
	ViewMode   ViewMode
	CreatedAt  time.Time
}

func (v ViewMode) Valid() bool {
	return v == ViewAsCustomer || v == ViewAsSupport
}

type Store struct {
	mu   sync.RWMutex
	byID map[string]*Session
}

func NewStore() *Store {
	return &Store{byID: make(map[string]*Session)}
}

func (s *Store) CreateCustomer(customerID int, viewMode ViewMode) string {
	if !viewMode.Valid() {
		viewMode = ViewAsCustomer
	}
	return s.save(&Session{
		Role: RoleCustomer, CustomerID: customerID, ViewMode: viewMode, CreatedAt: time.Now().UTC(),
	})
}

func (s *Store) CreateAdmin() string {
	return s.save(&Session{Role: RoleAdmin, CreatedAt: time.Now().UTC()})
}

func (s *Store) save(sess *Session) string {
	token := newToken()
	s.mu.Lock()
	s.byID[token] = sess
	s.mu.Unlock()
	return token
}

func (s *Store) Get(token string) (*Session, bool) {
	s.mu.RLock()
	sess, ok := s.byID[token]
	s.mu.RUnlock()
	return sess, ok
}

func (s *Store) Delete(token string) {
	s.mu.Lock()
	delete(s.byID, token)
	s.mu.Unlock()
}

func newToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
