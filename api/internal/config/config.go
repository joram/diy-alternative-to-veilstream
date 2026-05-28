package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/veilstream/chinook-api/internal/support"
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
	AnthropicAPIKey string
	AnthropicModel  string
	LLMTimeoutSec   int
	MaxQueryRows    int
	MaxSQLLength    int
}

func Load() (Config, error) {
	provider := strings.ToLower(env("LLM_PROVIDER", "openai"))
	cfg := Config{
		Addr:          env("ADDR", ":8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		AdminPassword: env("ADMIN_PASSWORD", "admin"),
		CORSOrigin:    env("CORS_ORIGIN", "http://localhost:5173"),
		LLMProvider:   provider,
		LLMTimeoutSec: envInt("LLM_TIMEOUT_MS", 120000) / 1000,
		MaxQueryRows:  envInt("MAX_QUERY_ROWS", 200),
		MaxSQLLength:  envInt("MAX_SQL_LENGTH", 8000),
	}
	switch provider {
	case "ollama":
		cfg.OpenAIAPIKey = env("OPENAI_API_KEY", "ollama")
		cfg.OpenAIBaseURL = trimSlash(env("OPENAI_BASE_URL", "http://ollama:11434/v1"))
		cfg.OpenAIModel = env("OPENAI_MODEL", "qwen2.5:1.5b")
	case "anthropic":
		cfg.AnthropicAPIKey = env("ANTHROPIC_API_KEY", os.Getenv("OPENAI_API_KEY"))
		cfg.AnthropicModel = env("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
	default:
		cfg.OpenAIAPIKey = os.Getenv("OPENAI_API_KEY")
		cfg.OpenAIBaseURL = trimSlash(env("OPENAI_BASE_URL", "https://api.openai.com/v1"))
		cfg.OpenAIModel = env("OPENAI_MODEL", "gpt-4o-mini")
	}
	if cfg.DatabaseURL == "" {
		return cfg, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.LLMTimeoutSec < 10 {
		cfg.LLMTimeoutSec = 10
	}
	return cfg, nil
}

func (c Config) LLMEnabled() bool {
	switch strings.ToLower(c.LLMProvider) {
	case "ollama":
		return true
	case "anthropic":
		return c.AnthropicAPIKey != "" && c.AnthropicAPIKey != "ollama"
	default:
		return c.OpenAIAPIKey != "" && c.OpenAIAPIKey != "ollama"
	}
}

func (c Config) LLMModel() string {
	if strings.ToLower(c.LLMProvider) == "anthropic" {
		return c.AnthropicModel
	}
	return c.OpenAIModel
}

func (c Config) LLMConfig() support.Config {
	switch strings.ToLower(c.LLMProvider) {
	case "anthropic":
		return support.Config{
			Provider: "anthropic",
			APIKey:   c.AnthropicAPIKey,
			Model:    c.AnthropicModel,
			Timeout:  c.LLMTimeout(),
		}
	case "ollama":
		return support.Config{
			Provider: "ollama",
			APIKey:   c.OpenAIAPIKey,
			BaseURL:  c.OpenAIBaseURL,
			Model:    c.OpenAIModel,
			Timeout:  c.LLMTimeout(),
		}
	default:
		return support.Config{
			Provider: "openai",
			APIKey:   c.OpenAIAPIKey,
			BaseURL:  c.OpenAIBaseURL,
			Model:    c.OpenAIModel,
			Timeout:  c.LLMTimeout(),
		}
	}
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
