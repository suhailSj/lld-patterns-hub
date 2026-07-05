---
title: "Adapter"
order: 1
summary: "Convert the interface of a class into another interface clients expect, letting incompatible interfaces work together."
tags: ["Structural", "GoF", "payment processing"]
useWhen: "You need to use an existing class whose interface doesn't match what your code expects, and you can't change either side."
---

## Explanation in simple terms

Adapter is a translator. Your checkout code expects every payment provider to expose `charge(amount_cents)`. A
legacy payment gateway you must integrate with instead exposes `makePaymentInDollars(amountStr)` and returns an XML
string. You can't change the legacy gateway (it's a third-party SDK) and you don't want to change your checkout code
for every provider. Adapter wraps the legacy gateway behind the interface your code already expects.

## Practical example

<div class="callout warn">
<div class="callout-title">⚠️ Why not just edit the legacy class?</div>

The legacy gateway is a vendor SDK — you don't own its source, and it's shared by other teams who depend on its
existing method signatures. Editing it is not an option, and duplicating checkout logic per provider would violate
<a href="__BASE__/solid/ocp/">Open/Closed</a>. Adapter lets both sides stay untouched.

</div>

## Class / object design

```
    «interface»                                LegacyPaymentGateway (third-party, unmodifiable)
   PaymentProcessor                              + makePaymentInDollars(amountStr): xmlResponse
   + charge(amount_cents): bool
          ▲
          │ implements, wraps
   LegacyGatewayAdapter ───delegates to───▶ LegacyPaymentGateway
```

## Python code

```python
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    """The interface checkout code already depends on."""

    @abstractmethod
    def charge(self, amount_cents: int) -> bool: ...

class StripeProcessor(PaymentProcessor):
    """A modern provider that already matches the interface natively."""

    def charge(self, amount_cents: int) -> bool:
        print(f"Stripe: charging {amount_cents} cents")
        return True

class LegacyPaymentGateway:
    """Third-party SDK you cannot modify. Different units, different return type."""

    def make_payment_in_dollars(self, amount_str: str) -> str:
        print(f"LegacyGateway: charging ${amount_str}")
        return "<response><status>OK</status></response>"

class LegacyGatewayAdapter(PaymentProcessor):
    """Translates the modern interface into calls the legacy SDK understands."""

    def __init__(self, legacy_gateway: LegacyPaymentGateway):
        self._legacy_gateway = legacy_gateway

    def charge(self, amount_cents: int) -> bool:
        amount_str = f"{amount_cents / 100:.2f}"
        xml_response = self._legacy_gateway.make_payment_in_dollars(amount_str)
        return "<status>OK</status>" in xml_response

def checkout(processor: PaymentProcessor, amount_cents: int) -> None:
    # checkout() never knows or cares whether it's talking to Stripe or the legacy gateway.
    if processor.charge(amount_cents):
        print("Payment succeeded")

# --- usage ---
checkout(StripeProcessor(), 4999)
checkout(LegacyGatewayAdapter(LegacyPaymentGateway()), 4999)
```

```java
interface PaymentProcessor {
    // The interface checkout code already depends on.
    boolean charge(int amountCents);
}

class StripeProcessor implements PaymentProcessor {
    // A modern provider that already matches the interface natively.
    public boolean charge(int amountCents) {
        System.out.println("Stripe: charging " + amountCents + " cents");
        return true;
    }
}

// Third-party SDK you cannot modify. Different units, different return type.
class LegacyPaymentGateway {
    String makePaymentInDollars(String amountStr) {
        System.out.println("LegacyGateway: charging $" + amountStr);
        return "<response><status>OK</status></response>";
    }
}

// Translates the modern interface into calls the legacy SDK understands.
class LegacyGatewayAdapter implements PaymentProcessor {
    private final LegacyPaymentGateway legacyGateway;
    public LegacyGatewayAdapter(LegacyPaymentGateway legacyGateway) { this.legacyGateway = legacyGateway; }

    public boolean charge(int amountCents) {
        String amountStr = String.format("%.2f", amountCents / 100.0);
        String xmlResponse = legacyGateway.makePaymentInDollars(amountStr);
        return xmlResponse.contains("<status>OK</status>");
    }
}

class Checkout {
    // checkout() never knows or cares whether it's talking to Stripe or the legacy gateway.
    static void run(PaymentProcessor processor, int amountCents) {
        if (processor.charge(amountCents)) {
            System.out.println("Payment succeeded");
        }
    }
}

// --- usage ---
// Checkout.run(new StripeProcessor(), 4999);
// Checkout.run(new LegacyGatewayAdapter(new LegacyPaymentGateway()), 4999);
```

**Language notes:** this is an "object adapter" (composition — the adapter holds a reference to the legacy object),
which both languages express the same way. Java sometimes uses "class adapters" via multiple inheritance tricks in
languages that support it, but since neither Java nor Python cleanly supports implementation multiple-inheritance for
this purpose, the object-adapter form shown here is idiomatic in both.

## Design reasoning

The adapter is intentionally "dumb" — it does no business logic, only translation (unit conversion, response format
conversion). This keeps the translation concern isolated: if the legacy gateway's XML format changes, only the
adapter needs updating, not checkout logic or any other payment processor.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Lets incompatible interfaces cooperate without modifying either side</li>
<li>Isolates messy translation/conversion logic in one small, testable place</li>
<li>Client code stays uniform regardless of how many differently-shaped things it must integrate with</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Adds an extra layer/class per integration</li>
<li>Can mask a leaky abstraction if the wrapped system's semantics genuinely don't map cleanly (e.g. the legacy system doesn't support partial refunds and the adapter has to fake it)</li>
</ul>
</div>
</div>

## When to use

- Integrating a third-party library, legacy system, or external API whose interface doesn't match your code's
  expected interface, and you can't (or shouldn't) change either side.

## When to avoid

- If you own both interfaces, just make them consistent instead of adapting — Adapter is a bridge for interfaces you
  don't control, not a substitute for good API design on your own types.

## Interview talking points

- Adapter changes *only the interface*, not the behavior — contrast this explicitly with Decorator, which keeps the
  interface the same but *adds* behavior.
- Mention "object adapter" (composition, shown here) vs. "class adapter" (inheritance) and why composition is usually
  preferred (works even when the adaptee is `final`/sealed, and avoids fragile multiple inheritance).

## Related patterns

- <a href="__BASE__/structural/facade/">Facade</a> — both wrap something else, but Facade simplifies a whole subsystem's interface for convenience; Adapter makes one existing interface match another that a client already expects.
- <a href="__BASE__/structural/decorator/">Decorator</a> — same interface, added behavior — the mirror image of Adapter's different interface, same behavior.
- <a href="__BASE__/structural/bridge/">Bridge</a> — Bridge is designed up front to let abstraction and implementation vary independently; Adapter is typically retrofitted after the fact to reconcile two things that weren't designed together.
