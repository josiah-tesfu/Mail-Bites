# MinimalInboxRenderer Refactoring Plan

## Key Principles, Paradigms, and Best Practices

### Incremental Migration Strategy
- **Zero Big-Bang Rewrites**: Never replace entire systems at once. Build new alongside old, migrate incrementally, remove old.
- **Dual-Write Pattern**: When migrating state, write to both old and new locations until migration complete. Reads follow after writes stable.
- **Feature Flags via Existence**: New code coexists unused until explicitly invoked. No runtime flags needed.
- **One Variable at a Time**: State migration happens per-variable with full test coverage between each.
- **Rollback-Friendly**: Each substep independently revertible. Never combine state + behavior changes.

### Separation of Concerns
- **Single Responsibility**: Each class owns one domain: `UIState` (data), `AnimationController` (timing), `Builders` (DOM), `EventCoordinator` (interactions).
- **No Cross-Domain Logic**: State classes never manipulate DOM. Animation classes never read state directly. Builders never handle events.
- **Dependency Injection**: Pass dependencies via constructors. No global state, no singletons.
- **Coordination at Edges**: Renderer becomes thin coordinator calling into specialized subsystems.

### Testability
- **Pure Functions Preferred**: Builders return DOM elements without side effects. State getters/setters have no hidden behavior.
- **Injectable Time**: AnimationController accepts optional time provider for deterministic testing.
- **Observable State**: State changes emit events for test verification without DOM inspection.
- **Mockable Dependencies**: All constructor dependencies can be mocked/stubbed.

### Animation Reliability
- **Named Constants**: All timing values defined once, referenced by name. No magic numbers.
- **Centralized Timing**: Single source of truth for animation durations. Easy to adjust, easy to sync with CSS.
- **Cancellation Support**: All animations cancellable mid-flight. No orphaned timeouts.
- **Completion Tracking**: Know when animations finish. Enable chaining, cleanup, state transitions.
- **Frame-Perfect Coordination**: Use `requestAnimationFrame` for visual changes, `setTimeout` for state changes.

### Event Handling
- **Bubbling Over Capture**: Use event bubbling for delegation. Attach high-level handlers, inspect `event.target`.
- **Single Attachment Point**: One coordinator method attaches all listeners. No scattered `addEventListener` calls.
- **Explicit Propagation Control**: Document every `stopPropagation()`. Default to propagation unless specific conflict.
- **State Transitions Not Side Effects**: Event handlers update state, renderer observes state changes.

### DOM Building
- **Immutable Builders**: Builder methods return new DOM, never mutate existing. Renderer decides when to insert.
- **Data In, DOM Out**: Builders accept plain data, return elements. No ambient state access.
- **Composition Over Inheritance**: Builders compose smaller builders. No deep inheritance hierarchies.
- **Semantic Structure**: DOM hierarchy mirrors visual hierarchy. Related elements grouped, unrelated elements separated.

### Code Organization
- **File Structure Mirrors Architecture**: State classes together, builders together, coordinators together. Eventually separate files.
- **Private by Default**: Expose only what coordination layer needs. Internal methods stay private.
- **Method Ordering**: Public interface first, private helpers last. Reading top-to-bottom follows call hierarchy.
- **Extract Before Moving**: Get logic working in new location (same file) before splitting to separate file.

### Migration Validation
- **Pixel-Perfect Comparison**: DOM structure must be byte-identical after each substep. Use snapshots.
- **Timing Preservation**: Animations must maintain exact durations. Record before, verify after.
- **Event Behavior Preservation**: Every click, hover, focus must produce identical results.
- **Test Per Substep**: Full test suite runs after each numbered substep. No batching.
- **Manual Verification**: Developer tests all interactions in real extension after each phase.

### Anti-Patterns to Avoid
- **Premature Optimization**: Extract for clarity, not performance. Performance improvements come after structure correct.
- **Leaky Abstractions**: State classes expose getters/setters, not implementation details. Builders hide element creation specifics.
- **God Classes**: If class exceeds 300 lines post-refactor, split further. No exceptions.
- **Circular Dependencies**: State → Animation → Builder → Event is acyclic. Renderer sits above all.
- **Temporal Coupling**: Method A requiring call to Method B before it works. Use constructor initialization instead.
- **Mutable Shared State**: Pass data, not references. Copy when boundaries crossed.

