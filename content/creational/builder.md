---
title: "Builder"
order: 4
summary: "Separate the construction of a complex object from its representation, so the same construction process can build different configurations."
tags: ["Creational", "GoF", "HTTP requests"]
useWhen: "A constructor would need many optional parameters, or an object must be built in a specific multi-step sequence."
---

## What problem it solves

An `HttpRequest` object can have a method, URL, headers, query parameters, a body, a timeout, and retry settings —
most of them optional. A single constructor covering every combination either needs a huge parameter list (most of
it unused most of the time) or a dozen overloaded constructors. Builder lets you assemble the object step-by-step,
setting only what you need, and produce an immutable result at the end.

## When to use

- An object has many optional fields/parameters and most callers only set a handful of them.
- Construction has a natural step-by-step feel, and you want the code that builds the object to read like a
  description of it (`request.method("POST").header(...).body(...)`).
- You want the constructed object to be immutable once built, but still flexible to assemble.

## When not to use

- If an object has only two or three fields, all required, a plain constructor is clearer than a builder.
- Don't use Builder just to avoid named parameters in languages that already support them well (e.g. Python keyword
  arguments) unless the construction process itself has real, multi-step complexity or validation.

## Class / object design

```
HttpRequest (immutable product)
      ▲
      │ constructed by
HttpRequestBuilder
  + method(m)      ─┐
  + url(u)          │ each returns `self`/`this`, enabling chaining
  + header(k, v)     │
  + query_param(k,v) │
  + body(b)          │
  + timeout(seconds)─┘
  + build() -> HttpRequest    ◀── validates and produces the final, immutable object
```

## Step-by-step explanation

1. Model the finished product (`HttpRequest`) as immutable — fields set once, never mutated after construction.
2. Give the builder one method per configurable piece, each returning the builder itself so calls can chain.
3. Track state on the builder (mutable) while the object under construction stays conceptually "not yet real."
4. `build()` validates the accumulated state (e.g. "method and url are required") and returns the finished, immutable
   product.

## Python example

```python
from dataclasses import dataclass, field

@dataclass(frozen=True)
class HttpRequest:
    """Immutable once built."""
    method: str
    url: str
    headers: dict = field(default_factory=dict)
    query_params: dict = field(default_factory=dict)
    body: str | None = None
    timeout_seconds: int = 30

class HttpRequestBuilder:
    def __init__(self):
        self._method = "GET"
        self._url = None
        self._headers: dict = {}
        self._query_params: dict = {}
        self._body = None
        self._timeout_seconds = 30

    def method(self, method: str) -> "HttpRequestBuilder":
        self._method = method
        return self

    def url(self, url: str) -> "HttpRequestBuilder":
        self._url = url
        return self

    def header(self, key: str, value: str) -> "HttpRequestBuilder":
        self._headers[key] = value
        return self

    def query_param(self, key: str, value: str) -> "HttpRequestBuilder":
        self._query_params[key] = value
        return self

    def body(self, body: str) -> "HttpRequestBuilder":
        self._body = body
        return self

    def timeout(self, seconds: int) -> "HttpRequestBuilder":
        self._timeout_seconds = seconds
        return self

    def build(self) -> HttpRequest:
        if not self._url:
            raise ValueError("url is required")
        return HttpRequest(
            method=self._method,
            url=self._url,
            headers=dict(self._headers),
            query_params=dict(self._query_params),
            body=self._body,
            timeout_seconds=self._timeout_seconds,
        )

# --- usage ---
request = (
    HttpRequestBuilder()
    .method("POST")
    .url("https://api.example.com/orders")
    .header("Authorization", "Bearer token123")
    .query_param("dry_run", "true")
    .body('{"item": "keyboard"}')
    .timeout(10)
    .build()
)
```

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;

