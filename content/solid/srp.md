---
title: "Single Responsibility Principle"
order: 1
summary: "A class should have only one reason to change — one job, one owner, one axis of change."
tags: ["SOLID", "cohesion", "order processing"]
useWhen: "A class is doing business logic, persistence, and formatting/notification all at once."
---

## Intent / definition

**Single Responsibility Principle (SRP):** a class (or module) should have **one, and only one, reason to change**.
"Responsibility" here means *an axis of change* driven by a specific actor or concern — not "does one thing" in the
tiny-function sense. A class can have several methods and still satisfy SRP, as long as all of them serve the same
concern and would only ever change together, for the same reason.

## Problem statement

Imagine you're building the order-processing part of an e-commerce backend. You need to:

1. Calculate the order total (including tax and discounts).
2. Save the order to the database.
3. Email the customer a receipt.

It's tempting to put all three inside one `Order` class, since they all "belong to placing an order." That
convenience is exactly what SRP warns against.

## Why the naive design fails

<div class="callout pitfall">
<div class="callout-title">🚫 One class, three reasons to change</div>

If `Order` calculates totals, persists itself, and sends email, then a tax-rule change, a database migration, and a
switch from email to SMS notifications **all require editing the same class**. Three unrelated teams — finance,
infrastructure, and marketing — end up modifying the same file for unrelated reasons, and any one of them can break
the other two.

</div>

Concretely, this design:

- is hard to unit test — testing the tax calculation requires a real (or mocked) database and an SMTP server;
- can't be reused — another part of the system that needs "just the total" also drags in persistence and email code;
- grows without bound — every new order-related concern (audit logging, analytics events, invoices) gets bolted onto
  the same class until it becomes a "God object."

## Solution overview

Split the class along its actual axes of change: a calculator that knows pricing rules, a repository that knows how
to persist orders, and a notifier that knows how to reach the customer. `Order` itself becomes a plain data holder.
Each class now has exactly one reason to change:

- `Order` changes only when the *shape* of order data changes.
- `OrderPricingCalculator` changes only when pricing/tax rules change.
- `OrderRepository` changes only when the storage technology or schema changes.
- `ReceiptNotifier` changes only when the notification channel or template changes.

## Class / object design

```
Order (data)
   ▲
   │ used by
OrderPricingCalculator ──calculates totals for──▶ Order
OrderRepository        ──persists──────────────▶ Order
ReceiptNotifier        ──notifies about─────────▶ Order
OrderService           ──coordinates the three above
```

`OrderService` is a thin coordinator — it has one reason to change too: *how the steps of "placing an order" are
sequenced*, not what each step does internally.

## Step-by-step explanation

1. Model `Order` as a plain data object (fields only, no behavior beyond basic accessors).
2. Extract pricing/tax logic into `OrderPricingCalculator`.
3. Extract persistence into `OrderRepository` behind a small interface, so the storage engine can change later
   without touching business logic.
4. Extract customer communication into `ReceiptNotifier`.
5. Introduce `OrderService` to orchestrate: calculate → save → notify. This is the only class that knows the *order*
   of operations; it delegates the *how* to the other three.

## Python example

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    """Pure data. No pricing, storage, or notification logic lives here."""
    order_id: str
    customer_email: str
    line_items: list[tuple[str, float, int]]  # (name, unit_price, qty)
    total: float = field(default=0.0)

class OrderPricingCalculator:
    """Reason to change: tax rules / discount rules."""

    TAX_RATE = 0.08

    def calculate_total(self, order: Order) -> float:
        subtotal = sum(price * qty for _, price, qty in order.line_items)
        return round(subtotal * (1 + self.TAX_RATE), 2)

class OrderRepository:
    """Reason to change: storage technology or schema."""

    def __init__(self):
        self._db: dict[str, Order] = {}

    def save(self, order: Order) -> None:
        self._db[order.order_id] = order

    def get(self, order_id: str) -> Order | None:
        return self._db.get(order_id)

class ReceiptNotifier:
    """Reason to change: notification channel or message template."""

    def send_receipt(self, order: Order) -> None:
        print(f"Emailing {order.customer_email}: your total is ${order.total:.2f}")

class OrderService:
    """Reason to change: the sequence/orchestration of placing an order."""

    def __init__(self, calculator: OrderPricingCalculator, repo: OrderRepository, notifier: ReceiptNotifier):
        self._calculator = calculator
        self._repo = repo
        self._notifier = notifier

    def place_order(self, order: Order) -> Order:
        order.total = self._calculator.calculate_total(order)
        self._repo.save(order)
        self._notifier.send_receipt(order)
        return order

# --- usage ---
service = OrderService(OrderPricingCalculator(), OrderRepository(), ReceiptNotifier())
order = Order("ORD-1", "ada@example.com", [("Keyboard", 89.0, 1), ("Mouse", 25.0, 2)])
service.place_order(order)
```

```java
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

