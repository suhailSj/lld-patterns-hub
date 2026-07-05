---
title: "Strategy"
order: 1
summary: "Define a family of interchangeable algorithms, encapsulate each one, and let the client pick which to use at runtime."
tags: ["Behavioral", "GoF", "payment processing"]
useWhen: "You need to swap an algorithm (pricing, payment, routing) at runtime based on configuration or user choice."
---

## Problem statement

A checkout flow must support paying by credit card, PayPal, or wallet balance — and the set of supported payment
methods grows every few months. The checkout logic (validate cart, apply discounts, charge, confirm) should stay the
same no matter which payment method is chosen.

## Core idea

Extract "how to pay" into its own interface (`PaymentStrategy`) with one method, `pay(amount)`. Each payment method
becomes a class implementing that interface. `Checkout` holds a reference to whichever strategy the user picked and
calls it without knowing (or caring) which concrete implementation it is.

## Real-world analogy

Choosing a route on a map app: walking, driving, cycling, and public transit are all "get from A to B" strategies.
The map app's turn-by-turn UI doesn't change based on which one you pick — it just asks the selected strategy to
compute a route.

## Class / object design

```
      «interface»
     PaymentStrategy
    + pay(amount): bool
           ▲
   ┌───────┼────────┐
CreditCardStrategy  PayPalStrategy  WalletStrategy

Checkout
  - strategy: PaymentStrategy   ◀── set at runtime, e.g. from user selection
  + checkout(amount)
```

## Python example

```python
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount_cents: int) -> bool: ...

class CreditCardStrategy(PaymentStrategy):
    def __init__(self, card_number: str):
        self.card_number = card_number

    def pay(self, amount_cents: int) -> bool:
        print(f"Charging card ending {self.card_number[-4:]}: {amount_cents} cents")
        return True

class PayPalStrategy(PaymentStrategy):
    def __init__(self, email: str):
        self.email = email

    def pay(self, amount_cents: int) -> bool:
        print(f"Charging PayPal account {self.email}: {amount_cents} cents")
        return True

class WalletStrategy(PaymentStrategy):
    def __init__(self, balance_cents: int):
        self.balance_cents = balance_cents

    def pay(self, amount_cents: int) -> bool:
        if amount_cents > self.balance_cents:
            return False
        self.balance_cents -= amount_cents
        print(f"Charging wallet: {amount_cents} cents, remaining {self.balance_cents}")
        return True

class Checkout:
    """Doesn't know or care which payment method it's using — just calls the interface."""

    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: PaymentStrategy) -> None:
        self._strategy = strategy

    def checkout(self, amount_cents: int) -> bool:
        return self._strategy.pay(amount_cents)

# --- usage: same Checkout, swappable strategy chosen at runtime ---
checkout = Checkout(CreditCardStrategy("4111111111111111"))
checkout.checkout(4999)

checkout.set_strategy(WalletStrategy(balance_cents=10000))
checkout.checkout(4999)
```

```java
interface PaymentStrategy {
    boolean pay(int amountCents);
}

class CreditCardStrategy implements PaymentStrategy {
    private final String cardNumber;
    public CreditCardStrategy(String cardNumber) { this.cardNumber = cardNumber; }

    public boolean pay(int amountCents) {
        System.out.println("Charging card ending " + cardNumber.substring(cardNumber.length() - 4) + ": " + amountCents + " cents");
        return true;
    }
}

class PayPalStrategy implements PaymentStrategy {
    private final String email;
    public PayPalStrategy(String email) { this.email = email; }

    public boolean pay(int amountCents) {
        System.out.println("Charging PayPal account " + email + ": " + amountCents + " cents");
        return true;
    }
}

class WalletStrategy implements PaymentStrategy {
    private int balanceCents;
    public WalletStrategy(int balanceCents) { this.balanceCents = balanceCents; }

    public boolean pay(int amountCents) {
        if (amountCents > balanceCents) return false;
        balanceCents -= amountCents;
        System.out.println("Charging wallet: " + amountCents + " cents, remaining " + balanceCents);
        return true;
    }
}

// Doesn't know or care which payment method it's using — just calls the interface.
class Checkout {
    private PaymentStrategy strategy;
    public Checkout(PaymentStrategy strategy) { this.strategy = strategy; }

    public void setStrategy(PaymentStrategy strategy) { this.strategy = strategy; }

    public boolean checkout(int amountCents) {
        return strategy.pay(amountCents);
    }
}

// --- usage: same Checkout, swappable strategy chosen at runtime ---
// Checkout checkout = new Checkout(new CreditCardStrategy("4111111111111111"));
// checkout.checkout(4999);
//
// checkout.setStrategy(new WalletStrategy(10000));
// checkout.checkout(4999);
```

**Language notes:** in Python, a simple function reference or lambda can sometimes substitute for a full
`PaymentStrategy` class when the strategy is stateless — Python treats functions as first-class objects, so
`checkout = Checkout(pay_with_credit_card)` is a lightweight, common variant. Java can achieve the same lightweight
style with a functional interface and lambdas (`PaymentStrategy strategy = amount -> {...}`) since `PaymentStrategy`
here has exactly one abstract method.

## How to identify when to use it

Look for a method with a branch (`if`/`switch`) that selects between several ways of doing conceptually the *same*
job (computing a price, validating input, routing a request, paying for something). If the branches don't know about
each other and the caller picks one explicitly, that's Strategy.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>New algorithms/strategies are added without touching existing ones (ties to <a href="__BASE__/solid/ocp/">OCP</a>)</li>
<li>Each strategy is independently testable</li>
<li>Strategies can be swapped at runtime, even mid-session</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Adds a class per algorithm, which is overkill for two or three simple, stable branches</li>
<li>Client code must know which strategy to select — that selection logic has to live somewhere (often a factory)</li>
</ul>
</div>
</div>

## When to use

- Multiple interchangeable ways to perform the same task, selected by configuration or user choice.

## When to avoid

- A fixed, small set of options that will realistically never grow doesn't need the ceremony of an interface plus one
  class per option.

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

Strategy is nearly identical in shape to <a href="__BASE__/behavioral/state/">State</a> — see the
<a href="__BASE__/cheatsheet/">Cheat Sheet</a> for the exact distinction (who chooses the implementation, and
whether the implementations know about each other).

</div>

## Related patterns

- <a href="__BASE__/behavioral/state/">State</a> — nearly identical structure, different intent: State's implementations transition between each other; Strategy's are chosen explicitly and independently.
- <a href="__BASE__/creational/factory-method/">Factory Method</a> — often used to decide which concrete strategy to construct.
- <a href="__BASE__/solid/ocp/">Open/Closed Principle</a> — Strategy is the primary behavioral pattern for satisfying OCP when the varying part is "which algorithm runs."
