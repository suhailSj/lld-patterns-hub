---
title: "Singleton"
order: 1
summary: "Ensure a class has exactly one instance, and provide a single, well-known point of access to it."
tags: ["Creational", "GoF", "app configuration"]
useWhen: "Exactly one shared instance must coordinate access to a resource (config, connection pool, cache)."
---

## What problem it solves

Some resources genuinely make sense to have exactly one of at runtime: an application's configuration store, a
connection pool, a logging sink, an in-memory cache registry. If two parts of the code each create their own
`AppConfig`, they can silently disagree — one holds stale settings while the other has fresh ones. Singleton
guarantees that every caller gets **the same object**, so state stays consistent.

## When to use

- There must be exactly one coordinating instance (a hardware interface, a single connection pool, a feature-flag
  cache) and having two would cause bugs or wasted resources.
- The instance is expensive to create and it's safe/desirable to reuse it for the life of the application.
- You want a single, globally reachable access point — but you're aware that's also the pattern's biggest risk (see
  below).

## When not to use

<div class="callout pitfall">
<div class="callout-title">🚫 Singleton is often a smell, not a solution</div>

Singleton is one of the most **overused** patterns. It effectively creates global mutable state, which makes unit
testing hard (tests can leak state into each other through the shared instance) and hides a class's dependencies
(any method can reach out to the singleton instead of declaring what it needs). Prefer passing a single, shared
instance in through the constructor (**dependency injection**) and only reach for a true Singleton when a
dependency-injection container isn't available or the "one instance" rule must be enforced by the language/runtime
itself.

</div>

- Avoid it for anything you might reasonably want more than one of later (e.g. "the" database connection — you may
  need a read replica connection too).
- Avoid it purely as a shortcut to avoid passing parameters through a few layers of calls — that's a coupling problem
  Singleton papers over rather than solves.
- Avoid it in multi-tenant systems where "one instance per process" is actually the wrong scope (you often want one
  instance *per tenant/request*, not one for the whole process).

## Class / object design

```
              ┌────────────────────────┐
              │      AppConfig         │
              ├────────────────────────┤
              │ - _instance: AppConfig │ (class-level, private)
              ├────────────────────────┤
              │ + get_instance(): AppConfig │ ◀── the only way in
              │ - __init__() (guarded)      │
              └────────────────────────┘
```

The key structural idea: the constructor is hidden or guarded, and a static/class-level method or property is the
only supported way to obtain the instance. Everything funnels through that one access point.

## Step-by-step explanation

1. Make it impossible (or at least strongly discouraged) to call the constructor directly from outside the class.
2. Store the one instance in a class-level variable.
3. On first access, create the instance; on every later access, return the same object.
4. In multi-threaded runtimes (Java), guard the creation step so two threads can't both create an instance at the
   same time — this is the classic "double-checked locking" concern.

## Python example

Python doesn't have private constructors, so the idiomatic approach overrides `__new__` (the method that actually
allocates the object, called before `__init__`) to intercept instance creation.

```python
import threading

class AppConfig:
    """Loads and holds application configuration exactly once per process."""

    _instance: "AppConfig | None" = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:                # double-checked locking
                if cls._instance is None:   # avoid a race between two threads
                    instance = super().__new__(cls)
                    instance._settings = cls._load_settings()
                    cls._instance = instance
        return cls._instance

    @staticmethod
    def _load_settings() -> dict:
        # In real life: read a config file / environment / secrets manager.
        return {"max_retries": 3, "timeout_seconds": 30}

    def get(self, key: str):
        return self._settings.get(key)

# --- usage ---
config_a = AppConfig()
config_b = AppConfig()
assert config_a is config_b  # same object, loaded only once
print(config_a.get("timeout_seconds"))  # 30
```

```java
public final class AppConfig {

    // volatile so other threads see a fully constructed instance, not a
    // partially-initialized one, once it's assigned.
    private static volatile AppConfig instance;

    private final java.util.Map<String, Object> settings;

    // Private constructor: nobody outside this class can call `new AppConfig()`.
    private AppConfig() {
        this.settings = loadSettings();
    }

    public static AppConfig getInstance() {
        AppConfig result = instance;
        if (result == null) {                       // first check (no locking, fast path)
            synchronized (AppConfig.class) {
                result = instance;
                if (result == null) {                // second check, inside the lock
                    instance = result = new AppConfig();
                }
            }
        }
        return result;
    }

    private static java.util.Map<String, Object> loadSettings() {
        // In real life: read a config file / environment / secrets manager.
        return java.util.Map.of("maxRetries", 3, "timeoutSeconds", 30);
    }

    public Object get(String key) {
        return settings.get(key);
    }
}

// --- usage ---
// AppConfig a = AppConfig.getInstance();
// AppConfig b = AppConfig.getInstance();
// assert a == b; // same object, loaded only once
```

**Language notes:**

- **Python** has no access modifiers, so "private constructor" isn't enforceable — the community convention is to
  override `__new__`, or more simply, to just use a **module** (Python modules are already singletons: import it once,
  get the same object everywhere) instead of a class at all. A module-level `config = AppConfig()` at the bottom of
  a file is often the more idiomatic Python singleton than the class-based version above.
- **Java** requires explicit `synchronized`/`volatile` handling because the JVM can run the getter from multiple
  threads simultaneously; an alternative that sidesteps locking entirely is an **enum singleton**
  (`enum AppConfig { INSTANCE; ... }`), which the JVM guarantees is instantiated exactly once, thread-safely, for free.

## Real-world example

`java.lang.Runtime.getRuntime()` in the JVM standard library is a textbook Singleton — there's exactly one `Runtime`
object representing the current process, and `getRuntime()` is the only way to obtain it. Similarly, most logging
frameworks (Python's `logging.getLogger(name)`, Java's `LoggerFactory.getLogger`) return the *same* logger instance
for a given name so that log configuration applied once is visible everywhere.

## Advantages and tradeoffs

<div class="pros-cons">
<div>
<h4>✅ Advantages</h4>
<ul>
<li>Guarantees a single, consistent source of truth for shared state</li>
<li>Lazy initialization — the expensive object is only created if/when it's actually needed</li>
<li>Saves memory/resources versus creating many copies of an expensive object</li>
</ul>
</div>
<div>
<h4>❌ Tradeoffs</h4>
<ul>
<li>Introduces global mutable state, which makes unit tests order-dependent unless you add a reset hook</li>
<li>Hides a class's real dependencies (a method can silently reach for the singleton instead of receiving it)</li>
<li>Hard to swap for a test double without extra indirection (an interface + injectable instance)</li>
<li>Doesn't play well with multi-tenant or per-request scoping</li>
</ul>
</div>
</div>

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

If asked to implement Singleton, also mention <em>why you'd think twice before using it</em> — interviewers often
follow up with "how would you test code that depends on this?" A strong answer: inject the singleton instance (or an
interface it implements) through the constructor instead of calling <code>getInstance()</code> deep inside business
logic, so tests can substitute a fake.

</div>

## Related patterns

- **Builder** and **Factory Method** are sometimes combined with Singleton — a factory itself is often implemented
  as a Singleton, since you only need one factory instance.
- <a href="__BASE__/fundamentals/dependency-injection/">Dependency Injection</a> is the usual alternative when
  you want "one shared instance" without the testability problems of a hard-coded `getInstance()` call.
- **Multiton** (not covered separately here) generalizes Singleton to "one instance per key" — useful when you
  actually need a small, bounded set of instances (e.g. one connection pool per database).
