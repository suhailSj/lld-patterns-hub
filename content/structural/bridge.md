---
title: "Bridge"
order: 6
summary: "Decouple an abstraction from its implementation so the two can vary and evolve independently."
tags: ["Structural", "GoF", "notification systems"]
useWhen: "You have two independent dimensions of variation (e.g. message type × delivery channel) that would otherwise multiply into a class explosion."
---

## Explanation in simple terms

A notification system has message *types* (Alert, Promotion, Reminder) and delivery *channels* (Email, SMS, Push).
Naive inheritance — `AlertEmail`, `AlertSms`, `PromotionEmail`, `PromotionSms`, ... — creates one class per
combination: 3 types × 3 channels = 9 classes, and every new type or channel multiplies the total. Bridge splits the
two dimensions into separate hierarchies connected by composition, so each dimension can grow independently: 3 + 3 =
6 classes, and either can be extended without touching the other.

## Practical example

<div class="callout pitfall">
<div class="callout-title">🚫 The class explosion Bridge prevents</div>

Without Bridge: adding a 4th channel (Slack) to the 9-class inheritance version means writing 3 new classes
(`AlertSlack`, `PromotionSlack`, `ReminderSlack`). With Bridge: adding Slack means writing exactly <strong>one</strong>
new class, because message types and channels vary independently.

</div>

## Class / object design

```
     «abstraction»                          «implementor» (the "bridge")
      Message                                DeliveryChannel
   - channel: DeliveryChannel  ◀──has-a──   + send(text): None
   + notify(text)                                 ▲
        ▲                              ┌───────────┼───────────┐
  ┌─────┼──────┐                  EmailChannel  SmsChannel  PushChannel
 Alert  Promotion  Reminder      (implementation hierarchy — grows independently)
 (abstraction hierarchy — grows independently)
```

## Step-by-step explanation

1. Identify the two independent dimensions of variation (message type, delivery channel).
2. Define an "implementor" interface for one dimension (`DeliveryChannel`) with concrete implementations per channel.
3. Define an "abstraction" base class for the other dimension (`Message`) that **holds a reference** to a
   `DeliveryChannel` instead of inheriting from a channel-specific class.
4. Each concrete `Message` subtype (Alert, Promotion) delegates the actual sending to whatever channel it was given.
5. New message types and new channels can now be added independently — neither hierarchy needs to know how big the
   other one is.

## Python code

```python
from abc import ABC, abstractmethod

class DeliveryChannel(ABC):
    """The implementor hierarchy: HOW a message physically gets delivered."""

    @abstractmethod
    def send(self, text: str) -> None: ...

class EmailChannel(DeliveryChannel):
    def send(self, text: str) -> None:
        print(f"[email] {text}")

class SmsChannel(DeliveryChannel):
    def send(self, text: str) -> None:
        print(f"[sms] {text}")

class PushChannel(DeliveryChannel):
    def send(self, text: str) -> None:
        print(f"[push] {text}")

class Message(ABC):
    """The abstraction hierarchy: WHAT kind of message this is. Holds a channel (bridge), doesn't inherit from one."""

    def __init__(self, channel: DeliveryChannel):
        self._channel = channel

    @abstractmethod
    def notify(self, body: str) -> None: ...

class AlertMessage(Message):
    def notify(self, body: str) -> None:
        self._channel.send(f"🚨 ALERT: {body}")

class PromotionMessage(Message):
    def notify(self, body: str) -> None:
        self._channel.send(f"💸 Deal: {body}")

# --- usage: mix any message type with any channel, independently ---
AlertMessage(SmsChannel()).notify("Unusual sign-in detected")
PromotionMessage(EmailChannel()).notify("20% off this weekend")
AlertMessage(PushChannel()).notify("Payment failed")
```

```java
interface DeliveryChannel {
    // The implementor hierarchy: HOW a message physically gets delivered.
    void send(String text);
}

class EmailChannel implements DeliveryChannel {
    public void send(String text) { System.out.println("[email] " + text); }
}

class SmsChannel implements DeliveryChannel {
    public void send(String text) { System.out.println("[sms] " + text); }
}

class PushChannel implements DeliveryChannel {
    public void send(String text) { System.out.println("[push] " + text); }
}

// The abstraction hierarchy: WHAT kind of message this is. Holds a channel (bridge), doesn't inherit from one.
abstract class Message {
    protected final DeliveryChannel channel;
    protected Message(DeliveryChannel channel) { this.channel = channel; }

    abstract void notify(String body);
}

class AlertMessage extends Message {
    AlertMessage(DeliveryChannel channel) { super(channel); }
    void notify(String body) { channel.send("🚨 ALERT: " + body); }
}

class PromotionMessage extends Message {
    PromotionMessage(DeliveryChannel channel) { super(channel); }
    void notify(String body) { channel.send("💸 Deal: " + body); }
}

// --- usage: mix any message type with any channel, independently ---
// new AlertMessage(new SmsChannel()).notify("Unusual sign-in detected");
// new PromotionMessage(new EmailChannel()).notify("20% off this weekend");
// new AlertMessage(new PushChannel()).notify("Payment failed");
```

**Language notes:** the "bridge" itself — a reference held via composition rather than inheritance — reads
identically in both languages. This is the same underlying idea as the
<a href="__BASE__/fundamentals/composition-vs-inheritance/">composition-over-inheritance</a> guidance applied
specifically to eliminate a two-dimensional class explosion.

## Design reasoning

The key design decision is *which* dimension becomes the "abstraction" (held by reference) and which becomes the
"implementor" (referenced). Here, message *type* is the abstraction because it's the caller-facing concept
(`AlertMessage`, `PromotionMessage`); delivery *channel* is the implementor because it's an interchangeable detail of
*how* the message reaches the user.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Eliminates class-count multiplication across two independent dimensions</li>
<li>Either dimension can be extended (new message type, new channel) without touching the other</li>
<li>Both hierarchies can be tested independently</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Adds an extra layer of indirection versus a simple inheritance hierarchy when there's really only one dimension of variation</li>
<li>Requires spotting the "two independent dimensions" shape up front — it's not always obvious in early designs</li>
</ul>
</div>
</div>

## When to use

- You have two (or more) independent ways a class can vary, and inheritance alone would force you to represent every
  combination as a separate class.
- You want both dimensions to be extensible by different teams/timelines without coordinating changes to a shared
  class.

## When to avoid

- If there's genuinely only one dimension of variation, plain inheritance or Strategy alone is simpler than
  introducing a second hierarchy.

## Interview talking points

- The tell for Bridge: "there are two things that vary independently, and multiplying them together as subclasses
  would explode." Naming that shape is usually more valuable than reciting the abstraction/implementor vocabulary.
- Contrast with Abstract Factory: Bridge decouples *one* abstraction from *one* implementation hierarchy at the
  object level; Abstract Factory produces *families* of related objects together.

## Related patterns

- <a href="__BASE__/fundamentals/composition-vs-inheritance/">Composition vs. Inheritance</a> — Bridge is essentially "prefer composition" applied specifically to a two-dimensional variation problem.
- <a href="__BASE__/creational/abstract-factory/">Abstract Factory</a> — can be used to construct the correct `Message` + `DeliveryChannel` pairing without the caller needing to know concrete classes.
- <a href="__BASE__/behavioral/strategy/">Strategy</a> — structurally similar (composition over an interface), but Strategy varies one algorithm at a time rather than decoupling two independent hierarchies.
