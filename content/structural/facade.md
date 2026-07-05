---
title: "Facade"
order: 3
summary: "Provide a single, simplified interface to a complex subsystem made of many interacting parts."
tags: ["Structural", "GoF", "order processing"]
useWhen: "Callers need to perform a multi-step operation across several subsystems and shouldn't need to know all of them."
---

## Explanation in simple terms

Placing an order touches inventory (check and reserve stock), payment (charge the card), shipping (schedule a
carrier pickup), and notifications (email the receipt). A checkout controller shouldn't need to know the internals
of all four subsystems just to place an order. Facade gives it one method, `place_order(...)`, that coordinates the
subsystems internally.

## Practical example

<div class="callout tip">
<div class="callout-title">💡 Facade doesn't hide the subsystems — it adds a shortcut</div>

Advanced callers can still reach the individual subsystems directly (e.g. an admin tool that only needs to re-check
inventory). Facade doesn't remove access to `InventoryService`, `PaymentService`, etc. — it just gives the common
case a single, simple entry point.

</div>

## Class / object design

```
OrderFacade
  + place_order(cart, payment_info) ─┬──▶ InventoryService.reserve(items)
                                       ├──▶ PaymentService.charge(amount)
                                       ├──▶ ShippingService.schedule(order)
                                       └──▶ NotificationService.send_receipt(order)
```

## Python code

```python
from dataclasses import dataclass

@dataclass
class Cart:
    items: list[str]
    total_cents: int

class InventoryService:
    def reserve(self, items: list[str]) -> bool:
        print(f"Inventory: reserving {items}")
        return True

class PaymentService:
    def charge(self, amount_cents: int) -> bool:
        print(f"Payment: charging {amount_cents} cents")
        return True

class ShippingService:
    def schedule(self, items: list[str]) -> str:
        print(f"Shipping: scheduling pickup for {items}")
        return "TRACK-12345"

class NotificationService:
    def send_receipt(self, tracking_code: str) -> None:
        print(f"Notification: emailing receipt, tracking {tracking_code}")

class OrderFacade:
    """One simple entry point coordinating four subsystems."""

    def __init__(self):
        self._inventory = InventoryService()
        self._payment = PaymentService()
        self._shipping = ShippingService()
        self._notifications = NotificationService()

    def place_order(self, cart: Cart) -> str:
        if not self._inventory.reserve(cart.items):
            raise RuntimeError("Items not available")
        if not self._payment.charge(cart.total_cents):
            raise RuntimeError("Payment failed")
        tracking_code = self._shipping.schedule(cart.items)
        self._notifications.send_receipt(tracking_code)
        return tracking_code

# --- usage ---
facade = OrderFacade()
tracking_code = facade.place_order(Cart(items=["Keyboard", "Mouse"], total_cents=11400))
```

```java
import java.util.List;

class Cart {
    final List<String> items;
    final int totalCents;
    Cart(List<String> items, int totalCents) { this.items = items; this.totalCents = totalCents; }
}

class InventoryService {
    boolean reserve(List<String> items) {
        System.out.println("Inventory: reserving " + items);
        return true;
    }
}

class PaymentService {
    boolean charge(int amountCents) {
        System.out.println("Payment: charging " + amountCents + " cents");
        return true;
    }
}

class ShippingService {
    String schedule(List<String> items) {
        System.out.println("Shipping: scheduling pickup for " + items);
        return "TRACK-12345";
    }
}

class NotificationService {
    void sendReceipt(String trackingCode) {
        System.out.println("Notification: emailing receipt, tracking " + trackingCode);
    }
}

// One simple entry point coordinating four subsystems.
class OrderFacade {
    private final InventoryService inventory = new InventoryService();
    private final PaymentService payment = new PaymentService();
    private final ShippingService shipping = new ShippingService();
    private final NotificationService notifications = new NotificationService();

    public String placeOrder(Cart cart) {
        if (!inventory.reserve(cart.items)) throw new RuntimeException("Items not available");
        if (!payment.charge(cart.totalCents)) throw new RuntimeException("Payment failed");
        String trackingCode = shipping.schedule(cart.items);
        notifications.sendReceipt(trackingCode);
        return trackingCode;
    }
}

// --- usage ---
// OrderFacade facade = new OrderFacade();
// String trackingCode = facade.placeOrder(new Cart(List.of("Keyboard", "Mouse"), 11400));
```

**Language notes:** the pattern is purely structural — there's nothing language-specific here. In both languages, the
facade is a thin coordinating class; the real complexity stays in the subsystem classes it wraps.

## Design reasoning

The facade takes on exactly one responsibility: sequencing calls across subsystems for the common case. It
deliberately contains no business rules of its own (no tax logic, no shipping rate calculation) — those stay owned
by their respective subsystems, keeping the facade thin and easy to reason about.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Simplifies the common case for callers who don't need subsystem-level detail</li>
<li>Reduces coupling between client code and the internals of a complex subsystem</li>
<li>Makes it easier to change subsystem internals later, as long as the facade's own interface stays stable</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Can become a God object if every new subsystem interaction gets piled into the same facade — watch for <a href="__BASE__/solid/srp/">SRP</a> violations creeping back in</li>
<li>Adds one more layer between callers and subsystems</li>
</ul>
</div>
</div>

## When to use

- A workflow spans several subsystems, and most callers only need the "typical" combination of calls in the typical
  order.
- You're integrating a complex third-party library or legacy subsystem and want to expose only the 20% of it your
  application actually uses.

## When to avoid

- Don't build a facade in front of a subsystem that's already simple — it just adds indirection without simplifying
  anything.
- Don't let the facade grow business logic of its own; if it starts making decisions rather than coordinating calls,
  it's no longer "just" a facade.

## Interview talking points

- Facade doesn't add new capability — every subsystem method it calls is still directly reachable. It exists purely
  for convenience and lower coupling.
- Good follow-up: contrast with Adapter — Facade simplifies/coordinates several interfaces; Adapter translates one
  specific interface into another that a client expects.

## Related patterns

- <a href="__BASE__/structural/adapter/">Adapter</a> — Adapter reconciles one mismatched interface; Facade simplifies access to several subsystem interfaces at once.
- <a href="__BASE__/solid/srp/">Single Responsibility Principle</a> — splitting a God class often produces the subsystem classes a Facade later coordinates.
- <a href="__BASE__/creational/singleton/">Singleton</a> — facades are frequently implemented as a single shared instance, since there's usually no need for more than one.