// Pure data. No pricing, storage, or notification logic lives here.
public class Order {
    public final String orderId;
    public final String customerEmail;
    public final List<LineItem> lineItems;
    public double total;

    public Order(String orderId, String customerEmail, List<LineItem> lineItems) {
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.lineItems = lineItems;
    }

    public record LineItem(String name, double unitPrice, int quantity) {}
}

// Reason to change: tax rules / discount rules.
class OrderPricingCalculator {
    private static final double TAX_RATE = 0.08;

    public double calculateTotal(Order order) {
        double subtotal = order.lineItems.stream()
            .mapToDouble(item -> item.unitPrice() * item.quantity())
            .sum();
        return Math.round(subtotal * (1 + TAX_RATE) * 100.0) / 100.0;
    }
}

// Reason to change: storage technology or schema.
class OrderRepository {
    private final Map<String, Order> db = new HashMap<>();

    public void save(Order order) {
        db.put(order.orderId, order);
    }

    public Optional<Order> get(String orderId) {
        return Optional.ofNullable(db.get(orderId));
    }
}

// Reason to change: notification channel or message template.
class ReceiptNotifier {
    public void sendReceipt(Order order) {
        System.out.printf("Emailing %s: your total is $%.2f%n", order.customerEmail, order.total);
    }
}

// Reason to change: the sequence/orchestration of placing an order.
class OrderService {
    private final OrderPricingCalculator calculator;
    private final OrderRepository repo;
    private final ReceiptNotifier notifier;

    public OrderService(OrderPricingCalculator calculator, OrderRepository repo, ReceiptNotifier notifier) {
        this.calculator = calculator;
        this.repo = repo;
        this.notifier = notifier;
    }

    public Order placeOrder(Order order) {
        order.total = calculator.calculateTotal(order);
        repo.save(order);
        notifier.sendReceipt(order);
        return order;
    }
}

// --- usage ---
// var service = new OrderService(new OrderPricingCalculator(), new OrderRepository(), new ReceiptNotifier());
// var order = new Order("ORD-1", "ada@example.com",
//     List.of(new Order.LineItem("Keyboard", 89.0, 1), new Order.LineItem("Mouse", 25.0, 2)));
// service.placeOrder(order);
```

**Language notes:** Python's `dataclass` gives `Order` a free constructor and `__repr__`, mirroring Java's `record`
for the nested `LineItem`. Neither language enforces SRP for you — it's purely a design discipline. Java's static
typing does make the "one reason to change" boundary easier to see: each class's public method signatures tell you
exactly what it's responsible for.

## Real-world example

Web frameworks demonstrate SRP at the architecture level: a **controller** parses the HTTP request, a **service**
holds business logic, and a **repository** talks to the database. When a QA engineer says "the price is wrong,"
you know to look at the service layer only — not scroll through a 900-line controller that also does routing,
validation, and SQL.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Each class is small enough to understand and test in isolation</li>
<li>Changes are localized — a tax rule change can't accidentally break email sending</li>
<li>Classes become reusable in new contexts (e.g. reuse <code>OrderPricingCalculator</code> in a quote/estimate feature)</li>
<li>Easier onboarding: new engineers can own one class without understanding the whole subsystem</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>More classes and files to navigate for a small feature</li>
<li>Over-application ("one method per class") creates unnecessary indirection — SRP is about reasons to change, not line count</li>
<li>Requires a coordinator (<code>OrderService</code>) whose only job is wiring, which can feel like boilerplate</li>
</ul>
</div>
</div>

## When to use

- A class's methods serve more than one stakeholder or business concern (e.g. billing *and* shipping).
- You notice yourself writing "and" when describing what a class does ("it calculates the total **and** saves it
  **and** emails it").
- Two unrelated bug reports keep leading you back to the same file.

## When to avoid

- Don't split a class into pieces that have no independent reason to change — that's just indirection without benefit.
- For very small scripts or prototypes, strict SRP can be premature; apply it as the codebase (and team) grows.

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

When asked "what would you change about this class?", look for the word **"and"** in your own description of it.
If you can't describe the class in one sentence without "and," it likely has more than one responsibility.

</div>

## Interview talking points

- Explain "responsibility" as *an axis of change owned by an actor*, not "does one thing."
- Give a before/after: show the God-class version, then the split version, and name the actor behind each new class
  (finance owns pricing, infra owns storage, marketing owns notifications).
- Mention that SRP is what makes the other SOLID principles *possible* — you can't apply Open/Closed or Dependency
  Inversion cleanly to a class that already has five unrelated responsibilities.

## Related patterns

- **Facade** (Structural) — often introduced *after* splitting a God class, to give callers one simple entry point
  back to the now-separated pieces.
- **Dependency Inversion Principle** — `OrderService` depends on abstractions of the calculator/repo/notifier, which
  is what makes each of them independently swappable and testable.
- See also <a href="__BASE__/fundamentals/cohesion-and-coupling/">Cohesion and Coupling</a> for the underlying theory.
