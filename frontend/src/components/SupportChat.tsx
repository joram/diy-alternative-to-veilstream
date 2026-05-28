import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Fab,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { client, QueryResult, QuerySource, SupportChatMessage } from "@/api/client";
import { formatCell } from "@/utils/formatCell";

function isDirectSQL(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith("select") || t.startsWith("with");
}

function queryDebugLabel(source: QuerySource): string {
  switch (source) {
    case "llm":
      return "LLM generated this query to run:";
    case "canonical":
      return "Matched template — about to run:";
    case "direct":
      return "About to run:";
  }
}

const debugBubbleSx = {
  borderRadius: 1,
  bgcolor: "rgba(26, 35, 126, 0.05)",
  border: 1,
  borderColor: "rgba(26, 35, 126, 0.12)",
} as const;

function formatQueryDebug(
  sql: string,
  source: QuerySource,
  opts?: { error?: string; scopedSql?: string },
): string {
  const lines = [queryDebugLabel(source)];
  if (sql.trim()) {
    lines.push("", sql.trim());
  }
  if (opts?.scopedSql?.trim()) {
    lines.push("", "Scoped SQL:", opts.scopedSql.trim());
  }
  if (opts?.error?.trim()) {
    lines.push("", `Rejected: ${opts.error.trim()}`);
  }
  return lines.join("\n");
}

const CUSTOMER_SUGGESTIONS = [
  "How much have I spent in total?",
  "What were my most recent invoices?",
  "What albums have I purchased?",
];

const SUPPORT_SUGGESTIONS = [
  "SELECT invoice_id, total FROM invoice ORDER BY invoice_date DESC LIMIT 5",
  "How much has this customer spent in total?",
  "SELECT t.name AS track, al.title AS album FROM invoice_line il JOIN track t ON t.track_id = il.track_id JOIN album al ON al.album_id = t.album_id LIMIT 10",
];

export type SupportChatVariant = "customer" | "support";

const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 560;

