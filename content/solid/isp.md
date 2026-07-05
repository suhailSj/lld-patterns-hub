---
title: "Interface Segregation Principle"
order: 4
summary: "No client should be forced to depend on methods it does not use — prefer several small, focused interfaces over one large one."
tags: ["SOLID", "interfaces", "plugin systems"]
useWhen: "A class implements an interface but stubs out or throws on half of its methods."
---

## Intent / definition

**Interface Segregation Principle (ISP):** clients should not be forced to depend on methods they don't use. Instead
of one large, general-purpose interface, prefer several small, role-specific ones — a class implements only the
interfaces that match what it can actually do.

## Problem statement

You're building drivers for office printers. Some are high-end multi-function devices (print, scan, fax); others are
simple, cheap printers that can only print.

## Why the naive design fails

<div class="callout pitfall">
<div class="callout-title">🚫 One fat interface forces fake implementations</div>

A single `MultiFunctionDevice` interface with `print()`, `scan()`, and `fax()` looks convenient — until
`BasicPrinter`, which can only print, is forced to implement `scan()` and `fax()` too. Those methods end up throwing
`NotImplementedError`/`UnsupportedOperationException`, or silently doing nothing. Either way, any code that receives
a `MultiFunctionDevice` can no longer trust that calling `scan()` actually works — which is precisely the problem
the <a href="__BASE__/solid/lsp/">Liskov Substitution Principle</a> warns about. ISP is usually the fix.

</div>

This design:

- forces simple implementations to carry dead or exception-throwing code for capabilities they don't have;
- couples unrelated capabilities together, so a change to the fax spec risks breaking the printer-only class's build;
- makes the interface lie — "implements `MultiFunctionDevice`" no longer reliably means "can scan and fax."

## Solution overview

Split the fat interface into focused, single-capability ones: `Printer`, `Scanner`, `Fax`. `BasicPrinter` implements
only `Printer`. `OfficeMultiFunctionDevice` implements all three (via composition or multiple interface
implementation). Client code depends on the narrowest interface it actually needs — code that only prints accepts
any `Printer`, whether or not it happens to also scan.

## Class / object design

```
 «interface»      «interface»     «interface»
   Printer          Scanner          Fax
 + print()        + scan()        + fax()
      ▲                ▲               ▲
      │                │               │
 BasicPrinter    OfficeMultiFunctionDevice (implements all three)
 (Printer only)
```

## Step-by-step explanation

1. Look at a fat interface's implementers for methods that throw, no-op, or return a "not supported" sentinel.
2. Group methods by which implementers actually need them together — that grouping becomes a new, smaller interface.
3. Split the fat interface into those smaller ones.
4. Have each concrete class implement only the interfaces it can genuinely fulfill.
5. Update client code signatures to accept the narrowest interface that satisfies the function's needs.

## Python example

```python
from abc import ABC, abstractmethod

class Printer(ABC):
    @abstractmethod
    def print_document(self, content: str) -> None: ...

class Scanner(ABC):
    @abstractmethod
    def scan(self) -> str: ...

class Fax(ABC):
    @abstractmethod
    def send_fax(self, content: str, number: str) -> None: ...

class BasicPrinter(Printer):
    """Only ever implements what it can actually do."""

    def print_document(self, content: str) -> None:
        print(f"Printing: {content}")

class OfficeMultiFunctionDevice(Printer, Scanner, Fax):
    def print_document(self, content: str) -> None:
        print(f"Printing: {content}")

    def scan(self) -> str:
        return "scanned-document-bytes"

    def send_fax(self, content: str, number: str) -> None:
        print(f"Faxing to {number}: {content}")

def print_report(printer: Printer, content: str) -> None:
    # Works with ANY Printer — a $50 desk printer or a $3000 multi-function device.
    printer.print_document(content)

# --- usage ---
print_report(BasicPrinter(), "Q3 summary")
print_report(OfficeMultiFunctionDevice(), "Q3 summary")
```

```java
interface Printer {
    void printDocument(String content);
}

interface Scanner {
    String scan();
}

interface Fax {
    void sendFax(String content, String number);
}

// Only ever implements what it can actually do.
class BasicPrinter implements Printer {
    public void printDocument(String content) {
        System.out.println("Printing: " + content);
    }
}

class OfficeMultiFunctionDevice implements Printer, Scanner, Fax {
    public void printDocument(String content) {
        System.out.println("Printing: " + content);
    }
    public String scan() {
        return "scanned-document-bytes";
    }
    public void sendFax(String content, String number) {
        System.out.println("Faxing to " + number + ": " + content);
    }
}

class PrintTools {
    // Works with ANY Printer — a $50 desk printer or a $3000 multi-function device.
    static void printReport(Printer printer, String content) {
        printer.printDocument(content);
    }
}

// --- usage ---
// PrintTools.printReport(new BasicPrinter(), "Q3 summary");
// PrintTools.printReport(new OfficeMultiFunctionDevice(), "Q3 summary");
```

**Language notes:** Java's `class X implements A, B, C` makes multiple-interface implementation explicit and
compiler-checked. Python's multiple inheritance (`class OfficeMultiFunctionDevice(Printer, Scanner, Fax)`) achieves
the same thing structurally, though Python won't stop you from skipping `ABC` altogether and relying on duck typing —
the discipline of "small, focused roles" is what ISP actually asks for, independent of the mechanism.

## Real-world example

`java.util.List` deliberately implements several narrow interfaces (`Collection`, `Iterable`) rather than one giant
"do everything" interface, so code that only needs to iterate can accept `Iterable<T>` without requiring the caller
to hand over a full mutable `List`. Similarly, plugin systems (browser extensions, IDE plugins) typically expose many
small extension points (`CommandProvider`, `SettingsPanel`, `StatusBarItem`) instead of one interface every plugin
must fully implement.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Implementers only write code for capabilities they truly support</li>
<li>Client code can depend on the exact capability it needs, improving testability (mock just <code>Printer</code>, not a whole device)</li>
<li>Reduces the blast radius of interface changes — a `Fax` change can't ripple into `BasicPrinter`</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>More interfaces to define and keep track of</li>
<li>Can fragment a genuinely cohesive capability if split too aggressively</li>
</ul>
</div>
</div>

## When to use

- An interface has grown multiple unrelated methods and not every implementer needs all of them.
- You see empty method bodies, "not supported" exceptions, or `TODO` stubs in implementers of a shared interface.

## When to avoid

- Don't split a genuinely cohesive interface (e.g. `Iterator` with `has_next()`/`next()`) just to have more, smaller
  interfaces — that fragments a single real responsibility instead of clarifying it.

## Interview talking points

- ISP and SRP are closely related but operate at different levels: SRP is about a *class's* reasons to change; ISP
  is about an *interface's* reasons to change for its various clients.
- A good tell in code review: any implementer with a method body that throws or is empty is a strong ISP violation
  signal.
- Mention the fix pattern: identify the natural capability groups among implementers, and let those groups become
  interfaces.

## Related patterns

- <a href="__BASE__/solid/lsp/">Liskov Substitution Principle</a> — fat interfaces are one of the most common root causes of LSP violations; segregating them is often the direct fix.
- <a href="__BASE__/solid/dip/">Dependency Inversion Principle</a> — small, role-specific interfaces are exactly what high-level modules should depend on.
- <a href="__BASE__/structural/adapter/">Adapter</a> — sometimes used to bridge a fat legacy interface down to the small one a new client actually needs.
