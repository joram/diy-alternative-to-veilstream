package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/cors"

	"github.com/veilstream/chinook-api/internal/auth"
	"github.com/veilstream/chinook-api/internal/config"
	"github.com/veilstream/chinook-api/internal/db"
	"github.com/veilstream/chinook-api/internal/handlers"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	api := &handlers.API{Pool: pool, Sessions: auth.NewStore(), Cfg: cfg}
	handler := cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin, "http://localhost:5173", "http://localhost:23082"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
	})(api.Routes())

	srv := &http.Server{Addr: cfg.Addr, Handler: handler}
	go func() {
		log.Printf("API listening on %s", cfg.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	stop, _ := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	<-stop.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
