---
title: "Decorator"
order: 2
summary: "Attach additional responsibilities to an object dynamically, without altering its interface or subclassing every combination."
tags: ["Structural", "GoF", "notification systems"]
useWhen: "You need to mix and match extra behaviors (logging, retry, rate-limiting) around a core object at runtime."
---

## Explanation in simple terms

A notification system needs to send messages, but different deployments want different combinations of extras:
retry on failure, rate-limiting, and logging. Subclassing every combination (`RetryingEmailNotifier`,
`LoggingRetryingEmailNotifier`, `RateLimitedLoggingRetryingEmailNotifier`...) explodes combinatorially. Decorator
instead wraps a base notifier in layers, each adding one responsibility, stacked in whatever order you need.

## Practical example

<div class="callout pitfall">
<div class="callout-title">🚫 The subclass explosion this avoids</div>

With 1 base notifier and 3 optional extras, subclassing every combination requires up to 2³ = 8 classes. Add a
fourth extra and it's 16. Decorator needs exactly 1 class per extra (4 total), combined at runtime in any order.

</div>

## Class / object design

```
        «interface»
         Notifier
       + send(msg)
             ▲
   ┌─────────┼───────────────────┐
EmailNotifier            NotifierDecorator (abstract, implements Notifier)
(the real component)            ▲
                     ┌───────────┼────────────┐
              RetryDecorator  LoggingDecorator  RateLimitDecorator
              (each wraps another Notifier and adds one responsibility)
```

## Python code

```python
from abc import ABC, abstractmethod

class Notifier(ABC):
    @abstractmethod
    def send(self, message: str) -> None: ...

class EmailNotifier(Notifier):
    """The real component being decorated."""

    def send(self, message: str) -> None:
        print(f"[email] {message}")

class NotifierDecorator(Notifier):
    """Base decorator: holds the wrapped Notifier and forwards to it by default."""

    def __init__(self, wrapped: Notifier):
        self._wrapped = wrapped

    def send(self, message: str) -> None:
        self._wrapped.send(message)

class LoggingDecorator(NotifierDecorator):
    def send(self, message: str) -> None:
        print(f"[log] about to send: {message!r}")
        super().send(message)
        print("[log] send complete")

class RetryDecorator(NotifierDecorator):
    def __init__(self, wrapped: Notifier, max_attempts: int = 3):
        super().__init__(wrapped)
        self._max_attempts = max_attempts

    def send(self, message: str) -> None:
        for attempt in range(1, self._max_attempts + 1):
            try:
                super().send(message)
                return
            except ConnectionError:
                print(f"[retry] attempt {attempt} failed")
        raise ConnectionError("All retry attempts failed")

# --- usage: stack decorators in whatever order the deployment needs ---
notifier: Notifier = LoggingDecorator(RetryDecorator(EmailNotifier()))
notifier.send("Your order has shipped!")
```

```java
interface Notifier {
    void send(String message);
}

// The real component being decorated.
class EmailNotifier implements Notifier {
    public void send(String message) {
        System.out.println("[email] " + message);
    }
}

// Base decorator: holds the wrapped Notifier and forwards to it by default.
abstract class NotifierDecorator implements Notifier {
    protected final Notifier wrapped;
    protected NotifierDecorator(Notifier wrapped) { this.wrapped = wrapped; }

    public void send(String message) { wrapped.send(message); }
}

class LoggingDecorator extends NotifierDecorator {
    public LoggingDecorator(Notifier wrapped) { super(wrapped); }

    @Override
    public void send(String message) {
        System.out.println("[log] about to send: " + message);
        super.send(message);
        System.out.println("[log] send complete");
    }
}

class RetryDecorator extends NotifierDecorator {
    private final int maxAttempts;
    public RetryDecorator(Notifier wrapped, int maxAttempts) {
        super(wrapped);
        this.maxAttempts = maxAttempts;
    }

    @Override
    public void send(String message) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                super.send(message);
                return;
            } catch (RuntimeException e) {
                System.out.println("[retry] attempt " + attempt + " failed");
            }
        }
        throw new RuntimeException("All retry attempts failed");
    }
}

// --- usage: stack decorators in whatever order the deployment needs ---
// Notifier notifier = new LoggingDecorator(new RetryDecorator(new EmailNotifier(), 3));
// notifier.send("Your order has shipped!");
```

**Language notes:** Java's `abstract class NotifierDecorator implements Notifier` with `super.send(message)` is the
idiomatic base decorator. Python doesn't need `ABC` here for `NotifierDecorator` strictly, but keeping the same
`Notifier` interface makes the intent explicit; Python decorators-as-a-language-feature (the `@decorator` syntax) are
a *different*, function-wrapping concept — don't confuse the GoF Decorator pattern shown here with Python's
`@decorator` syntax, though they share a name and a similar spirit of "wrap and add behavior."

## Design reasoning

Every decorator implements the *same* interface as the thing it wraps (`Notifier`), which is what allows decorators
to wrap each other in any order and any combination — the caller of `notifier.send(...)` can't tell (and doesn't
need to know) how many layers are underneath.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Add/remove responsibilities at runtime by changing how objects are wrapped, not by editing classes</li>
<li>Avoids combinatorial subclass explosion for optional behaviors</li>
<li>Each decorator has a single, focused responsibility (ties to <a href="__BASE__/solid/srp/">SRP</a>)</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Many small wrapper objects can make debugging/stepping through calls harder ("which layer failed?")</li>
<li>Order of wrapping can matter and isn't always obvious from the call site (logging outside retry vs. inside retry behaves differently)</li>
</ul>
</div>
</div>

## When to use

- You need optional, combinable behaviors layered around a core object (logging, caching, retry, rate-limiting,
  compression, encryption).

## When to avoid

- If there's only ever one fixed combination of extra behavior, a single class implementing all of it directly is
  simpler than a stack of decorators.

## Interview talking points

- Explicitly contrast with Proxy (see <a href="__BASE__/cheatsheet/">Cheat Sheet</a>): Decorator *adds* new
  behavior; Proxy *controls access* to existing behavior and should behave identically to the real object from the
  caller's perspective.
- Mention that decorators are meant to be stacked in any combination/order — that composability is the whole point,
  unlike a fixed inheritance chain.

## Related patterns

- <a href="__BASE__/structural/proxy/">Proxy</a> — structurally almost identical, but with a different intent: controlling access rather than adding behavior.
- <a href="__BASE__/structural/adapter/">Adapter</a> — changes the interface; Decorator deliberately keeps it the same.
- <a href="__BASE__/structural/composite/">Composite</a> — both rely on recursive, uniform interfaces, but Composite models part-whole trees, not layered behavior.
