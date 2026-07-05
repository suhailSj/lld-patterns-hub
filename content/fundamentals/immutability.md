---
title: "Immutability"
order: 5
summary: "Objects whose state can't change after construction — fewer bugs from shared mutable state, at the cost of creating new objects instead of mutating existing ones."
tags: ["Fundamentals", "concurrency", "money handling"]
useWhen: "A value is passed around and shared widely, and accidental mutation would cause hard-to-trace bugs."
---

## Intent / definition

An **immutable** object's state is fixed at construction and can never change afterward. Instead of mutating an
object in place, operations that "change" it return a *new* object with the updated state, leaving the original
untouched. This eliminates an entire category of bugs caused by unexpected, shared, in-place mutation.

## Problem statement

A `Money` value (an amount + currency) is passed around a billing system: added to totals, multiplied by tax rates,
compared for equality, stored in multiple places at once (a cart, a receipt, an audit log). If `Money` is mutable,
any one of those places could accidentally change the amount the others are relying on.

## Why the naive (mutable) approach fails

<div class="callout pitfall">
<div class="callout-title">🚫 Shared references, silent corruption</div>

```python
receipt_total = Money(100, "USD")
cart_total = receipt_total          # NOT a copy — same object
cart_total.amount += 25             # oops: this also changed receipt_total!
```

Because `cart_total` and `receipt_total` point at the *same* mutable object, an innocent-looking update to one
silently corrupts the other. Bugs like this are notoriously hard to trace because the mutation and the place it's
observed can be far apart in the codebase, and nothing about the code above looks obviously wrong.

</div>

## Solution overview

Make `Money` immutable: its amount and currency are set once, in the constructor, and never changed afterward. An
operation like `add(other)` returns a **new** `Money` instance rather than mutating `self`. Now `cart_total =
receipt_total.add(Money(25, "USD"))` can never affect `receipt_total`, because nothing ever mutates an existing
`Money` object — every "change" produces a distinct object.

## Python example

```python
from dataclasses import dataclass

@dataclass(frozen=True)  # frozen=True raises if any field is reassigned after construction
class Money:
    amount_cents: int
    currency: str

    def add(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount_cents + other.amount_cents, self.currency)  # returns a NEW instance

    def multiply(self, factor: float) -> "Money":
        return Money(round(self.amount_cents * factor), self.currency)

# --- usage ---
receipt_total = Money(10000, "USD")
cart_total = receipt_total.add(Money(2500, "USD"))

print(receipt_total.amount_cents)  # 10000 — untouched
print(cart_total.amount_cents)     # 12500 — a brand new object

try:
    receipt_total.amount_cents = 0  # raises: frozen dataclasses reject attribute assignment
except Exception as e:
    print(f"Blocked: {e}")
```

```java
final class Money {
    private final long amountCents; // `final` fields set once, in the constructor, never reassigned
    private final String currency;

    Money(long amountCents, String currency) {
        this.amountCents = amountCents;
        this.currency = currency;
    }

    Money add(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("Cannot add different currencies");
        return new Money(this.amountCents + other.amountCents, currency); // returns a NEW instance
    }

    Money multiply(double factor) {
        return new Money(Math.round(amountCents * factor), currency);
    }

    long getAmountCents() { return amountCents; }
}

// --- usage ---
// Money receiptTotal = new Money(10000, "USD");
// Money cartTotal = receiptTotal.add(new Money(2500, "USD"));
//
// System.out.println(receiptTotal.getAmountCents()); // 10000 — untouched
// System.out.println(cartTotal.getAmountCents());    // 12500 — a brand new object
//
// // There's no setter at all — the compiler prevents mutation, there's nothing to "block" at runtime.
```

**Language notes:** Python's `@dataclass(frozen=True)` raises a `FrozenInstanceError` at *runtime* if you try to
reassign a field — it's enforced, but only when the assignment is attempted. Java's `final` fields with no setters
are enforced at *compile time* — code that tries to reassign a `final` field simply won't compile. Java's
`record` type (used elsewhere on this site, e.g. in <a href="__BASE__/solid/dip/">DIP</a>) is an even more
concise way to get the same immutable-value-object behavior for simple data carriers.

## Real-world example

`java.lang.String` and Python's `str`/`tuple` are immutable by design in both languages' standard libraries — every
"modification" (`s.upper()`, `s + "!"`) returns a new string, leaving the original untouched. This is precisely why
strings are safe to share freely across threads and function calls without defensive copying.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Eliminates accidental shared-mutation bugs entirely — there's nothing to mutate</li>
<li>Safe to share across threads without locks, since no thread can ever change the object's state</li>
<li>Makes reasoning about code easier — an object's value is fixed for its entire lifetime</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Every "change" allocates a new object, which can add memory/GC pressure for very hot code paths</li>
<li>Deeply nested immutable structures can make small updates verbose (needing to reconstruct several layers)</li>
</ul>
</div>
</div>

## When to use

- Value objects shared widely across a codebase (money, dates, coordinates, configuration snapshots).
- Anything shared across threads, where mutable shared state would require locking.

## When to avoid

- High-frequency, performance-sensitive mutation of large objects (e.g. a game's per-frame physics state) is often
  better served by controlled, well-encapsulated mutability than by reallocating every frame.

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

If asked to design a value type shared across a system (money, a coordinate, a date range), proposing immutability
up front — and explaining <em>why</em> with a shared-mutation bug example like the one above — is usually exactly
what's being tested.

</div>

## Interview talking points

- Connect immutability directly to thread-safety: immutable objects require no synchronization, because there's no
  mutable state to race on.
- Mention that <a href="__BASE__/creational/builder/">Builder</a> is one of the most common ways to construct a
  complex immutable object without an unwieldy constructor.

## Related patterns

- <a href="__BASE__/creational/builder/">Builder</a> — a common technique for producing immutable objects that need multi-step, flexible construction.
- <a href="__BASE__/creational/prototype/">Prototype</a> — immutable objects sidestep the deep-vs-shallow-copy pitfalls Prototype has to worry about, since there's no mutable state to accidentally share.
- <a href="__BASE__/fundamentals/oop-pillars/">Encapsulation</a> — immutability is encapsulation taken to its logical extreme: not just controlled mutation, but no mutation at all.
