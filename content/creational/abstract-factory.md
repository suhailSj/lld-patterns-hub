---
title: "Abstract Factory"
order: 3
summary: "Provide an interface for creating families of related objects, without specifying their concrete classes."
tags: ["Creational", "GoF", "UI theming"]
useWhen: "Objects must be created in matching sets, and mixing objects from different sets would break the app."
---

## What problem it solves

A UI toolkit supports light and dark themes. Each theme needs a matching `Button` and `Checkbox` — a dark-theme
button rendered next to a light-theme checkbox would look broken. Abstract Factory guarantees that whichever theme
you pick, every widget you create from that point on belongs to the same, consistent family.

## When to use

- You need to create several *related* objects that must be used together, and the app has more than one such
  "family" (light/dark theme, per-region payment provider set, per-database driver set).
- You want to swap an entire family of objects (e.g. switch the whole UI theme) by changing one line — which
  concrete factory is used — rather than touching every place a widget is created.

## When not to use

- If you only ever create one kind of object (not a *family* of related ones), a plain <a href="__BASE__/creational/factory-method/">Factory Method</a> is simpler and sufficient.
- Adding a new product to every family (e.g. adding `Slider` to both Light and Dark) means touching every concrete
  factory — Abstract Factory trades "easy to add a new family" for "harder to add a new product type."

## Class / object design

```
        «interface»                         «interface»          «interface»
        UIFactory                             Button              Checkbox
  + create_button(): Button          ▲                     ▲
  + create_checkbox(): Checkbox      │                     │
         ▲                    LightButton/DarkButton  LightCheckbox/DarkCheckbox
   ┌─────┴──────┐
LightUIFactory  DarkUIFactory   ◀── each produces a matching, consistent set
```

## Python example

```python
from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self) -> str: ...

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str: ...

class LightButton(Button):
    def render(self) -> str:
        return "[ Light Button ]"

class LightCheckbox(Checkbox):
    def render(self) -> str:
        return "[ ] Light Checkbox"

class DarkButton(Button):
    def render(self) -> str:
        return "[ Dark Button ]"

class DarkCheckbox(Checkbox):
    def render(self) -> str:
        return "[x] Dark Checkbox"

class UIFactory(ABC):
    """Guarantees every product it returns belongs to the same visual family."""

    @abstractmethod
    def create_button(self) -> Button: ...

    @abstractmethod
    def create_checkbox(self) -> Checkbox: ...

class LightUIFactory(UIFactory):
    def create_button(self) -> Button:
        return LightButton()

    def create_checkbox(self) -> Checkbox:
        return LightCheckbox()

class DarkUIFactory(UIFactory):
    def create_button(self) -> Button:
        return DarkButton()

    def create_checkbox(self) -> Checkbox:
        return DarkCheckbox()

def render_settings_panel(factory: UIFactory) -> None:
    # This function never mentions Light/Dark by name — swap the factory, swap the theme.
    print(factory.create_button().render())
    print(factory.create_checkbox().render())

# --- usage ---
user_prefers_dark_mode = True
factory: UIFactory = DarkUIFactory() if user_prefers_dark_mode else LightUIFactory()
render_settings_panel(factory)
```

```java
interface Button {
    String render();
}

interface Checkbox {
    String render();
}

class LightButton implements Button {
    public String render() { return "[ Light Button ]"; }
}

class LightCheckbox implements Checkbox {
    public String render() { return "[ ] Light Checkbox"; }
}

class DarkButton implements Button {
    public String render() { return "[ Dark Button ]"; }
}

class DarkCheckbox implements Checkbox {
    public String render() { return "[x] Dark Checkbox"; }
}

// Guarantees every product it returns belongs to the same visual family.
interface UIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

class LightUIFactory implements UIFactory {
    public Button createButton() { return new LightButton(); }
    public Checkbox createCheckbox() { return new LightCheckbox(); }
}

class DarkUIFactory implements UIFactory {
    public Button createButton() { return new DarkButton(); }
    public Checkbox createCheckbox() { return new DarkCheckbox(); }
}

class SettingsPanel {
    // This method never mentions Light/Dark by name — swap the factory, swap the theme.
    static void render(UIFactory factory) {
        System.out.println(factory.createButton().render());
        System.out.println(factory.createCheckbox().render());
    }
}

// --- usage ---
// boolean userPrefersDarkMode = true;
// UIFactory factory = userPrefersDarkMode ? new DarkUIFactory() : new LightUIFactory();
// SettingsPanel.render(factory);
```

**Language notes:** structurally identical in both languages — Abstract Factory is really just "a Factory Method per
product, grouped behind one interface." Java's static typing makes the guarantee explicit at compile time (a
`DarkUIFactory` cannot accidentally return a `LightButton`); Python relies on the same discipline without compiler
enforcement.

## Real-world example

Cross-platform GUI frameworks are the textbook case: a `WidgetFactory` per operating system (Windows, macOS, Linux)
ensures every button, checkbox, and menu rendered on Windows looks and behaves like a native Windows widget, and
switching platforms swaps the entire factory rather than each widget individually. Database driver families
(`ConnectionFactory`, `StatementFactory`, `ResultSetFactory` per vendor) are another common real-world instance.

## Advantages and tradeoffs

<div class="pros-cons">
<div>
<h4>✅ Advantages</h4>
<ul>
<li>Guarantees consistency within a family — impossible to accidentally mix Light and Dark widgets</li>
<li>Swapping an entire family is a one-line change (swap which factory is constructed)</li>
<li>Client code depends only on abstract product/factory interfaces</li>
</ul>
</div>
<div>
<h4>❌ Tradeoffs</h4>
<ul>
<li>Adding a new product (e.g. `Slider`) means updating the abstract factory interface and every concrete factory</li>
<li>More upfront classes/interfaces than a single Factory Method</li>
<li>Overkill if you only ever have one family in practice</li>
</ul>
</div>
</div>

<div class="callout tip">
<div class="callout-title">💡 Interview framing</div>

The fastest way to show you understand the difference from Factory Method: say the word "family." Factory Method
creates <em>one</em> product; Abstract Factory creates a <em>matching set</em> of products that must stay
consistent with each other. See the <a href="__BASE__/cheatsheet/">Cheat Sheet</a> for the full comparison table.

</div>

## Related patterns

- <a href="__BASE__/creational/factory-method/">Factory Method</a> — Abstract Factory is commonly implemented as several Factory Methods grouped behind one interface.
- <a href="__BASE__/creational/builder/">Builder</a> — use Builder instead when a single product is complex to assemble step-by-step; use Abstract Factory when the complexity is in choosing a *consistent family*, not assembling one object.
- <a href="__BASE__/structural/bridge/">Bridge</a> — both patterns decouple an abstraction from multiple implementations, but Bridge is about letting one abstraction vary independently from its implementation, not about creating families of objects.
