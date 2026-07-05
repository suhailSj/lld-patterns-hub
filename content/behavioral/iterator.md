---
title: "Iterator"
order: 7
summary: "Provide a way to access the elements of a collection sequentially without exposing how the collection is stored internally."
tags: ["Behavioral", "GoF", "pagination"]
useWhen: "Client code needs to walk through a collection's elements without knowing (or depending on) its internal storage structure."
---

## Problem statement

A social media feed's posts are actually fetched from a backend API **one page at a time** — the client shouldn't
need to manage page numbers, "have I fetched this page yet," or when to stop, just to loop over posts. It also
shouldn't need to know that pagination is happening at all versus, say, an in-memory list.

## Core idea

Wrap the paging logic behind a standard iteration interface: something with `has_next()`/`next()` (or, in Python,
something that implements `__iter__`/`__next__`). Client code loops over it exactly like it would loop over a plain
list — the fact that pages are being fetched lazily, on demand, from a network call is entirely hidden inside the
iterator.

## Real-world analogy

A streaming playlist doesn't load every song into memory before you press play — it hands you the next track when
you ask for it, and however it fetches or buffers that track is invisible to whoever's just pressing "next."

## Class / object design

```
      «interface»
     FeedIterator
   + has_next(): bool
   + next(): Post
           ▲
    PaginatedFeedIterator
    (fetches a new page from the API only when the current page is exhausted)

FeedClient code:
  it = feed.iterator()
  while it.has_next():
      post = it.next()   ◀── caller never sees page numbers or API calls
```

## Python example

Python has first-class iterator support via `__iter__`/`__next__`, which is the idiomatic way to implement this
pattern — any object implementing them works with `for ... in ...` directly.

```python
from dataclasses import dataclass

@dataclass
class Post:
    id: str
    text: str

class FeedAPI:
    """Simulates a backend that only returns one page at a time."""

    def fetch_page(self, page_number: int) -> list[Post]:
        all_posts = [Post(f"p{i}", f"Post number {i}") for i in range(1, 26)]
        page_size = 10
        start = page_number * page_size
        return all_posts[start:start + page_size]

class PaginatedFeedIterator:
    """Implements Python's iterator protocol: hides pagination behind a normal for-loop."""

    def __init__(self, api: FeedAPI):
        self._api = api
        self._page_number = 0
        self._buffer: list[Post] = []
        self._exhausted = False

    def __iter__(self) -> "PaginatedFeedIterator":
        return self

    def __next__(self) -> Post:
        if not self._buffer and not self._exhausted:
            self._buffer = self._api.fetch_page(self._page_number)
            self._page_number += 1
            if not self._buffer:
                self._exhausted = True
        if not self._buffer:
            raise StopIteration
        return self._buffer.pop(0)

# --- usage: looks exactly like iterating a plain list ---
for post in PaginatedFeedIterator(FeedAPI()):
    print(post.text)
```

```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

class Post {
    final String id;
    final String text;
    Post(String id, String text) { this.id = id; this.text = text; }
}

class FeedApi {
    // Simulates a backend that only returns one page at a time.
    List<Post> fetchPage(int pageNumber) {
        List<Post> all = new ArrayList<>();
        for (int i = 1; i <= 25; i++) all.add(new Post("p" + i, "Post number " + i));
        int pageSize = 10;
        int start = pageNumber * pageSize;
        if (start >= all.size()) return List.of();
        return all.subList(start, Math.min(start + pageSize, all.size()));
    }
}

// Implements Java's Iterator interface: hides pagination behind a normal for-each loop.
class PaginatedFeedIterator implements Iterator<Post> {
    private final FeedApi api;
    private int pageNumber = 0;
    private List<Post> buffer = new ArrayList<>();
    private boolean exhausted = false;

    PaginatedFeedIterator(FeedApi api) { this.api = api; }

    public boolean hasNext() {
        if (buffer.isEmpty() && !exhausted) {
            buffer = new ArrayList<>(api.fetchPage(pageNumber++));
            if (buffer.isEmpty()) exhausted = true;
        }
        return !buffer.isEmpty();
    }

    public Post next() {
        if (!hasNext()) throw new NoSuchElementException();
        return buffer.remove(0);
    }
}

// --- usage: looks exactly like iterating a plain list ---
// Iterator<Post> it = new PaginatedFeedIterator(new FeedApi());
// while (it.hasNext()) {
//     System.out.println(it.next().text);
// }
```

**Language notes:** Python's `for x in obj` works automatically for any object implementing `__iter__`/`__next__`
(the iterator protocol) — no interface declaration required, just the two dunder methods. Java's `Iterator<T>`
interface (`hasNext()`/`next()`) is explicit and lets the class also implement `Iterable<T>` to support Java's
enhanced `for` loop directly. Both achieve the same goal: the calling code loops exactly as it would over an
in-memory collection.

## How to identify when to use it

Client code needs to "go through everything in this collection one at a time," and the collection's actual storage
(paginated API, tree structure, generated/infinite sequence, database cursor) is more complex than a flat in-memory
array. If exposing that complexity directly would leak implementation details into every caller, Iterator hides it
behind a uniform interface.

## Pros

<div class="pros-cons">
<div>
<h4>✅ Pros</h4>
<ul>
<li>Client code iterates without knowing about pages, cursors, or tree traversal order</li>
<li>Supports lazy evaluation — later pages/elements are only fetched/computed when actually needed</li>
<li>Multiple iterators over the same collection can exist independently and progress separately</li>
</ul>
</div>
<div>
<h4>❌ Cons / tradeoffs</h4>
<ul>
<li>Adds a class/protocol implementation for what a plain list traversal wouldn't need</li>
<li>Lazy fetching means errors (a failed page fetch) surface mid-iteration rather than upfront — callers should be ready to handle that</li>
</ul>
</div>
</div>

## When to use

- The underlying collection is complex, lazily computed, paginated, or otherwise not a simple in-memory array, but
  callers should still be able to loop over it simply.

## When to avoid

- For a small, already-in-memory list, the language's built-in iteration is already Iterator — don't build a custom
  one without a real reason (lazy loading, hiding structure, custom traversal order).

## Interview talking points

- Point out that both Python's `for` loop and Java's enhanced `for` loop are themselves built on this exact pattern —
  it's not an exotic pattern, it's the one developers use daily, often without naming it.
- Mention lazy evaluation as the main practical win: an iterator over a huge or paginated dataset never needs to hold
  everything in memory at once.

## Related patterns

- <a href="__BASE__/structural/composite/">Composite</a> — Iterator is commonly used to traverse a Composite tree without exposing its recursive structure to callers.
- <a href="__BASE__/creational/factory-method/">Factory Method</a> — a collection class often exposes a factory method (`iterator()`, `__iter__`) that returns the appropriate iterator for its internal structure.
