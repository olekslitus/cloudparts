# Cloud Parts Catalog

An interactive field guide to 28 cloud building blocks: queues, streams, pub/sub,
containers, orchestration, serverless, storage types, databases, networking and
operations. Every part has a live animated model, a plain-language explanation,
when to use it and when not to, a real example, the equivalent AWS / Google Cloud /
Azure / open-source products, and a short code sample. It also includes a clickable
system map and six side-by-side comparisons of commonly confused parts.

It is a single self-contained HTML file with no build step and no dependencies
beyond Google Fonts.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Deep links work with a bare hash, e.g. `index.html#queue`, `#stream`, `#vs-messaging`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Standalone page: open it directly in any browser. |
| `artifact.html` | The same page as published to claude.ai. It omits `<!doctype>`, `<html>`, `<head>` and `<body>` because the artifact host wraps it. Edit this one and regenerate `index.html` if you republish. |

Published artifact (private): https://claude.ai/artifact/2Vq8c2MLWonwZQ9a8BQZn7

## Structure of the code

Everything lives in the inline `<script>`:

- `CATS`, `CONCEPTS`, `MIXUPS`: the content. Add a part by appending to `CONCEPTS`.
- `DIAG`: one diagram spec per part (nodes, routing mode, emitters, zones, scripted outages).
- `Sim`: a small SVG simulation engine. Node kinds are `svc`, `pool` (autoscaling
  instances), `queue` and `log` (append-only stream with per-reader offsets); modes
  are `fwd`, `sink`, `reply`, `cache` and `gate`.
- `viewMap`, `viewConcept`, `viewMix`: hash-routed views.
