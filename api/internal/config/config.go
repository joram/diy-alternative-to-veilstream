package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Addr            string
	DatabaseURL     string
	AdminPassword   string
	CORSOrigin      string
	LLMProvider     string
	OpenAIAPIKey    string
	OpenAIBaseURL   string
	OpenAIModel     string
	LLMTimeoutSec   int
	MaxQueryRows    int
	MaxSQLLength    int
}

func Load() (Config, error) {
	cfg := Config{
		Addr:          env("ADDR", ":8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		AdminPassword: env("ADMIN_PASSWORD", "admin"),
		CORSOrigin:    env("CORS_ORIGIN", "http://localhost:5173"),
		LLMProvider:   env("LLM_PROVIDER", "ollama"),
		OpenAIAPIKey:  env("OPENAI_API_KEY", "ollama"),
		OpenAIBaseURL: trimSlash(env("OPENAI_BASE_URL", "http://ollama:11434/v1")),
		OpenAIModel:   env("OPENAI_MODEL", "qwen2.5:1.5b"),
		LLMTimeoutSec: envInt("LLM_TIMEOUT_MS", 120000) / 1000,
		MaxQueryRows:  envInt("MAX_QUERY_ROWS", 200),
		MaxSQLLength:  envInt("MAX_SQL_LENGTH", 8000),
	}
	if cfg.DatabaseURL == "" {
		return cfg, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.LLMTimeoutSec < 10 {
		cfg.LLMTimeoutSec = 10
	}
	return cfg, nil
}

func (c Config) LLMTimeout() time.Duration {
	return time.Duration(c.LLMTimeoutSec) * time.Second
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func trimSlash(s string) string {
	for len(s) > 0 && s[len(s)-1] == '/' {
		s = s[:len(s)-1]
	}
	return s
}
