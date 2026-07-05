---
title: "Liskov Substitution Principle"
order: 3
summary: "Subtypes must be substitutable for their base type without breaking the correctness of the program."
tags: ["SOLID", "inheritance", "document editor"]
useWhen: "A subclass overrides a method to throw, no-op, or narrow a contract the base type promised callers."
---

## Intent / definition

**Liskov Substitution Principle (LSP):** if `S` is a subtype of `T`, objects of type `T` should be replaceable with
objects of type `S` **without altering the correctness of the program**. In plain terms: a subclass must honor every
promise (precondition, postcondition, invariant) that callers rely on from the base class — it can do *more*, but
never *less* or *differently in a breaking way*.

## Problem statement

A document editor has a `Document` base type with `open()`, `edit(text)`, and `save()`. Most documents are regular
files. But the app also needs to represent **read-only documents** — say, documents shared with "view only"
permission, or documents opened from a signed PDF.

## Why the naive design fails

<div class="callout pitfall">
<div class="callout-title">🚫 A subtype that breaks its parent's contract</div>

The easy path is `class ReadOnlyDocument(Document)` that overrides `edit()` to raise an exception ("cannot edit a
read-only document"). This compiles and looks reasonable — until some code does:

```
for doc in documents:
    doc.edit(new_text)
    doc.save()
```

This loop worked for every `Document` until a `ReadOnlyDocument` entered the list, at which point it crashes. The
caller did nothing wrong — it was told it had a `Document`, and every `Document` was supposed to support `edit()`.
The subtype silently broke a promise the base type made.

</div>

This design:

- forces every caller of `Document` to know about — and defensively check for — the read-only special case, which
  defeats the purpose of polymorphism;
- turns compile-time-looking safety (it implements the interface!) into a runtime landmine;
- tends to spread: once one method throws unexpectedly, callers start wrapping every call in `try/except`, and the
  abstraction stops being trustworthy.

## Solution overview

Don't force "editable" onto something that isn't. Split the contract: a narrower `ReadableDocument` (open, read) that
both types honor, and an `EditableDocument` (extends `ReadableDocument`, adds `edit`/`save`) that only genuinely
editable documents implement. `ReadOnlyDocument` implements just `ReadableDocument` — it never claims a capability
it can't deliver, so no caller can misuse it.

## Class / object design

```
        «interface»                    «interface»
       ReadableDocument  ◀───extends─── EditableDocument
       + open()                          + edit(text)
       + read(): str                     + save()
             ▲                                  ▲
     ┌───────┴───────┐                  ┌───────┘
ReadOnlyDocument   PdfViewerDocument   TextDocument (implements both)
```

Code that only needs to *read* documents (a search indexer, a preview pane) depends on `ReadableDocument` and can
accept both kinds. Code that needs to *edit* depends on `EditableDocument` and the type system guarantees it only
ever receives documents that truly support editing.

## Step-by-step explanation

1. Notice the LSP violation: a subclass overrides a method to throw/no-op instead of fulfilling it.
2. Identify the actual, honest capability split (readable vs. editable).
3. Introduce a narrower base interface (`ReadableDocument`) containing only what *every* subtype can genuinely do.
4. Extend it with `EditableDocument` for the capability that not all subtypes share.
5. Have each concrete class implement only the interface(s) it can honestly fulfill.
6. Update callers to depend on the narrowest interface that satisfies their needs.

## Python example

```python
from abc import ABC, abstractmethod

class ReadableDocument(ABC):
    """Every document, read-only or not, can do this."""

    @abstractmethod
    def open(self) -> None: ...

    @abstractmethod
    def read(self) -> str: ...

class EditableDocument(ReadableDocument):
    """Only documents that genuinely support mutation implement this."""

    @abstractmethod
    def edit(self, text: str) -> None: ...

    @abstractmethod
    def save(self) -> None: ...

class TextDocument(EditableDocument):
    def __init__(self):
        self._content = ""

    def open(self) -> None:
        print("Opening text document")

    def read(self) -> str:
        return self._content

    def edit(self, text: str) -> None:
        self._content += text

    def save(self) -> None:
        print(f"Saving: {self._content!r}")

class ReadOnlyDocument(ReadableDocument):
    """Honest about its capabilities: it never claims to support edit()."""

    def __init__(self, content: str):
        self._content = content

    def open(self) -> None:
        print("Opening read-only document")

    def read(self) -> str:
        return self._content

def print_all(docs: list[ReadableDocument]) -> None:
    # Safe for ANY ReadableDocument — no capability is assumed beyond what's declared.
    for doc in docs:
        doc.open()
        print(doc.read())

def edit_all(docs: list[EditableDocument], text: str) -> None:
    # Only ever called with documents that truly support editing — no runtime surprises.
    for doc in docs:
        doc.edit(text)
        doc.save()

# --- usage ---
mixed_docs: list[ReadableDocument] = [TextDocument(), ReadOnlyDocument("Q3 report (locked)")]
print_all(mixed_docs)          # works uniformly for both
edit_all([TextDocument()], "Hello")  # only compiles/runs against editable documents
```

```java
interface ReadableDocument {
    // Every document, read-only or not, can do this.
    void open();
    String read();
}

interface EditableDocument extends ReadableDocument {
    // Only documents that genuinely support mutation implement this.
    void edit(String text);
    void save();
}

class TextDocument implements EditableDocument {
    private final StringBuilder content = new StringBuilder();

    public void open() { System.out.println("Opening text document"); }
    public String read() { return content.toString(); }
    public void edit(String text) { content.append(text); }
    public void save() { System.out.println("Saving: " + content); }
}

// Honest about its capabilities: it never claims to support edit().
class ReadOnlyDocument implements ReadableDocument {
    private final String content;
    public ReadOnlyDocument(String content) { this.content = content; }

    public void open() { System.out.println("Opening read-only document"); }
    public String read() { return content; }
}

class DocumentTools {
    // Safe for ANY ReadableDocument — no capability is assumed beyond what's declared.
    static void printAll(java.util.List<ReadableDocument> docs) {
        for (ReadableDocument doc : docs) {
            doc.open();
            System.out.println(doc.read());
        }
    }

    // Only ever called with documents that truly support editing — no runtime surprises.
    static void editAll(java.util.List<EditableDocument> docs, String text) {
        for (EditableDocument doc : docs) {
            doc.edit(text);
            doc.save();
        }
    }
}

// --- usage ---
// List<ReadableDocument> mixedDocs = List.of(new TextDocument(), new ReadOnlyDocument("Q3 report (locked)"));
// DocumentTools.printAll(mixedDocs);
// DocumentTools.editAll(List.of(new TextDocument()), "Hello");
```

**Language notes:** Java's compiler enforces that `edit_all`/`editAll` can only be called with objects that actually
implement `EditableDocument` — passing a `ReadOnlyDocument` is a compile error, not a runtime one. Python's typing
is duck-typed and (without a static checker like `mypy`) would only fail at runtime, so LSP violations are easier to
miss in Python until they're exercised by a test or in production; running `mypy` against ABC-based hierarchies
recovers most of that same safety.

## Real-world example

The classic textbook example is `Rectangle`/`Square`: making `Square extends Rectangle` and overriding
`setWidth`/`setHeight` to keep both sides equal breaks any code that sets width and height independently and expects
`area()` to reflect exactly those two calls. The document editor example above is the same shape of problem in a
domain you'll actually see in interviews and real systems.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Callers can trust an interface completely — no hidden exceptions for "some" instances</li>
<li>Removes defensive <code>try/except</code>/<code>instanceof</code> checks scattered through client code</li>
<li>Encourages honest, minimal interfaces instead of one bloated base class</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Splitting a hierarchy (as above) means more interfaces to design up front</li>
<li>Retrofitting LSP onto an existing violating hierarchy can be a large refactor</li>
</ul>
</div>
</div>

## When to use

- Any time you're about to override a method to throw `NotImplementedError`/`UnsupportedOperationException`, no-op
  it, or silently narrow what it accepts/returns.
- When reviewing a hierarchy where callers need `instanceof`/`isinstance` checks before calling a method — that's a
  strong signal the base type's contract isn't actually honored by every subtype.

## When to avoid

- LSP doesn't mean subtypes must behave *identically* — they can extend behavior (stronger postconditions, weaker
  preconditions). It only forbids subtypes that violate what callers were promised.

