package query

import (
	"math/big"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
)

func TestFormatCellNumeric(t *testing.T) {
	n := pgtype.Numeric{
		Int:   big.NewInt(3962),
		Exp:   -2,
		Valid: true,
	}
	if got := FormatCell(n); got != "39.62" {
		t.Fatalf("got %q want 39.62", got)
	}
}
