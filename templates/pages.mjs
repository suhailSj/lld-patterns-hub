// The site's hand-written, non-content-collection pages: Home, Cheat Sheet,
// About, 404. Plain template-literal functions — same approach as layout.mjs.
import { categories, withBase } from '../site.config.mjs';

export function renderHome({ totalPages }) {
  const categoryCards = categories
    .map(
      (c) => `<a class="card" href="${withBase(c.path)}">
  <div class="icon">${c.icon}</div>
  <h3>${c.label}</h3>
  <p>${c.description}</p>
</a>`
    )
    .join('\n');

  return `
<section class="hero">
  <h1>Low-Level Design, explained the way interviews actually test it.</h1>
  <p class="lede">
    SOLID principles, creational/structural/behavioral patterns, and the OOP fundamentals behind them —
    every page paired with a realistic Python <em>and</em> Java implementation of the same scenario.
  </p>
  <div class="hero-actions">
    <a class="btn btn-primary" href="${withBase('/fundamentals/')}">Start with Fundamentals</a>
    <a class="btn btn-secondary" href="${withBase('/cheatsheet/')}">Jump to the Cheat Sheet</a>
  </div>

  <div class="stats-strip">
    <div class="stat"><div class="num">${totalPages}</div><div class="label">Pattern &amp; principle pages</div></div>
    <div class="stat"><div class="num">2</div><div class="label">Languages per example</div></div>
    <div class="stat"><div class="num">4</div><div class="label">Pattern families covered</div></div>
  </div>
</section>

<section class="home-section">
  <h2>Browse by category</h2>
  <div class="card-grid">
${categoryCards}
    <a class="card" href="${withBase('/cheatsheet/')}">
      <div class="icon">📋</div>
      <h3>Pattern Comparison / Cheat Sheet</h3>
      <p>Factory vs. Abstract Factory, Strategy vs. State, Decorator vs. Proxy, and a "which pattern do I need?" lookup table.</p>
    </a>
  </div>
</section>

<section class="home-section">
  <h2>Who this is for</h2>
  <div class="pros-cons" style="grid-template-columns: repeat(3, 1fr);">
    <div>
      <h4>🎯 Interview prep</h4>
      <p>Every pattern page ends with interview talking points and "when to use / when to avoid" so you can reason
      out loud instead of reciting a definition.</p>
    </div>
    <div>
      <h4>🛠️ Working engineers</h4>
      <p>Examples use realistic domains — payments, ride booking, notifications, document editors — not
      <code>Animal</code>/<code>Shape</code> toy classes.</p>
    </div>
    <div>
      <h4>🔁 Bilingual by design</h4>
      <p>Python and Java solve the same problem side by side, so you can see where dynamic typing simplifies things
      and where Java's interfaces make intent explicit.</p>
    </div>
  </div>
</section>

<section class="home-section">
  <h2>How each page is structured</h2>
  <p class="summary-lede" style="max-width:var(--content-width)">
    Consistency matters more than cleverness when you're studying. Every pattern and principle page follows the
    same shape, so once you know how to read one, you know how to read all thirty.
  </p>
  <ol style="max-width:var(--content-width); columns: 2; column-gap: 40px;">
    <li>Intent / definition</li>
    <li>Problem statement</li>
    <li>Why the naive approach fails</li>
    <li>Solution overview + class design</li>
    <li>Step-by-step walkthrough</li>
    <li>Python example</li>
    <li>Java example</li>
    <li>Real-world example</li>
    <li>Pros &amp; cons</li>
    <li>When to use / avoid</li>
    <li>Interview talking points</li>
    <li>Related patterns</li>
  </ol>
</section>`;
}

export function renderAbout() {
  return `
<div class="layout-shell no-sidebar">
  <div class="content">
    <p class="breadcrumb"><a href="${withBase('/')}">Home</a> / About</p>
    <article class="prose">
      <h1>About this site</h1>
      <p class="summary-lede">
        LLD Patterns Hub is a static, open-source reference for Low-Level Design: the SOLID principles, the
        classic Gang-of-Four creational/structural/behavioral patterns, and the OOP fundamentals underneath them —
        built for engineers preparing for design interviews and for anyone who wants a working refresher.
      </p>

      <h2>How to use it</h2>
      <ul>
        <li>New to LLD? Start with <a href="${withBase('/fundamentals/')}">Fundamentals</a>, then <a href="${withBase('/solid/')}">SOLID</a> before the pattern families.</li>
        <li>Cramming for an interview this week? Go straight to the <a href="${withBase('/cheatsheet/')}">Cheat Sheet</a> for the comparisons interviewers love to ask about.</li>
        <li>Already know the theory? Use the Python/Java tabs on each pattern page to see how the same design reads in a statically-typed vs. dynamically-typed language.</li>
      </ul>

      <h2>Design decisions</h2>
      <ul>
        <li>Every code example models a realistic domain (payments, ride booking, notifications, document editors, caching, auth) instead of <code>Animal</code>/<code>Shape</code> toy classes.</li>
        <li>Python and Java examples solve the <em>same</em> scenario with the same class/method names wherever the languages allow it, so the two tabs are directly comparable.</li>
        <li>The site is a plain static build — no server, no framework, no database — so it's free to host on GitHub Pages and fast on mobile networks.</li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li>Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides — <em>Design Patterns: Elements of Reusable Object-Oriented Software</em> (the original "Gang of Four" book).</li>
        <li>Robert C. Martin — <em>Agile Software Development, Principles, Patterns, and Practices</em> (source of the SOLID acronym).</li>
        <li>Refactoring.Guru — free illustrated pattern reference, good for a second explanation of any pattern here.</li>
      </ul>

      <h2>Contributing</h2>
      <p>
        This site's content lives as plain Markdown files under <code>content/&lt;category&gt;/</code>. Adding a new
        pattern is: add one <code>.md</code> file following the existing template, run <code>npm run build</code>,
        and it appears in the category index and sidebar automatically. See the project <code>README.md</code>.
      </p>
    </article>
  </div>
</div>`;
}

