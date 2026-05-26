package handlers

import (
	"log"
	"strings"
)

func logSQL(handler string, sql string, args ...any) {
	log.Printf("[sql] handler=%s sql=%q args=%v", handler, strings.Join(strings.Fields(sql), " "), args)
}
