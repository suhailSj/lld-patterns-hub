---
title: "Template Method"
order: 6
summary: "Define the skeleton of an algorithm in a base class, and let subclasses override specific steps without changing the overall structure."
tags: ["Behavioral", "GoF", "report generation"]
useWhen: "Several variants of an algorithm share the same overall steps but differ in how one or two specific steps are done."
---

## Problem statement

Generating a report always follows the same three steps — fetch data, format it, export it — but a PDF report and a
CSV report format and export very differently. Duplicating the fetch step in both `PdfReport` and `CsvReport`
classes means any future change to how data is fetched has to be made twice (and will eventually drift out of sync).

## Core idea

Put the fixed skeleton (fetch → format → export, in that order) in a base class method that is **not** overridden.
That method calls a small number of `abstract`/overridable "step" methods that subclasses *do* override. The overall
sequence is guaranteed identical across every report type; only the individual steps vary.

## Real-world analogy

A recipe template: "preheat, mix ingredients, bake, cool" is the fixed structure for baking anything. A chocolate
cake recipe and a bread recipe both follow that structure, but "mix ingredients" means something completely
different for each. The recipe card's *structure* doesn't change — only the details of each step.

## Class / object design

```
ReportGenerator (abstract)
  + generate()  ◀── the template method: fixed sequence, never overridden
       1. fetch_data()      (abstract — subclasses must implement)
       2. format(data)      (abstract — subclasses must implement)
       3. export(formatted) (abstract — subclasses must implement)
             ▲
   ┌─────────┴─────────┐
PdfReportGenerator   CsvReportGenerator
(each implements the 3 steps their own way)
```

## Step-by-step explanation

1. Identify the fixed sequence shared by every variant (fetch → format → export).
2. Put that sequence in one concrete method (`generate()`) on the base class — this is the "template method," and it
   should not be overridden.
3. Extract each varying step into its own `abstract` method.
4. Each subclass implements only the steps that differ for it; the sequence itself is guaranteed by the base class.

## Python example

```python
from abc import ABC, abstractmethod

class ReportGenerator(ABC):
    """The template method: fixes the sequence, delegates the steps."""

    def generate(self) -> str:
        data = self.fetch_data()
        formatted = self.format(data)
        return self.export(formatted)

    @abstractmethod
    def fetch_data(self) -> list[dict]: ...

    @abstractmethod
    def format(self, data: list[dict]) -> str: ...

    @abstractmethod
    def export(self, formatted: str) -> str: ...

class SalesDataMixin:
    """Shared step reused by multiple report types — fetching never needs duplicating."""

    def fetch_data(self) -> list[dict]:
        return [{"item": "Keyboard", "revenue": 890.0}, {"item": "Mouse", "revenue": 250.0}]

class CsvReportGenerator(SalesDataMixin, ReportGenerator):
    def format(self, data: list[dict]) -> str:
        rows = [f"{row['item']},{row['revenue']}" for row in data]
        return "item,revenue\n" + "\n".join(rows)

    def export(self, formatted: str) -> str:
        return f"report.csv written:\n{formatted}"

class PdfReportGenerator(SalesDataMixin, ReportGenerator):
    def format(self, data: list[dict]) -> str:
        lines = [f"{row['item']}: ${row['revenue']:.2f}" for row in data]
        return "\n".join(lines)

    def export(self, formatted: str) -> str:
        return f"report.pdf rendered with content:\n{formatted}"

# --- usage: same generate() sequence, different steps underneath ---
print(CsvReportGenerator().generate())
print(PdfReportGenerator().generate())
```

