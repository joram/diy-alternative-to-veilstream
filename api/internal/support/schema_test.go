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
		"join through invoice_line",
		"Do not filter by customer_id",
	} {
		if !strings.Contains(p, want) {
			t.Errorf("system prompt missing %q", want)
		}
	}
}