export function render404() {
  return `
<div class="hero">
  <h1>404 — This pattern hasn't been catalogued.</h1>
  <p class="lede">The page you're looking for doesn't exist. It may have moved, or the link is out of date.</p>
  <div class="hero-actions">
    <a class="btn btn-primary" href="${withBase('/')}">Back to Home</a>
    <a class="btn btn-secondary" href="${withBase('/cheatsheet/')}">Go to Cheat Sheet</a>
  </div>
</div>`;
}

export function renderCheatsheet() {
  return `
<div class="layout-shell no-sidebar">
  <div class="content">
    <p class="breadcrumb"><a href="${withBase('/')}">Home</a> / Cheat Sheet</p>
    <article class="prose">
      <h1>📋 Pattern Comparison / Cheat Sheet</h1>
      <p class="summary-lede">
        The fastest way to sound confident in an LLD interview is to know not just what a pattern does, but which
        <em>other</em> pattern people confuse it with — and why. Use this page as a last-minute review.
      </p>

      <h2>"Which pattern do I need?" lookup table</h2>
      <div class="cheat-table-wrap">
        <table>
          <thead><tr><th>If you need to&hellip;</th><th>Reach for</th><th>Family</th></tr></thead>
          <tbody>
            <tr><td>Guarantee exactly one instance of a class (a config store, a connection pool)</td><td><a href="${withBase('/creational/singleton/')}">Singleton</a></td><td>Creational</td></tr>
            <tr><td>Hide which concrete class gets built based on input</td><td><a href="${withBase('/creational/factory-method/')}">Factory Method</a></td><td>Creational</td></tr>
            <tr><td>Create families of related objects that must stay consistent (e.g. a UI theme's button + checkbox)</td><td><a href="${withBase('/creational/abstract-factory/')}">Abstract Factory</a></td><td>Creational</td></tr>
            <tr><td>Construct a complex object step-by-step with optional parts</td><td><a href="${withBase('/creational/builder/')}">Builder</a></td><td>Creational</td></tr>
            <tr><td>Create new objects by copying an existing, pre-configured one</td><td><a href="${withBase('/creational/prototype/')}">Prototype</a></td><td>Creational</td></tr>
            <tr><td>Make two incompatible interfaces work together without changing either</td><td><a href="${withBase('/structural/adapter/')}">Adapter</a></td><td>Structural</td></tr>
            <tr><td>Add behavior to individual objects at runtime without subclass explosion</td><td><a href="${withBase('/structural/decorator/')}">Decorator</a></td><td>Structural</td></tr>
            <tr><td>Give a simple entry point to a complicated subsystem</td><td><a href="${withBase('/structural/facade/')}">Facade</a></td><td>Structural</td></tr>
            <tr><td>Treat individual objects and groups of objects the same way (files/folders, org charts)</td><td><a href="${withBase('/structural/composite/')}">Composite</a></td><td>Structural</td></tr>
            <tr><td>Control or defer access to an expensive or sensitive object</td><td><a href="${withBase('/structural/proxy/')}">Proxy</a></td><td>Structural</td></tr>
            <tr><td>Let an abstraction and its implementation evolve independently</td><td><a href="${withBase('/structural/bridge/')}">Bridge</a></td><td>Structural</td></tr>
            <tr><td>Swap an algorithm at runtime (pricing rules, sorting, routing)</td><td><a href="${withBase('/behavioral/strategy/')}">Strategy</a></td><td>Behavioral</td></tr>
            <tr><td>Notify many dependents automatically when one object changes</td><td><a href="${withBase('/behavioral/observer/')}">Observer</a></td><td>Behavioral</td></tr>
            <tr><td>Turn a request into an object you can queue, log, undo, or retry</td><td><a href="${withBase('/behavioral/command/')}">Command</a></td><td>Behavioral</td></tr>
            <tr><td>Change an object's behavior entirely when its internal state changes</td><td><a href="${withBase('/behavioral/state/')}">State</a></td><td>Behavioral</td></tr>
            <tr><td>Pass a request along a chain of handlers until one handles it</td><td><a href="${withBase('/behavioral/chain-of-responsibility/')}">Chain of Responsibility</a></td><td>Behavioral</td></tr>
            <tr><td>Fix the skeleton of an algorithm but let subclasses override specific steps</td><td><a href="${withBase('/behavioral/template-method/')}">Template Method</a></td><td>Behavioral</td></tr>
            <tr><td>Walk through a collection without exposing how it's stored</td><td><a href="${withBase('/behavioral/iterator/')}">Iterator</a></td><td>Behavioral</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Factory Method vs. Abstract Factory</h2>
      <div class="cheat-table-wrap">
        <table>
          <thead><tr><th></th><th>Factory Method</th><th>Abstract Factory</th></tr></thead>
          <tbody>
            <tr><td>What it creates</td><td>One product, via one overridable creation method</td><td>Families of related products via multiple factory methods on one interface</td></tr>
            <tr><td>Typical shape</td><td>One method, e.g. <code>createNotifier()</code></td><td>One interface with several methods, e.g. <code>createButton()</code> + <code>createCheckbox()</code></td></tr>
            <tr><td>Extension mechanism</td><td>Subclass the creator</td><td>Swap the whole concrete factory</td></tr>
            <tr><td>Use it when</td><td>You have one product hierarchy and want to defer instantiation to subclasses</td><td>Products must be created in matching sets and mixing sets would break things</td></tr>
            <tr><td>Relationship</td><td colspan="2">Abstract Factory is often implemented as a collection of Factory Methods, one per product.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Strategy vs. State</h2>
      <div class="cheat-table-wrap">
        <table>
          <thead><tr><th></th><th>Strategy</th><th>State</th></tr></thead>
          <tbody>
            <tr><td>Structurally</td><td colspan="2">Nearly identical — both delegate behavior to an interchangeable object</td></tr>
            <tr><td>Who chooses the implementation</td><td>The client, explicitly, based on configuration or user choice</td><td>The state objects themselves, implicitly, by transitioning to each other</td></tr>
            <tr><td>Do implementations know about each other?</td><td>No — strategies are independent and interchangeable</td><td>Often yes — a state decides which state comes next</td></tr>
            <tr><td>Typical example</td><td>Choosing a payment method or sort algorithm</td><td>An order moving from Placed → Paid → Shipped → Delivered</td></tr>
            <tr><td>Mental model</td><td>"How should this be done?"</td><td>"What can this object do right now, given what's happened to it?"</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Decorator vs. Proxy</h2>
      <div class="cheat-table-wrap">
        <table>
          <thead><tr><th></th><th>Decorator</th><th>Proxy</th></tr></thead>
          <tbody>
            <tr><td>Intent</td><td>Add new behavior/responsibility to an object</td><td>Control access to an object (lazy-load it, cache it, guard it)</td></tr>
            <tr><td>Composability</td><td>Designed to be stacked — many decorators wrap the same core object</td><td>Usually one proxy in front of one real subject</td></tr>
            <tr><td>Does it change what the object does?</td><td>Yes, deliberately — that's the point</td><td>No — it should behave identically to the real object from the caller's view</td></tr>
            <tr><td>Typical example</td><td>Wrapping a notifier with logging, then retry, then rate-limiting</td><td>A virtual proxy that delays opening a large file until <code>read()</code> is first called</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Composition vs. Inheritance</h2>
      <div class="cheat-table-wrap">
        <table>
          <thead><tr><th></th><th>Inheritance ("is-a")</th><th>Composition ("has-a")</th></tr></thead>
          <tbody>
            <tr><td>Coupling</td><td>Tight — subclass depends on parent's internals</td><td>Loose — object depends only on a small interface</td></tr>
            <tr><td>Flexibility at runtime</td><td>Fixed at compile time (Java) / class definition time</td><td>Can swap the composed object at runtime</td></tr>
            <tr><td>Risk</td><td>Deep hierarchies become fragile ("fragile base class" problem)</td><td>More objects/wiring to keep track of</td></tr>
            <tr><td>Rule of thumb</td><td colspan="2">Prefer composition by default; reach for inheritance only when the subtype truly satisfies Liskov Substitution.</td></tr>
          </tbody>
        </table>
      </div>
      <p>See the full writeup on <a href="${withBase('/fundamentals/composition-vs-inheritance/')}">Composition vs. Inheritance</a> in Fundamentals.</p>

      <h2>Creational vs. Structural vs. Behavioral, in one line each</h2>
      <ul>
        <li><strong>Creational</strong> — how objects get built.</li>
        <li><strong>Structural</strong> — how objects and classes are composed into larger structures.</li>
        <li><strong>Behavioral</strong> — how objects communicate and divide responsibility at runtime.</li>
      </ul>
    </article>
  </div>
</div>`;
}
