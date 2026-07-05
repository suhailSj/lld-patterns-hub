---
title: "Observer"
order: 2
summary: "Define a one-to-many dependency so that when one object changes state, all its dependents are notified automatically."
tags: ["Behavioral", "GoF", "order processing"]
useWhen: "Multiple, possibly unrelated parts of the system need to react whenever a specific event happens, without tight coupling."
---

## Problem statement

When an order's status changes (placed → shipped → delivered), several unrelated parts of the system need to react:
send the customer an email, update the analytics dashboard, and notify the warehouse system. The `Order` class
shouldn't need to import and call all three directly — that list of "who cares about this" will keep growing.

## Core idea

`Order` (the **subject**) keeps a list of **observers** — anything implementing a simple `on_status_changed(order)`
interface — and notifies all of them whenever its status changes, without knowing what any of them actually do.
Observers subscribe and unsubscribe independently; `Order` never changes when a new observer type is added.

## Real-world analogy

A YouTube channel (the subject) has subscribers (observers). When the channel uploads a new video, every subscriber
is notified — the channel doesn't maintain a special-cased list of "email this person, push-notify that person"; it
just notifies whoever is currently subscribed, generically.

## Class / object design

```
Order (subject)
  - observers: list[OrderObserver]
  + subscribe(observer)
  + set_status(new_status)  ──▶ notifies all observers

      «interface»
     OrderObserver
   + on_status_changed(order)
           ▲
   ┌───────┼─────────┐
EmailObserver   AnalyticsObserver   WarehouseObserver
```

## Python example

```python
from abc import ABC, abstractmethod

class OrderObserver(ABC):
    @abstractmethod
    def on_status_changed(self, order: "Order") -> None: ...

class EmailObserver(OrderObserver):
    def on_status_changed(self, order: "Order") -> None:
        print(f"[email] Order {order.order_id} is now {order.status}")

class AnalyticsObserver(OrderObserver):
    def on_status_changed(self, order: "Order") -> None:
        print(f"[analytics] recording status change to {order.status}")

class WarehouseObserver(OrderObserver):
    def on_status_changed(self, order: "Order") -> None:
        if order.status == "PAID":
            print("[warehouse] begin picking items")

class Order:
    """The subject. Knows nothing about email, analytics, or the warehouse."""

    def __init__(self, order_id: str):
        self.order_id = order_id
        self.status = "PLACED"
        self._observers: list[OrderObserver] = []

    def subscribe(self, observer: OrderObserver) -> None:
        self._observers.append(observer)

    def unsubscribe(self, observer: OrderObserver) -> None:
        self._observers.remove(observer)

    def set_status(self, new_status: str) -> None:
        self.status = new_status
        for observer in self._observers:
            observer.on_status_changed(self)

# --- usage ---
order = Order("ORD-1")
order.subscribe(EmailObserver())
order.subscribe(AnalyticsObserver())
order.subscribe(WarehouseObserver())

order.set_status("PAID")  # all three observers react, independently
```

```java
import java.util.ArrayList;
import java.util.List;

interface OrderObserver {
    void onStatusChanged(Order order);
}

class EmailObserver implements OrderObserver {
    public void onStatusChanged(Order order) {
        System.out.println("[email] Order " + order.orderId + " is now " + order.status);
    }
}

class AnalyticsObserver implements OrderObserver {
    public void onStatusChanged(Order order) {
        System.out.println("[analytics] recording status change to " + order.status);
    }
}

class WarehouseObserver implements OrderObserver {
    public void onStatusChanged(Order order) {
        if ("PAID".equals(order.status)) {
            System.out.println("[warehouse] begin picking items");
        }
    }
}

// The subject. Knows nothing about email, analytics, or the warehouse.
class Order {
    final String orderId;
    String status = "PLACED";
    private final List<OrderObserver> observers = new ArrayList<>();

    Order(String orderId) { this.orderId = orderId; }

    void subscribe(OrderObserver observer) { observers.add(observer); }
    void unsubscribe(OrderObserver observer) { observers.remove(observer); }

    void setStatus(String newStatus) {
        this.status = newStatus;
        for (OrderObserver observer : observers) {
            observer.onStatusChanged(this);
        }
    }
}

// --- usage ---
// Order order = new Order("ORD-1");
// order.subscribe(new EmailObserver());
// order.subscribe(new AnalyticsObserver());
// order.subscribe(new WarehouseObserver());
//
// order.setStatus("PAID"); // all three observers react, independently
```

**Language notes:** both versions use a plain list of observer objects and a synchronous notify loop — the simplest,
most common form. Real frameworks often add richer variants: Java's ecosystem favors typed event buses
(`ApplicationEventPublisher` in Spring) or `PropertyChangeSupport`; Python frequently uses lightweight pub/sub
libraries or `asyncio` event patterns for the same idea at scale, but the core relationship (subject notifies a list
of independently-registered observers) stays the same.

## How to identify when to use it

You're writing (or about to write) a method that, after doing its main job, calls several unrelated pieces of code
"because they need to know this happened." If that list of unrelated calls keeps growing every quarter, Observer
lets new reactions be added by registering a new observer instead of editing the subject.

<div class="callout warn">
<div class="callout-title">⚠️ Watch for silent failures and ordering assumptions</div>

If one observer throws an exception, should the rest still run? Should observers execute in a guaranteed order? The
naive synchronous loop above doesn't answer these — decide explicitly (e.g. catch-and-log per observer) rather than
letting one broken observer silently block the others.

</div>

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Subject and observers are loosely coupled — the subject only depends on a small interface</li>
<li>New reactions to an event are added by registering a new observer, not editing the subject</li>
<li>Observers can be added/removed dynamically at runtime</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Notification order and failure handling need explicit design — easy to get wrong by default</li>
<li>Can make control flow harder to trace ("who actually runs when this happens?") without good tooling/logging</li>
<li>Risk of memory leaks if observers subscribe but are never unsubscribed (common in long-lived UI code)</li>
</ul>
</div>
</div>

## When to use

- Several independent parts of a system must react to the same event, and you want to add/remove reactions without
  modifying the event source.

## When to avoid

- If there's exactly one reaction and it will likely stay that way, a direct method call is simpler and easier to
  trace than the indirection of Observer.

## Interview talking points

- Observer is the foundation of most event-driven and reactive systems (UI event listeners, pub/sub message queues,
  reactive streams) — mentioning that breadth shows you see the pattern beyond the textbook example.
- Be ready to discuss failure isolation (one observer's exception shouldn't silently break the others) and whether
  notification should be synchronous or asynchronous.

## Related patterns

- <a href="__BASE__/behavioral/command/">Command</a> — observers are sometimes implemented as queued Commands when notification needs to be asynchronous or retryable.
- <a href="__BASE__/behavioral/chain-of-responsibility/">Chain of Responsibility</a> — contrast: Observer notifies every registered listener; Chain of Responsibility stops at the first handler that handles the request.
- <a href="__BASE__/solid/dip/">Dependency Inversion Principle</a> — the subject depends only on the small `OrderObserver` abstraction, never on concrete observer classes.
