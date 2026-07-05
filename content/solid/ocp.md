---
title: "Open/Closed Principle"
order: 2
summary: "Software entities should be open for extension, but closed for modification."
tags: ["SOLID", "extensibility", "checkout discounts"]
useWhen: "Adding a new business rule currently means editing (and re-testing) an existing, already-shipped class."
---

## Intent / definition

**Open/Closed Principle (OCP):** a class, module, or function should be **open for extension** (you can make it do
new things) but **closed for modification** (you don't have to edit its existing, tested source to do so). In
practice this almost always means: program against an abstraction, and add new behavior by writing a new
implementation of that abstraction rather than adding another `if`/`elif` branch to an existing one.

## Problem statement

An e-commerce checkout needs to apply a discount to an order: percentage-off, a flat amount off, or "buy one get one
free." New promotion types get added every quarter by the marketing team.

## Why the naive design fails

<div class="callout pitfall">
<div class="callout-title">🚫 The growing if/elif chain</div>

The obvious first implementation is a single `DiscountCalculator.apply(order, discount_type)` method with an
`if/elif` (or `switch`) over every known discount type. It works — until promotion #7 needs to ship, at which point
you're editing a method that promotions #1 through #6 already depend on and already have tests for. Every new
promotion risks breaking an old one, and the method never stops growing.

</div>

This design:

- forces you to modify and re-test a shared, already-shipped class for every new requirement;
- couples unrelated discount types together in one method, so a bug in the "BOGO" branch can be introduced while
  touching the "percentage-off" branch;
- makes ownership fuzzy — marketing wants new promotion types shipped fast, but every change requires touching code
  that engineering already regression-tested for older promotions.

## Solution overview

Define a small `Discount` abstraction with one method, `apply(order)`. Each discount type becomes its own class that
implements this method. `DiscountCalculator` (or the checkout service) depends only on the abstraction and a
*list* of discounts to apply — it never needs to change when a new discount type is added; you simply write a new
class and register it.

## Class / object design

```
        «interface»
          Discount
       + apply(order): float
             ▲
   ┌─────────┼──────────────┐
PercentageDiscount   FlatAmountDiscount   BuyOneGetOneDiscount
   (implements)         (implements)          (implements)

CheckoutService --- depends on ---> Discount (never on concrete classes)
```

## Step-by-step explanation

1. Identify the axis of change — here, "which discount rule applies."
2. Extract a one-method interface/abstract class (`Discount`) representing that axis.
3. Move each existing `if` branch into its own class implementing the interface.
4. Change the caller (`CheckoutService`) to accept a list/collection of `Discount` objects instead of a type flag.
5. Adding a new promotion is now: write one new class, register it — zero edits to `CheckoutService` or existing
   discount classes.

## Python example

```python
from abc import ABC, abstractmethod

class Discount(ABC):
    """The one axis of extension: how a discount computes its reduction."""

    @abstractmethod
    def apply(self, subtotal: float) -> float:
        """Returns the amount to subtract from subtotal."""

class PercentageDiscount(Discount):
    def __init__(self, percent: float):
        self.percent = percent

    def apply(self, subtotal: float) -> float:
        return subtotal * (self.percent / 100)

class FlatAmountDiscount(Discount):
    def __init__(self, amount: float):
        self.amount = amount

    def apply(self, subtotal: float) -> float:
        return min(self.amount, subtotal)

class FreeShippingDiscount(Discount):
    def __init__(self, shipping_cost: float):
        self.shipping_cost = shipping_cost

    def apply(self, subtotal: float) -> float:
        return self.shipping_cost

class CheckoutService:
    """Closed for modification: adding a new Discount type never touches this class."""

    def total_after_discounts(self, subtotal: float, discounts: list[Discount]) -> float:
        reduction = sum(d.apply(subtotal) for d in discounts)
        return max(0.0, subtotal - reduction)

# --- usage ---
checkout = CheckoutService()
discounts = [PercentageDiscount(10), FlatAmountDiscount(5)]
print(checkout.total_after_discounts(200.0, discounts))  # 175.0

# New quarter, new promo type — CheckoutService is untouched:
class LoyaltyPointsDiscount(Discount):
    def __init__(self, points: int):
        self.points = points

    def apply(self, subtotal: float) -> float:
        return min(self.points * 0.01, subtotal)
```

```java
import java.util.List;

interface Discount {
    // The one axis of extension: how a discount computes its reduction.
    double apply(double subtotal);
}

class PercentageDiscount implements Discount {
    private final double percent;
    public PercentageDiscount(double percent) { this.percent = percent; }
    public double apply(double subtotal) { return subtotal * (percent / 100); }
}

class FlatAmountDiscount implements Discount {
    private final double amount;
    public FlatAmountDiscount(double amount) { this.amount = amount; }
    public double apply(double subtotal) { return Math.min(amount, subtotal); }
}

class FreeShippingDiscount implements Discount {
    private final double shippingCost;
    public FreeShippingDiscount(double shippingCost) { this.shippingCost = shippingCost; }
    public double apply(double subtotal) { return shippingCost; }
}

// Closed for modification: adding a new Discount type never touches this class.
class CheckoutService {
    public double totalAfterDiscounts(double subtotal, List<Discount> discounts) {
        double reduction = discounts.stream().mapToDouble(d -> d.apply(subtotal)).sum();
        return Math.max(0.0, subtotal - reduction);
    }
}

// --- usage ---
// CheckoutService checkout = new CheckoutService();
// var discounts = List.<Discount>of(new PercentageDiscount(10), new FlatAmountDiscount(5));
// System.out.println(checkout.totalAfterDiscounts(200.0, discounts)); // 175.0

// New quarter, new promo type — CheckoutService is untouched:
class LoyaltyPointsDiscount implements Discount {
    private final int points;
    public LoyaltyPointsDiscount(int points) { this.points = points; }
    public double apply(double subtotal) { return Math.min(points * 0.01, subtotal); }
}
```

**Language notes:** Python's `ABC` + `@abstractmethod` gives you the same "must implement this method" contract that
Java's `interface` gives natively. Because Python is duck-typed, you could even skip `ABC` entirely and just write
classes with an `apply` method — OCP is a design discipline, not something either language enforces at compile time
(Java gets closer, since a class that "implements" an interface but omits a method fails to compile).

## Real-world example

Payment gateways are a common real example: a `PaymentProcessor` interface with `charge(amount)`, implemented by
`StripeProcessor`, `PayPalProcessor`, `ApplePayProcessor`. Adding support for a new payment provider never requires
touching the checkout code that already works for the existing providers — you add one new class.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>New requirements are additive (new files), not edits to shared, tested code</li>
<li>Reduces regression risk — old discount types can't be broken while adding a new one</li>
<li>Each discount type is independently unit-testable</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Requires anticipating the right abstraction up front — guessing wrong adds indirection without benefit</li>
<li>More classes/files for what might have been a three-line <code>if</code> statement</li>
<li>Can be over-applied ("abstract everything") when a concrete piece of logic will realistically never change</li>
</ul>
</div>
</div>

## When to use

- A class already has (or clearly will grow) a branching statement selecting behavior by "type."
- Different teams or timelines own different branches of that behavior (marketing ships promotions; engineering ships the checkout).

## When to avoid

- Don't introduce an interface for a single, stable implementation "just in case" — that's speculative generality.
- If the set of variants is small, fixed, and genuinely will never grow (e.g. "north/south/east/west"), a simple
  conditional can be clearer than an abstraction layer.

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

A strong interview answer names the axis of change explicitly: "the thing that varies here is <em>how the discount
is computed</em>, so that's what I'll extract into an interface — everything else about checkout stays the same."

</div>

## Interview talking points

- OCP is usually demonstrated, not just defined: show the `if/elif` version, name its risk, then show the
  interface-based version.
- Mention that OCP and the Strategy pattern are nearly the same idea — Strategy is often described as "OCP applied to
  runtime-selectable algorithms."
- Be ready to push back on over-abstraction: OCP isn't "make everything an interface," it's "isolate the parts that
  actually vary."

## Related patterns

- <a href="__BASE__/behavioral/strategy/">Strategy</a> — the behavioral pattern most directly modeling OCP: interchangeable algorithms behind one interface.
- <a href="__BASE__/creational/factory-method/">Factory Method</a> — often used alongside OCP to decide *which* concrete strategy/discount to instantiate without a switch statement leaking into client code.
- <a href="__BASE__/solid/srp/">Single Responsibility Principle</a> — SRP is usually the prerequisite: you can't cleanly extend a class that already has five unrelated responsibilities.