### Success Criteria
- **Line Count Reduction**: `minimalInboxRenderer.ts` drops below 400 lines (currently ~800+).
- **Test Coverage**: Each extracted class has dedicated unit tests achieving >90% coverage.
- **No Regressions**: All existing animations, interactions, visual states preserved exactly.
- **Reduced Cognitive Load**: Any component understandable in isolation without reading others.
- **Easier Feature Addition**: New toolbar button requires changes to 1-2 classes, not 5+ locations.

## Phase 1: State Management Extraction

### 1.1: Create UIState class (no integration)
- Add new `UIState` class to file
- Define all state properties mirroring current instance variables
- Add basic getters/setters
- Zero behavior changes - class exists but unused

### 1.2: Add synchronization layer
- Create dual-write system: updates to instance variables also update `UIState`
- Getters read from instance variables (not UIState yet)
- Still zero behavior changes - UIState tracks state but doesn't control it

### 1.3: Switch reads to UIState (one variable at a time)
- Replace direct `this.expandedId` reads with `this.state.getExpandedId()`
- Keep writes going to both places
- Test thoroughly after each variable migration
- Order: `expandedId` → `highlightedId` → `pendingHoverId` → `collapsingId` → etc.

### 1.4: Switch writes to UIState
- Replace direct variable assignments with `this.state.setExpandedId()`
- Remove dual-write layer
- UIState becomes source of truth

### 1.5: Remove instance variables
- Delete old instance variable declarations
- Clean up any missed references

## Phase 2: Animation System Extraction

### 2.1: Create AnimationController class with constants only
- Add new `AnimationController` class to file
- Define all timing constants as static readonly properties
- Map all setTimeout/requestAnimationFrame durations to named constants
- Class exists but unused

### 2.2: Extract animation state tracking
- Add `activeAnimations` Map to AnimationController
- Track animation IDs and completion callbacks
- No integration with existing code yet

### 2.3: Migrate simple animations (one at a time)
- Start with single-step animations (appearing button, icon scale)
- Create AnimationController methods that wrap existing setTimeout logic
- Replace inline setTimeout with controller method calls
- Verify timing unchanged
- Order: `is-appearing` → `is-appearing-expanded` → `is-sliding-out`

### 2.4: Migrate compound animations
- Extract multi-step sequences (search button rotation + shrink + transform)
- Create coordinated animation methods in controller
- Replace setTimeout chains with single controller method
- Order: search button → more-things expansion → collapse transition

### 2.5: Add animation cleanup
- Implement cancellation logic for interrupted animations
- Add cleanup in state transitions
- Remove manual animation class management from renderer

### 2.6: Consolidate animation timing
- Replace all remaining magic numbers with controller constants
- Verify all animations use controller methods
- Remove scattered setTimeout calls from renderer

## Phase 3: DOM Builder Extraction

### 3.1: Create builder classes (no integration)
- Add `ConversationItemBuilder`, `ToolbarBuilder`, `ResponseBoxBuilder` classes to file
- Empty classes with method stubs matching current private methods
- Zero behavior changes - classes exist but unused

### 3.2: Extract header building
- Move `buildItem` header creation logic to `ConversationItemBuilder.buildHeader()`
- Keep original `buildItem` calling new method
- Verify DOM structure identical (byte-for-byte comparison)

### 3.3: Extract details building
- Move details element creation to `ConversationItemBuilder.buildDetails()`
- Maintain animation timing logic in renderer
- Test expanded state rendering unchanged

### 3.4: Extract action buttons
- Move `buildActions`, `buildActionButton` to `ConversationItemBuilder`
- Move `buildPreviewActions`, `buildPreviewActionButton` to `ConversationItemBuilder`
- Event handlers remain inline for now
- Verify all action buttons render and position correctly

### 3.5: Consolidate item builder
- Move entire `buildItem` logic to `ConversationItemBuilder.build()`
- Pass state and conversation data as parameters
- Renderer calls builder method
- Test full item rendering including expand/collapse

### 3.6: Extract toolbar building
- Move `buildToolbar`, `buildToolbarButton` to `ToolbarBuilder`
- Move `buildExpandedIcon` to `ToolbarBuilder`
- Maintain search and more-things state checks
- Verify toolbar renders correctly in all states (normal, search active, more-things expanded)

