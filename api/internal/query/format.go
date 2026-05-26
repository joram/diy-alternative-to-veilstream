package query

import (
	"fmt"
	"math"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// FormatCell renders a query result cell for display or JSON.
func FormatCell(v any) string {
	n, ok := NormalizeValue(v)
	if !ok || n == nil {
		return ""
	}
	switch x := n.(type) {
	case string:
		return x
	case float64:
		return formatMoney(x)
	case int64:
		return fmt.Sprintf("%d", x)
	case bool:
		if x {
			return "true"
		}
		return "false"
	case time.Time:
		return x.Format("2006-01-02")
	default:
		return fmt.Sprint(x)
	}
}

// NormalizeValue converts pgx driver types to JSON-friendly values.
func NormalizeValue(v any) (any, bool) {
	if v == nil {
		return nil, true
	}
	switch x := v.(type) {
	case string:
		return x, true
	case []byte:
		return string(x), true
	case float64:
		return x, true
	case float32:
		return float64(x), true
	case int64:
		return x, true
	case int32:
		return int64(x), true
	case int:
		return int64(x), true
	case bool:
		return x, true
	case time.Time:
		return x, true
	case pgtype.Numeric:
		return numericToFloat(x)
	case pgtype.Float8:
		if !x.Valid {
			return nil, true
		}
		return x.Float64, true
	case pgtype.Int8:
		if !x.Valid {
			return nil, true
		}
		return x.Int64, true
	case pgtype.Int4:
		if !x.Valid {
			return nil, true
		}
		return int64(x.Int32), true
	case pgtype.Timestamptz:
		if !x.Valid {
			return nil, true
		}
		return x.Time, true
	case pgtype.Timestamp:
		if !x.Valid {
			return nil, true
		}
		return x.Time, true
	case pgtype.Date:
		if !x.Valid {
			return nil, true
		}
		return x.Time, true
	default:
		return fmt.Sprint(x), true
	}
}

func numericToFloat(n pgtype.Numeric) (any, bool) {
	if !n.Valid {
		return nil, true
	}
	if n.NaN {
		return nil, true
	}
	if f8, err := n.Float64Value(); err == nil && f8.Valid {
		return f8.Float64, true
	}
	if n.Int != nil {
		rat := new(big.Rat).SetInt(n.Int)
		if n.Exp != 0 {
			ten := big.NewInt(10)
			expAbs := n.Exp
			if expAbs < 0 {
				expAbs = -expAbs
			}
			scale := new(big.Int).Exp(ten, big.NewInt(int64(expAbs)), nil)
			if n.Exp < 0 {
				rat.Quo(rat, new(big.Rat).SetInt(scale))
			} else {
				rat.Mul(rat, new(big.Rat).SetInt(scale))
			}
		}
		f, _ := rat.Float64()
		return f, true
	}
	return nil, true
}

func formatMoney(f float64) string {
	if math.IsNaN(f) || math.IsInf(f, 0) {
		return ""
	}
	if f == math.Trunc(f) && math.Abs(f) < 1e12 {
		return fmt.Sprintf("%.2f", f)
	}
	return fmt.Sprintf("%.2f", f)
}