<div class="callout pitfall">
<div class="callout-title">🚫 Common misuse</div>

Don't "fix" an LSP violation by adding <code>isinstance(doc, EditableDocument)</code> checks everywhere <code>edit()</code>
is called — that reintroduces the coupling LSP is meant to remove. Fix the hierarchy instead, as shown above.

</div>

## Interview talking points

- Recognize LSP violations by the tell: an overridden method that throws, silently does nothing, or changes what
  exceptions/inputs are acceptable versus the base class.
- Reference the "design by contract" framing: preconditions can't be strengthened and postconditions can't be
  weakened in a subtype.
- Connect it back to ISP: LSP violations are frequently *fixed* by segregating a fat interface into narrower ones
  (as we did with `Readable`/`EditableDocument`).

## Related patterns

- <a href="__BASE__/solid/isp/">Interface Segregation Principle</a> — the usual fix for an LSP violation is splitting the offending interface, exactly as ISP recommends.
- <a href="__BASE__/fundamentals/interfaces-vs-abstract-classes/">Interfaces vs. Abstract Classes</a> — understanding contract inheritance is essential to spotting LSP violations early.
- <a href="__BASE__/behavioral/template-method/">Template Method</a> — relies heavily on subclasses honoring the base algorithm's contract; an LSP-violating override breaks it the same way.