```java
import java.util.List;
import java.util.Map;

abstract class ReportGenerator {
    // The template method: fixes the sequence, delegates the steps. Declared `final` so it can't be overridden.
    public final String generate() {
        List<Map<String, Object>> data = fetchData();
        String formatted = format(data);
        return export(formatted);
    }

    protected abstract List<Map<String, Object>> fetchData();
    protected abstract String format(List<Map<String, Object>> data);
    protected abstract String export(String formatted);
}

// Shared step reused by multiple report types — fetching never needs duplicating.
abstract class SalesReportGenerator extends ReportGenerator {
    protected List<Map<String, Object>> fetchData() {
        return List.of(
            Map.of("item", "Keyboard", "revenue", 890.0),
            Map.of("item", "Mouse", "revenue", 250.0)
        );
    }
}

class CsvReportGenerator extends SalesReportGenerator {
    protected String format(List<Map<String, Object>> data) {
        StringBuilder sb = new StringBuilder("item,revenue\n");
        for (var row : data) sb.append(row.get("item")).append(",").append(row.get("revenue")).append("\n");
        return sb.toString();
    }
    protected String export(String formatted) {
        return "report.csv written:\n" + formatted;
    }
}

class PdfReportGenerator extends SalesReportGenerator {
    protected String format(List<Map<String, Object>> data) {
        StringBuilder sb = new StringBuilder();
        for (var row : data) sb.append(row.get("item")).append(": $").append(row.get("revenue")).append("\n");
        return sb.toString();
    }
    protected String export(String formatted) {
        return "report.pdf rendered with content:\n" + formatted;
    }
}

// --- usage: same generate() sequence, different steps underneath ---
// System.out.println(new CsvReportGenerator().generate());
// System.out.println(new PdfReportGenerator().generate());
```

**Language notes:** Java's `final` modifier on `generate()` *enforces* that subclasses cannot override the sequence
itself — a compile error if attempted. Python has no equivalent enforcement (any method can be overridden), so the
"don't override this" rule is a documented convention rather than a compiler guarantee; some Python codebases signal
intent with a leading underscore on the step methods or a docstring note instead.

## How to identify when to use it

Two or more classes have near-identical method bodies except for one or two internal steps that differ. If you find
yourself copy-pasting a method and changing three lines in the middle, that's the signal to extract a template
method.

<div class="callout pitfall">
<div class="callout-title">🚫 Common misuse</div>

Don't use Template Method when the *steps themselves* need to vary independently of one another and be recombined
freely — that's a sign you actually want composition (<a href="__BASE__/behavioral/strategy/">Strategy</a>
objects passed in) rather than an inheritance-based template, since inheritance fixes the combination of steps at
compile time.

</div>

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Shared sequence lives in exactly one place — no duplicated/drifting boilerplate across variants</li>
<li>Subclasses only implement what's actually different about them</li>
<li>The base class enforces the algorithm's overall structure, so a subclass can't accidentally skip a step</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Relies on inheritance, which is more rigid than composition — see <a href="__BASE__/fundamentals/composition-vs-inheritance/">Composition vs. Inheritance</a></li>
<li>Can be harder to test steps in isolation compared to standalone Strategy objects</li>
</ul>
</div>
</div>

## When to use

- Multiple classes implement the same overall algorithm with only a few steps genuinely differing between them.

## When to avoid

- If the varying steps need to be swapped independently at runtime (not fixed per subclass), prefer Strategy objects
  passed into a single class over an inheritance hierarchy.

## Interview talking points

- Name the "Hollywood Principle" if it comes up: "don't call us, we'll call you" — the base class's template method
  calls into the subclass's steps, not the other way around.
- Be ready to discuss why Template Method uses inheritance while Strategy uses composition for a similar-sounding
  goal — it's a common interview follow-up.

## Related patterns

- <a href="__BASE__/behavioral/strategy/">Strategy</a> — the composition-based alternative when steps need to vary independently of a fixed class hierarchy.
- <a href="__BASE__/fundamentals/composition-vs-inheritance/">Composition vs. Inheritance</a> — Template Method is one of the few patterns that leans on inheritance deliberately; know when that tradeoff is worth it.
- <a href="__BASE__/solid/lsp/">Liskov Substitution Principle</a> — subclasses must honor the base template's contract, or the whole pattern breaks.