### 3.7: Extract response box building
- Move `buildResponseBox`, `buildComposerActions`, `buildComposerActionButton` to `ResponseBoxBuilder`
- Verify composer box renders for reply/forward modes
- Test mode transitions render correct composer state

### 3.8: Initialize builders in renderer
- Create builder instances in renderer constructor
- Replace all direct build method calls with builder instance calls
- Remove extracted methods from renderer
- Final verification of all DOM building

## Phase 4: Event Handler Coordination

### 4.1: Create EventCoordinator class (no integration)
- Add `EventCoordinator` class to file
- Constructor accepts references to state, animator, renderer
- Empty method stubs for all event handlers
- Class exists but unused

### 4.2: Extract conversation item events
- Move `toggle()` logic to `EventCoordinator.handleItemClick()`
- Move mouseenter/mouseleave logic to `EventCoordinator.handleItemHover()`
- Keep inline event listeners calling coordinator methods
- Verify expand/collapse/hover behavior unchanged

### 4.3: Extract action button events
- Move `handleConversationDismiss()` to `EventCoordinator.handleActionClick()`
- Move preview action click logic to `EventCoordinator.handlePreviewActionClick()`
- Move composer action click logic to `EventCoordinator.handleComposerActionClick()`
- Test archive, delete, reply, forward, send, cancel buttons

### 4.4: Extract toolbar events
- Move `handleSearchButtonClick()` to `EventCoordinator.handleSearchButtonClick()`
- Move `handleMoreThingsClick()` to `EventCoordinator.handleMoreThingsClick()`
- Move `transformToSearchBar()` and `restoreSearchButton()` to coordinator
- Verify search and more-things animations unchanged

### 4.5: Extract click-outside handler
- Move `ensureClickOutsideHandler()` logic to `EventCoordinator.handleClickOutside()`
- Move attachment logic to `EventCoordinator.attachClickOutsideHandler()`
- Test click-outside collapse behavior

### 4.6: Consolidate event attachment
- Create `EventCoordinator.attachAllListeners(container: HTMLElement)` method
- Replace inline addEventListener calls with coordinator.attachAllListeners()
- Verify all event handlers still fire correctly
- Test event propagation (stopPropagation behavior preserved)

### 4.7: Clean up renderer event code
- Remove extracted event handler methods from renderer
- Keep only coordinator method calls in renderer
- Verify all interactions work (clicks, hovers, keyboard navigation)

## Phase 5: Renderer Simplification

### 5.1: Add builder instances to renderer
- Add private properties for `itemBuilder`, `toolbarBuilder`, `responseBoxBuilder`
- Initialize in constructor (pass dependencies if needed)
- No behavior changes - builders exist but unused

### 5.2: Replace item rendering with builder
- Update `buildItem()` to call `this.itemBuilder.build(conversation, skipExpandAnimation)`
- Pass conversation data and state to builder
- Remove item construction logic from renderer
- Verify item rendering identical

### 5.3: Replace toolbar rendering with builder
- Update `buildToolbar()` to call `this.toolbarBuilder.build()`
- Pass search and more-things state to builder
- Remove toolbar construction logic from renderer
- Test toolbar in all states (normal, search, more-things)

### 5.4: Replace response box rendering with builder
- Update `buildResponseBox()` to call `this.responseBoxBuilder.build(conversation)`
- Pass conversation data to builder
- Remove response box construction logic from renderer
- Verify composer box rendering

### 5.5: Consolidate state access through UIState
- Replace all direct state variable reads with `this.state.getX()` calls
- Replace all direct state variable writes with `this.state.setX()` calls
- Verify state transitions unchanged

### 5.6: Consolidate animations through AnimationController
- Replace all direct animation logic with `this.animator.X()` calls
- Remove setTimeout/requestAnimationFrame calls from renderer
- Verify animation timing unchanged

### 5.7: Route events through EventCoordinator
- Update event listener attachments to use `this.eventCoordinator.attachAllListeners()`
- Remove direct event handler logic from renderer
- Test all event interactions

### 5.8: Clean up renderer
- Remove all extracted builder methods
- Remove all extracted animation logic
- Remove all extracted event handlers
- Keep only coordination methods: `render()`, `renderList()`, `reset()`, `ensureContainer()`
- Final verification of all functionality