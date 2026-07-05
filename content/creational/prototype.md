---
title: "Prototype"
order: 5
summary: "Create new objects by copying an existing, pre-configured instance instead of building one from scratch."
tags: ["Creational", "GoF", "invoice templates"]
useWhen: "Creating an object from scratch is expensive, or you need many variations of an already-configured object."
---

## What problem it solves

An invoicing system offers several pre-designed invoice templates (Standard, Detailed-Line-Items, Minimal) that are
expensive to assemble — each loads default line items, tax rules, branding assets, and layout metadata, possibly from
a database or a remote template service. Building a fresh invoice from scratch every time a user picks a template
means repeating that expensive setup. Prototype instead keeps one fully-configured instance of each template around
and creates new invoices by **cloning** it.

## When to use

- Constructing an object from scratch is expensive (I/O, computation, or many small configuration steps) but you
  already have an equivalent, fully-configured instance sitting around.
- You need many slightly different variations of a base configuration (a "starter" object that gets tweaked per
  copy).
- You want to add new "kinds" of pre-configured object at runtime, by registering new prototypes, without touching
  a factory's source code (a registry of prototypes is itself a lightweight alternative to Abstract Factory).

## When not to use

- If construction is already cheap, cloning adds complexity for no real benefit — just construct a new instance.
- Be careful with **deep vs. shallow copies**: naive shallow cloning can leave two "independent" objects secretly
  sharing the same mutable nested list/dict, causing one invoice's edits to bleed into another's.

<div class="callout pitfall">
<div class="callout-title">🚫 Shallow copy surprises</div>

If <code>Invoice.line_items</code> is a list and you clone with a shallow copy, both the original template and the
new invoice point at the <em>same</em> list object. Editing the new invoice's line items would silently mutate the
shared template. Always deep-copy mutable nested state when implementing Prototype.

</div>

## Class / object design

```
      «interface»
      InvoiceTemplate
    + clone() -> InvoiceTemplate
            ▲
   ┌────────┼──────────┐
StandardInvoice   DetailedInvoice   MinimalInvoice
 (pre-configured prototypes, registered once)

TemplateRegistry
  + register(name, prototype)
  + create(name) -> InvoiceTemplate   ◀── returns prototype.clone(), not a fresh build
```

## Python example

Python's standard library ships `copy.deepcopy`, which makes Prototype nearly free to implement correctly.

```python
import copy
from dataclasses import dataclass, field

@dataclass
class Invoice:
    template_name: str
    line_items: list[str] = field(default_factory=list)
    tax_rate: float = 0.0
    footer_note: str = ""

    def clone(self) -> "Invoice":
        # Deep copy: mutable fields (line_items) must not be shared with the prototype.
        return copy.deepcopy(self)

class TemplateRegistry:
    """Holds one expensive, fully-configured prototype per template name."""

    def __init__(self):
        self._prototypes: dict[str, Invoice] = {}

    def register(self, name: str, prototype: Invoice) -> None:
        self._prototypes[name] = prototype

    def create(self, name: str) -> Invoice:
        prototype = self._prototypes.get(name)
        if prototype is None:
            raise ValueError(f"No template registered as '{name}'")
        return prototype.clone()  # cheap: copy, not rebuild

# --- usage: set up prototypes once, at startup (expensive step happens here) ---
registry = TemplateRegistry()
registry.register("standard", Invoice(
    template_name="standard",
    line_items=["Subtotal", "Tax", "Total"],
    tax_rate=0.08,
    footer_note="Thank you for your business.",
))

# --- usage: every new invoice is a cheap clone, then customized ---
invoice_1 = registry.create("standard")
invoice_1.line_items.append("Rush shipping fee")

invoice_2 = registry.create("standard")
assert "Rush shipping fee" not in invoice_2.line_items  # deep copy prevented cross-contamination
```

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Invoice implements Cloneable {
    String templateName;
    List<String> lineItems;
    double taxRate;
    String footerNote;

    Invoice(String templateName, List<String> lineItems, double taxRate, String footerNote) {
        this.templateName = templateName;
        this.lineItems = lineItems;
        this.taxRate = taxRate;
        this.footerNote = footerNote;
    }

    @Override
    public Invoice clone() {
        // Deep copy: mutable fields (lineItems) must not be shared with the prototype.
        return new Invoice(templateName, new ArrayList<>(lineItems), taxRate, footerNote);
    }
}

// Holds one expensive, fully-configured prototype per template name.
class TemplateRegistry {
    private final Map<String, Invoice> prototypes = new HashMap<>();

    void register(String name, Invoice prototype) {
        prototypes.put(name, prototype);
    }

    Invoice create(String name) {
        Invoice prototype = prototypes.get(name);
        if (prototype == null) throw new IllegalArgumentException("No template registered as '" + name + "'");
        return prototype.clone(); // cheap: copy, not rebuild
    }
}

// --- usage: set up prototypes once, at startup (expensive step happens here) ---
// TemplateRegistry registry = new TemplateRegistry();
// registry.register("standard", new Invoice("standard",
//     List.of("Subtotal", "Tax", "Total"), 0.08, "Thank you for your business."));
//
// --- usage: every new invoice is a cheap clone, then customized ---
// Invoice invoice1 = registry.create("standard");
// invoice1.lineItems.add("Rush shipping fee");
//
// Invoice invoice2 = registry.create("standard");
// assert !invoice2.lineItems.contains("Rush shipping fee"); // deep copy prevented cross-contamination
```

**Language notes:** Java has a built-in (if famously awkward) `Cloneable`/`clone()` mechanism, but most real Java
codebases skip it in favor of an explicit copy constructor or a manual `clone()` override like the one above, exactly
to sidestep `Cloneable`'s shallow-copy-by-default pitfalls. Python's `copy.deepcopy` handles nested mutable
structures recursively and correctly by default, which is why Prototype tends to be less ceremony in Python.

## Real-world example

IDE "project templates" and design-tool "starting layouts" (a new Figma file from a template, a new repository from
a GitHub template repo) are Prototype in the wild: an expensive-to-assemble starting point is cloned rather than
rebuilt from scratch for every new instance.

## Advantages and tradeoffs

<div class="pros-cons">
<div>
<h4>✅ Advantages</h4>
<ul>
<li>Avoids repeating expensive construction logic for every new instance</li>
<li>New "kinds" of object can be added at runtime by registering a new prototype — no factory code changes needed</li>
<li>Captures a fully-configured state (including runtime-computed defaults) that a constructor alone might not easily reproduce</li>
</ul>
</div>
<div>
<h4>❌ Tradeoffs</h4>
<ul>
<li>Deep-copy correctness is easy to get wrong for complex object graphs (circular references, external resource handles)</li>
<li>Cloning an object doesn't re-run its original construction/validation logic, which can hide bugs if the prototype itself is ever misconfigured</li>
</ul>
</div>
</div>

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

If you propose Prototype, immediately mention deep vs. shallow copy — interviewers use this pattern specifically to
probe whether you understand that distinction.

</div>

## Related patterns

- <a href="__BASE__/creational/builder/">Builder</a> — an alternative when the "expensive" part is *assembly logic* rather than the raw cost of allocation; Prototype instead reuses an already-assembled instance.
- <a href="__BASE__/creational/singleton/">Singleton</a> — the opposite instinct: Singleton insists on exactly one instance, Prototype exists specifically to make new instances cheap.
- <a href="__BASE__/fundamentals/immutability/">Immutability</a> — an immutable prototype removes the shallow-copy risk entirely, since there's nothing mutable to accidentally share.