export default function SupportChat({ variant = "customer" }: { variant?: SupportChatVariant }) {
  const isSupport = variant === "support";
  const title = isSupport ? "Support assistant" : "Help assistant";
  const suggestions = isSupport ? SUPPORT_SUGGESTIONS : CUSTOMER_SUGGESTIONS;
  const emptyHint = isSupport
    ? "Ask a question or paste a SELECT query. Results use masked data scoped to this customer."
    : "Ask about your orders, invoices, or purchases. Answers use your account data only.";
  const placeholder = isSupport ? "Ask or paste SELECT …" : "Ask a question…";

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [lastQuery, setLastQuery] = useState<QueryResult | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQueryDebug, setPendingQueryDebug] = useState<{
    label: string;
    sql: string;
    source: QuerySource;
  } | null>(null);
  const [llmEnabled, setLlmEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLarge = expanded;

  useEffect(() => {
    client
      .supportStatus()
      .then((s) => {
        setLlmEnabled(s.llmEnabled);
        setProvider(s.provider);
        setModel(s.model);
      })
      .catch(() => setLlmEnabled(false));
  }, []);

  useEffect(() => {
    if (open || expanded) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, lastQuery, pendingQueryDebug, open, expanded]);

  const closePanel = () => {
    setOpen(false);
    setExpanded(false);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: SupportChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setError(null);
    setLastQuery(null);
    if (isDirectSQL(trimmed)) {
      setPendingQueryDebug({
        label: queryDebugLabel("direct"),
        sql: trimmed,
        source: "direct",
      });
    } else {
      setPendingQueryDebug({
        label: "LLM is generating a SQL query to run…",
        sql: "",
        source: "llm",
      });
    }

    try {
      const res = await client.supportChat(trimmed, messages);
      const assistantMessages: SupportChatMessage[] = [];
      const sqlForDebug =
        res.attemptedSql?.trim() || (isDirectSQL(trimmed) ? trimmed : "");
      const ranQuery = res.toolsUsed?.includes("scoped_query") ?? false;
      if (sqlForDebug || ranQuery || res.error) {
        assistantMessages.push({
          role: "assistant",
          content: formatQueryDebug(sqlForDebug, res.querySource ?? "llm", {
            error: res.error,
            scopedSql: res.scopedSql ?? res.queryResult?.scoped_sql,
          }),
          debug: true,
        });
      }
      assistantMessages.push({ role: "assistant", content: res.reply });
      setMessages([...nextHistory, ...assistantMessages]);
      if (res.queryResult) setLastQuery(res.queryResult);
      if (res.llmEnabled !== undefined) setLlmEnabled(res.llmEnabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
      setMessages(messages);
    } finally {
      setLoading(false);
      setPendingQueryDebug(null);
    }
  };

  const llmLabel =
    llmEnabled === null
      ? "…"
      : llmEnabled
        ? provider === "ollama"
          ? `Ollama · ${model}`
          : provider === "anthropic"
            ? `Claude · ${model}`
            : provider === "openai"
              ? `OpenAI · ${model}`
              : `LLM · ${model || "on"}`
        : "SQL only";

  const panel = (
    <Paper
      elevation={isLarge ? 24 : 8}
      sx={{
        width: isLarge ? "100%" : PANEL_WIDTH,
        maxWidth: isLarge ? 960 : "calc(100vw - 48px)",
        height: isLarge ? "100%" : PANEL_HEIGHT,
        maxHeight: isLarge ? "calc(100vh - 48px)" : "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: isLarge ? 3 : 2,
          py: isLarge ? 1.75 : 1.25,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          flexShrink: 0,
        }}
      >
        <SmartToyIcon sx={{ fontSize: isLarge ? 26 : 20 }} />
        <Typography variant={isLarge ? "h6" : "subtitle1"} fontWeight={600} sx={{ flex: 1 }}>
          {title}
        </Typography>
        <Chip
          size="small"
          label={llmLabel}
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "inherit",
            borderColor: "rgba(255,255,255,0.35)",
          }}
          variant="outlined"
        />
        {isLarge ? (
          <IconButton
            size="small"
            onClick={() => setExpanded(false)}
            aria-label="Collapse to compact chat"
            sx={{ color: "inherit" }}
          >
            <CloseFullscreenIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={() => setExpanded(true)}
            aria-label="Expand chat"
            sx={{ color: "inherit" }}
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          size="small"
          onClick={closePanel}
          aria-label={`Close ${title}`}
          sx={{ color: "inherit" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          p: isLarge ? 3 : 1.5,
        }}
      >
        <Paper
          ref={scrollRef}
          variant="outlined"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            p: isLarge ? 2 : 1.5,
            mb: 1.5,
            bgcolor: "grey.50",
          }}
        >
          {messages.length === 0 && (
            <Typography color="text.secondary" variant={isLarge ? "body1" : "body2"}>
              {emptyHint}
            </Typography>
          )}
          <Stack spacing={isLarge ? 2 : 1.5}>
            {messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: m.debug ? "100%" : isLarge ? "80%" : "92%",
                  width: m.debug ? "100%" : undefined,
                }}
              >
                {m.debug ? (
                  <Box
                    sx={{
                      ...debugBubbleSx,
                      px: isLarge ? 2 : 1.5,
                      py: isLarge ? 1.5 : 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5, letterSpacing: "0.06em" }}
                    >
                      DEBUG
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        m: 0,
                        fontFamily: "monospace",
                        fontSize: isLarge ? "0.85rem" : "0.75rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.content}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      px: isLarge ? 2 : 1.5,
                      py: isLarge ? 1.5 : 1,
                      borderRadius: 2,
                      bgcolor: m.role === "user" ? "primary.main" : "background.paper",
                      color: m.role === "user" ? "primary.contrastText" : "text.primary",
                      border: m.role === "assistant" ? 1 : 0,
                      borderColor: "divider",
                      whiteSpace: "pre-wrap",
                      fontSize: isLarge ? "1rem" : "0.875rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {m.content}
                  </Box>
                )}
              </Box>
            ))}
            {loading && pendingQueryDebug && (
              <Box
                sx={{
                  ...debugBubbleSx,
                  width: "100%",
                  px: isLarge ? 2 : 1.5,
                  py: isLarge ? 1.5 : 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: pendingQueryDebug.sql ? 0.75 : 0 }}>
                  <CircularProgress size={isLarge ? 18 : 14} sx={{ color: "text.secondary" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary" letterSpacing="0.06em">
                    DEBUG
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.primary" sx={{ mb: pendingQueryDebug.sql ? 0.5 : 0 }}>
                  {pendingQueryDebug.label}
                </Typography>
                {pendingQueryDebug.sql && (
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      m: 0,
                      fontFamily: "monospace",
                      fontSize: isLarge ? "0.85rem" : "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {pendingQueryDebug.sql}
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </Paper>

        {lastQuery && lastQuery.row_count > 0 && (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ mb: 1.5, maxHeight: isLarge ? 240 : 120 }}
          >
            <Table size={isLarge ? "medium" : "small"} stickyHeader>
              <TableHead>
                <TableRow>
                  {lastQuery.columns.map((c) => (
                    <TableCell key={c}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lastQuery.rows.map((row, ri) => (
                  <TableRow key={ri}>
                    {row.map((cell, ci) => (
                      <TableCell key={ci}>
                        {formatCell(cell, lastQuery.columns[ci])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {isSupport && lastQuery?.scoped_sql && (
          <Typography
            variant="caption"
            color="text.secondary"
            component="pre"
            sx={{
              mb: 1.5,
              p: 1.5,
              bgcolor: "grey.100",
              borderRadius: 1,
              overflow: "auto",
              maxHeight: isLarge ? 100 : 48,
              fontSize: "0.75rem",
            }}
          >
            {lastQuery.scoped_sql}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
          {suggestions.map((s) => (
            <Chip
              key={s}
              label={isLarge ? s : s.length > 36 ? s.slice(0, 36) + "…" : s}
              size="small"
              onClick={() => void send(s)}
              disabled={loading}
              variant="outlined"
              sx={
                isLarge
                  ? {
                      maxWidth: "100%",
                      height: "auto",
                      "& .MuiChip-label": { whiteSpace: "normal", py: 0.75 },
                    }
                  : undefined
              }
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            disabled={loading}
            multiline
            maxRows={isLarge ? 4 : 3}
            sx={{
              "& textarea": {
                fontFamily: isSupport ? "monospace" : "inherit",
                fontSize: isLarge ? "0.95rem" : "0.8rem",
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => void send(input)}
            disabled={loading || !input.trim()}
            sx={{ minWidth: 48, px: 1.5 }}
            aria-label="Send"
          >
            <SendIcon />
          </Button>
        </Stack>
      </Box>
    </Paper>
  );

  return (
    <>
      {expanded && (
        <Box
          role="dialog"
          aria-modal
          aria-label={title}
          onClick={() => setExpanded(false)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            bgcolor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: "100%", maxWidth: 960, height: "100%" }}>
            {panel}
          </Box>
        </Box>
      )}

      {!expanded && (
        <Collapse in={open} sx={{ position: "fixed", bottom: 88, right: 24, zIndex: 1300 }}>
          {panel}
        </Collapse>
      )}

      {!expanded && (
        <Zoom in>
          <Fab
            color="primary"
            aria-label={open ? `Close ${title}` : `Open ${title}`}
            onClick={() => setOpen((v) => !v)}
            sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1300 }}
          >
            {open ? <CloseIcon /> : <SmartToyIcon />}
          </Fab>
        </Zoom>
      )}
    </>
  );
}
