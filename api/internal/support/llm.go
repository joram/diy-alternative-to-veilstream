package support

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var sqlFence = regexp.MustCompile(`(?is)` + "```" + `(?:sql)?\s*([\s\S]*?)` + "```")

type Config struct {
	Provider string
	APIKey   string
	BaseURL  string
	Model    string
	Timeout  time.Duration
}

func ExtractSQL(text string) string {
	if m := sqlFence.FindStringSubmatch(text); len(m) > 1 {
		return strings.TrimSpace(m[1])
	}
	trimmed := strings.TrimSpace(text)
	lower := strings.ToLower(trimmed)
	if strings.HasPrefix(lower, "select") || strings.HasPrefix(lower, "with") {
		return strings.TrimSuffix(trimmed, ";")
	}
	return ""
}

func IsDirectSQL(message string) bool {
	t := strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(message), ";"))
	lower := strings.ToLower(t)
	return strings.HasPrefix(lower, "select") || strings.HasPrefix(lower, "with")
}

func Chat(ctx context.Context, cfg Config, history [][2]string, userMessage string) (string, error) {
	msgs := []map[string]string{{"role": "system", "content": buildSystemPrompt()}}
	for _, h := range history {
		msgs = append(msgs, map[string]string{"role": h[0], "content": h[1]})
	}
	msgs = append(msgs, map[string]string{"role": "user", "content": userMessage})

	body, _ := json.Marshal(map[string]any{
		"model":    cfg.Model,
		"messages": msgs,
		"stream":   false,
	})

	req, err := http.NewRequestWithContext(
		ctx, http.MethodPost, cfg.BaseURL+"/chat/completions", bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: cfg.Timeout}
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return "", fmt.Errorf("llm HTTP %d: %s", res.StatusCode, string(raw))
	}
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("empty llm response")
	}
	return parsed.Choices[0].Message.Content, nil
}