// Immutable once built.
final class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final Map<String, String> queryParams;
    private final String body;
    private final int timeoutSeconds;

    HttpRequest(String method, String url, Map<String, String> headers,
                Map<String, String> queryParams, String body, int timeoutSeconds) {
        this.method = method;
        this.url = url;
        this.headers = Collections.unmodifiableMap(new HashMap<>(headers));
        this.queryParams = Collections.unmodifiableMap(new HashMap<>(queryParams));
        this.body = body;
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getMethod() { return method; }
    public String getUrl() { return url; }
    public Map<String, String> getHeaders() { return headers; }
}

class HttpRequestBuilder {
    private String method = "GET";
    private String url;
    private final Map<String, String> headers = new HashMap<>();
    private final Map<String, String> queryParams = new HashMap<>();
    private String body;
    private int timeoutSeconds = 30;

    public HttpRequestBuilder method(String method) { this.method = method; return this; }
    public HttpRequestBuilder url(String url) { this.url = url; return this; }
    public HttpRequestBuilder header(String key, String value) { headers.put(key, value); return this; }
    public HttpRequestBuilder queryParam(String key, String value) { queryParams.put(key, value); return this; }
    public HttpRequestBuilder body(String body) { this.body = body; return this; }
    public HttpRequestBuilder timeout(int seconds) { this.timeoutSeconds = seconds; return this; }

    public HttpRequest build() {
        if (url == null) throw new IllegalStateException("url is required");
        return new HttpRequest(method, url, headers, queryParams, body, timeoutSeconds);
    }
}

// --- usage ---
// HttpRequest request = new HttpRequestBuilder()
//     .method("POST")
//     .url("https://api.example.com/orders")
//     .header("Authorization", "Bearer token123")
//     .queryParam("dry_run", "true")
//     .body("{\"item\": \"keyboard\"}")
//     .timeout(10)
//     .build();
```

**Language notes:** Python's keyword arguments and `dataclass` defaults cover many "optional parameter" cases without
a builder at all — Python engineers reach for Builder mainly when construction needs validation or a fluent,
step-by-step feel, not just to avoid long argument lists. Java, lacking named/default parameters, uses Builder far
more often for exactly that reason; Lombok's `@Builder` annotation generates the boilerplate shown above
automatically in real Java codebases.

## Real-world example

Java's `StringBuilder` and `okhttp3.Request.Builder` are Builder in the standard library and in one of the most
widely used HTTP client libraries, respectively. In Python, libraries like `sqlalchemy`'s query builder
(`select(...).where(...).order_by(...)`) apply the same fluent, step-by-step assembly idea.

## Advantages and tradeoffs

<div class="pros-cons">
<div>
<h4>✅ Advantages</h4>
<ul>
<li>Readable, self-documenting construction — the chain of calls describes the object being built</li>
<li>Keeps the final product immutable while allowing flexible, incremental assembly</li>
<li>Centralizes validation in one place (<code>build()</code>) instead of scattering it across constructors</li>
</ul>
</div>
<div>
<h4>❌ Tradeoffs</h4>
<ul>
<li>Doubles the number of classes (one for the product, one for the builder)</li>
<li>Overkill for simple objects with few, mostly-required fields</li>
</ul>
</div>
</div>

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

If asked to design an object with many optional configuration fields, proposing Builder — and explicitly mentioning
that <code>build()</code> is where you validate required fields — is usually exactly what the interviewer is
listening for.

</div>

## Related patterns

- <a href="__BASE__/creational/abstract-factory/">Abstract Factory</a> — Abstract Factory creates families of simple objects; Builder constructs one complex object step by step. They're sometimes combined (a factory that returns a pre-configured builder).
- <a href="__BASE__/fundamentals/immutability/">Immutability</a> — Builder is one of the most common ways to produce immutable objects without an unwieldy constructor.
- <a href="__BASE__/creational/prototype/">Prototype</a> — an alternative way to get a fully-configured object cheaply: clone an existing one instead of building from scratch.
