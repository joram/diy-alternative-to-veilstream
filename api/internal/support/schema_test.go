package support

import (
	"strings"
	"testing"
)

func TestBuildSystemPromptIncludesSchema(t *testing.T) {
	p := buildSystemPrompt()
	for _, want := range []string{
		"invoice_line",
		"track_id",
		"there is no track_name column",
		"there is no artist_name column",
		"join through invoice_line",
		"Do not filter by customer_id",
		"Table names are singular",
		"no i in FROM",
		"JOIN invoice i ON i.invoice_id = il.invoice_id",
		"mentally verify",
	} {
		if !strings.Contains(p, want) {
			t.Errorf("system prompt missing %q", want)
		}
	}
}
