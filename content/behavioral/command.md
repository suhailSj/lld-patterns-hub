---
title: "Command"
order: 3
summary: "Turn a request into a standalone object, so it can be queued, logged, undone, or executed later."
tags: ["Behavioral", "GoF", "document editor"]
useWhen: "You need undo/redo, request queuing/logging, or to decouple 'what to do' from 'when/how it runs.'"
---

## Problem statement

A text document editor needs undo/redo for actions like "insert text" and "delete text." If `TextDocument` just
mutates its own content directly, there's no record of *what happened* to reverse it.

## Core idea

Wrap every editing action in a `Command` object with `execute()` and `undo()` methods. Instead of the editor calling
`document.insert(...)` directly, it creates an `InsertTextCommand`, executes it, and pushes it onto a history stack.
Undo pops the last command and calls its `undo()`.

## Real-world analogy

A restaurant order ticket is a Command: the waiter (invoker) doesn't cook — they hand a ticket (the command object)
to the kitchen (receiver). The same ticket format lets orders be queued, reordered, or handed to any available chef,
and a cancelled order is just "don't execute this ticket" without the waiter needing to know how to un-cook a dish.

## Class / object design

```
      «interface»
       Command
    + execute()
    + undo()
           ▲
   ┌───────┼─────────┐
InsertTextCommand   DeleteTextCommand

TextDocument (the "receiver" — knows how to actually mutate content)

EditorHistory
  - stack: list[Command]
  + run(command)      ─▶ command.execute(); stack.append(command)
  + undo_last()        ─▶ stack.pop().undo()
```

## Python example

```python
from abc import ABC, abstractmethod

class TextDocument:
    """The receiver: knows how to actually mutate content."""

    def __init__(self):
        self.content = ""

    def insert(self, text: str, position: int) -> None:
        self.content = self.content[:position] + text + self.content[position:]

    def delete(self, position: int, length: int) -> str:
        removed = self.content[position:position + length]
        self.content = self.content[:position] + self.content[position + length:]
        return removed

class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...

class InsertTextCommand(Command):
    def __init__(self, document: TextDocument, text: str, position: int):
        self._document = document
        self._text = text
        self._position = position

    def execute(self) -> None:
        self._document.insert(self._text, self._position)

    def undo(self) -> None:
        self._document.delete(self._position, len(self._text))

class EditorHistory:
    """The invoker: runs commands and keeps a stack so they can be undone."""

    def __init__(self):
        self._history: list[Command] = []

    def run(self, command: Command) -> None:
        command.execute()
        self._history.append(command)

    def undo_last(self) -> None:
        if self._history:
            self._history.pop().undo()

# --- usage ---
doc = TextDocument()
history = EditorHistory()

history.run(InsertTextCommand(doc, "Hello, ", 0))
history.run(InsertTextCommand(doc, "world!", 7))
print(doc.content)   # "Hello, world!"

history.undo_last()
print(doc.content)   # "Hello, "
```

```java
class TextDocument {
    // The receiver: knows how to actually mutate content.
    private StringBuilder content = new StringBuilder();

    String getContent() { return content.toString(); }

    void insert(String text, int position) {
        content.insert(position, text);
    }

    String delete(int position, int length) {
        String removed = content.substring(position, position + length);
        content.delete(position, position + length);
        return removed;
    }
}

interface Command {
    void execute();
    void undo();
}

class InsertTextCommand implements Command {
    private final TextDocument document;
    private final String text;
    private final int position;

    InsertTextCommand(TextDocument document, String text, int position) {
        this.document = document;
        this.text = text;
        this.position = position;
    }

    public void execute() { document.insert(text, position); }
    public void undo() { document.delete(position, text.length()); }
}

// The invoker: runs commands and keeps a stack so they can be undone.
class EditorHistory {
    private final java.util.Deque<Command> history = new java.util.ArrayDeque<>();

    void run(Command command) {
        command.execute();
        history.push(command);
    }

    void undoLast() {
        if (!history.isEmpty()) {
            history.pop().undo();
        }
    }
}

// --- usage ---
// TextDocument doc = new TextDocument();
// EditorHistory history = new EditorHistory();
//
// history.run(new InsertTextCommand(doc, "Hello, ", 0));
// history.run(new InsertTextCommand(doc, "world!", 7));
// System.out.println(doc.getContent());  // "Hello, world!"
//
// history.undoLast();
// System.out.println(doc.getContent());  // "Hello, "
```

**Language notes:** Python can often skip the formal `Command` class for simple, non-undoable actions by passing
around bound functions/closures (functions are first-class), but undo/redo specifically needs state (what to
reverse), which is exactly what a full command object captures cleanly in both languages. Java's `Deque` as a stack
(`push`/`pop`) mirrors Python's list used as a stack (`append`/`pop`).

## How to identify when to use it

You need any of: undo/redo, a queue of pending actions (job queues, task schedulers), an audit log of "what
happened" independent of when it ran, or the ability to hand off "what to do" to code that shouldn't know how to do
it (a UI button that triggers a command without knowing its implementation).

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Decouples the invoker (a button, a history stack) from the receiver (the actual logic)</li>
<li>Naturally supports undo/redo, queuing, and logging, since a command is just an object you can store</li>
<li>New actions are added as new command classes, without touching the invoker</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>One class per action can feel like a lot of boilerplate for simple, non-undoable operations</li>
<li>Implementing correct <code>undo()</code> for complex, stateful operations can be genuinely hard (what if something else changed the document in between?)</li>
</ul>
</div>
</div>

## When to use

- Undo/redo, transaction logs, task queues, or macro recording (replaying a sequence of user actions).

## When to avoid

- Simple, one-off actions with no need for undo, queuing, or logging don't need to be wrapped in command objects —
  a direct method call is clearer.

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

If asked to design undo/redo for anything (a text editor, a drawing app, a form wizard), Command is almost always the
expected answer — pair it with a history stack, exactly as shown above.

</div>

## Interview talking points

- Emphasize the three roles by name: invoker (triggers execution), command (encapsulates the request), receiver
  (does the real work) — interviewers often ask you to point out which class plays which role.
- Mention that Command objects are naturally serializable, which is why they show up in task queues and
  distributed job systems, not just UI undo stacks.

## Related patterns

- <a href="__BASE__/behavioral/observer/">Observer</a> — commands are sometimes dispatched in response to an observed event.
- <a href="__BASE__/behavioral/strategy/">Strategy</a> — both wrap behavior in an object, but Strategy is chosen once per operation to vary an algorithm; Command represents a single discrete action, often stored for later/undo.
- <a href="__BASE__/behavioral/chain-of-responsibility/">Chain of Responsibility</a> — can be combined with Command to route a command to whichever handler is able to process it.
