# React Migration Proposal (Revised)

## Component Architecture

### Folder Structure
```
src/
  content/
    index.tsx                      # Entry point, renders React root (merged app.tsx logic)
    components/
      Toolbar/
        Toolbar.tsx                # Toolbar container
        ToolbarButton.tsx          # Reusable button component
        FilterButtons.tsx          # Filter button group with rotation state
        SearchInput.tsx            # Search input with animation
      ConversationList/
        ConversationList.tsx       # List container with filtering
        ConversationItem.tsx       # Individual conversation card
        ConversationDetails.tsx    # Expanded preview section
        ActionButtons.tsx          # Archive/delete buttons
      Composer/
        ComposerBox.tsx            # Reply/forward/compose container
        ComposerField.tsx          # Reusable input field with label
        ComposerActions.tsx        # Send/close/attachments buttons
        CollapsedDraft.tsx         # Collapsed draft header
    hooks/
      useConversations.ts          # Gmail DOM parser + state sync (throttled)
      useAnimations.ts             # Unified animation orchestration hook
      useClickOutside.ts           # Click-outside detection
    store/
      useConversationStore.ts      # Zustand slice: conversations, expand, dismiss
      useToolbarStore.ts           # Zustand slice: search, filter state
      useComposerStore.ts          # Zustand slice: drafts, multi-box state
      index.ts                     # Combined store exports
    lib/
      conversationParser.ts        # Existing parser (unchanged)
      constants.ts                 # Icon maps, labels (unchanged)
      fontLoader.ts                # Font injection (unchanged)
      viewTracker.ts               # Gmail navigation observer (unchanged)
      logger.ts                    # Console wrapper (unchanged)
    types/
      actionTypes.ts               # Existing types (unchanged)
      types.ts                     # Existing types (unchanged)
    styles/
      global.css                   # CSS variables, base styles
      animations.css               # Keyframes (unchanged)
```

### Component Hierarchy
```
MailBitesApp (index.tsx - merged root)
├── Toolbar
│   ├── ToolbarButton (new-email)
│   ├── ToolbarButton (search) → SearchInput
│   └── FilterButtons
│       ├── ToolbarButton (unread/read/draft)
│       └── Divider
├── ComposerBox[] (standalone compose drafts)
└── ConversationList
    └── ConversationItem[]
        ├── ActionButtons
        ├── ConversationDetails
        │   └── PreviewActions (reply/forward)
        └── ComposerBox (reply/forward composer)
```

## State Ownership (Zustand Slices)

### useConversationStore
```ts
interface ConversationStore {
  conversations: ConversationData[]
  expandedId: string | null
  highlightedId: string | null
  dismissedIds: Set<string>
  conversationModes: Map<string, 'read' | 'reply' | 'forward'>
  collapsingId: string | null
  pendingHoverId: string | null
  
  // Actions
  setConversations: (conversations: ConversationData[]) => void
  expandConversation: (id: string) => void
  collapseConversation: (id: string) => void
  dismissConversation: (id: string) => void
  setConversationMode: (id: string, mode: 'read' | 'reply' | 'forward') => void
}
```

### useToolbarStore
```ts
interface ToolbarStore {
  isSearchActive: boolean
  searchQuery: string
  filterButtonOrder: ('unread' | 'read' | 'draft')[]
  isFilterCollapsed: boolean
  
  // Actions
  toggleSearch: () => void
  setSearchQuery: (query: string) => void
  rotateFilterButtons: (clickedType: 'unread' | 'read' | 'draft') => void
  toggleFilterCollapse: () => void
}
```

### useComposerStore
```ts
interface ComposerStore {
  composeBoxCount: number
  expandedComposeIndex: number | null
  composeDrafts: Map<number, DraftData>
  sentEmails: Set<number>
  isComposingAnimating: boolean
  
  // Actions
  addComposeBox: () => void
  removeComposeBox: (index: number) => void
  setExpandedComposeIndex: (index: number | null) => void
  saveDraft: (index: number, draft: DraftData) => void
  sendEmail: (index: number) => void
}
```

### Local Component State
- Animation classes (`useState` for transient animation states)
- Form field values (controlled inputs via `useState`)
- Hover states (CSS classes via `onMouseEnter`/`onMouseLeave`)

## Data Flow

### Gmail → React (Throttled)
1. `useConversations` hook observes Gmail DOM via `MutationObserver`
2. Throttles parsing calls (300ms) to avoid excess re-renders
3. Parses rows with existing `conversationParser.ts`
4. Calls `useConversationStore.setConversations()` on change
5. Components re-render with new data

```tsx
const useConversations = (mainElement: HTMLElement | null) => {
  const setConversations = useConversationStore(state => state.setConversations)
  
  useEffect(() => {
    if (!mainElement) return
    
    const throttledParse = throttle(() => {
      const conversations = extractConversationData(mainElement)
      setConversations(conversations)
    }, 300)
    
    const observer = new MutationObserver(throttledParse)
    observer.observe(mainElement, { childList: true, subtree: true })
    
    throttledParse() // Initial parse
    return () => observer.disconnect()
  }, [mainElement, setConversations])
}
```

### User Actions → State Updates
1. Click handlers in components call Zustand actions (e.g., `expandConversation`, `rotateFilterButtons`)
2. Actions update slice state
3. React re-renders affected subtrees
4. Animations triggered via `useAnimations` hook or CSS classes

### State → Persistence
- `composeDrafts` stored in `useComposerStore` (Map persists across re-renders)
- No localStorage initially (same as current)

## Animation Strategy

### CSS-First (MVP)
- Preserve existing keyframes in `animations.css`
- Apply/remove classes via `useState` + `useEffect` with `onAnimationEnd` listeners
- Example: `mail-bites-anim-bezel`, `mail-bites-anim-rotate-close`, `mail-bites-anim-bezel-surface`

### useAnimations Hook (Unified)
Consolidates all animation orchestration from `AnimationController.ts`:

```tsx
const useAnimations = () => {
  const timeoutRefs = useRef<Map<string, number>>(new Map())
  
  // Card collapse animation with timeout fallback
  const scheduleCollapseTimeout = (callback: () => void, delay = 600) => {
    const id = setTimeout(callback, delay)
    return () => clearTimeout(id)
  }
  
  // Search button → input transformation
  const animateSearchTransform = (
    button: HTMLButtonElement,
    onHalfway: () => void,
    onComplete: () => void
  ) => {
    // Rotation → shrink → transform (existing logic)
    button.classList.add('is-rotating')
    setTimeout(onHalfway, 150)
    setTimeout(onComplete, 300)
  }
  
  // Compose button rotation
  const animateComposeRotation = (
    button: HTMLButtonElement,
    direction: 'open' | 'close',
    onComplete: () => void
  ) => {
    const className = direction === 'close' 
      ? 'mail-bites-anim-rotate-close' 
      : 'mail-bites-anim-rotate-open'
    
    button.classList.add(className)
    button.addEventListener('animationend', () => {
      button.classList.remove(className)
      onComplete()
    }, { once: true })
  }
  
  // Bezel pulse (empty draft feedback)
  const animateBezelPulse = (element: HTMLElement) => {
    element.classList.remove('mail-bites-anim-bezel-surface')
    void element.offsetWidth // Force reflow
    element.classList.add('mail-bites-anim-bezel-surface')
  }
  
  // Cancel all pending timeouts
  const cancelAll = () => {
    timeoutRefs.current.forEach(id => clearTimeout(id))
    timeoutRefs.current.clear()
  }
  
  useEffect(() => cancelAll, [])
  
  return {
    scheduleCollapseTimeout,
    animateSearchTransform,
    animateComposeRotation,
    animateBezelPulse,
    cancelAll
  }
}
```

### Framer Motion (Optional, Post-MVP)
- Consider for expand/collapse if CSS transitions prove insufficient
- Use `<motion.div layout>` for auto-animated layout shifts
- Benchmark performance impact before adopting

## Gmail DOM Constraints

### No Shadow DOM
- React root injects directly into `document.body`
- Use high-specificity selectors to avoid Gmail conflicts
- Prefix all classes with `mail-bites-`

### Z-Index Management
- Root overlay: `z-index: 2147483646` (below modals)
- Toolbar gradient overlays: `z-index: 2147483647`

### Event Delegation
- Attach single `click` listener to overlay root (same as current)
- Use `closest()` to identify clicked components
- React's synthetic events work natively

### Performance
- Memoize `ConversationItem` with `React.memo` to prevent re-renders
- Throttle Gmail DOM parsing (300ms) in `useConversations`
- Debounce search input (existing logic preserved)
- Defer virtualization (react-window) until performance tested with real inbox data

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Install: `react`, `react-dom`, `zustand`, `@vitejs/plugin-react`
2. Create Zustand slices: `useConversationStore`, `useToolbarStore`, `useComposerStore`
3. Merge `app.tsx` + `minimalInboxRenderer.ts` → `index.tsx` (single root component)
4. Build `useAnimations` hook (consolidate `AnimationController` logic)
5. Update Vite build script to replace esbuild

### Phase 2: Toolbar & Search (Week 2)
1. Convert `ToolbarBuilder` → `Toolbar` component tree
2. Implement `SearchInput` with animation transitions
3. Build `FilterButtons` with rotation logic
4. Wire up `useToolbarStore` actions
5. Preserve CSS animations with class toggling

### Phase 3: Conversations (Week 3)
1. Convert `ConversationItemBuilder` → `ConversationItem`
2. Implement `useConversations` hook with throttled parsing
3. Build `ConversationDetails` + `ActionButtons`
4. Wire up expand/collapse to `useConversationStore`
5. Add `React.memo` to prevent unnecessary re-renders

### Phase 4: Composer (Week 4)
1. Convert `ResponseBoxBuilder` → `ComposerBox`
2. Build `ComposerField`, `ComposerActions`, `CollapsedDraft`
3. Wire up `useComposerStore` for multi-box state
4. Implement draft persistence + empty-draft validation
5. Port bezel pulse animation for feedback

### Phase 5: Testing & Polish (Week 5)
1. Migrate `EventCoordinator` logic to component handlers
2. Implement `useClickOutside` hook
3. Test all interactions (hover, click-outside, keyboard)
4. Performance audit with React DevTools (check re-render frequency)
5. Defer virtualization until performance issues observed

## Resolved Decisions
- **State**: Zustand slices (modular, devtools, minimal boilerplate)
- **Animations**: CSS-first with unified `useAnimations` hook (Framer Motion deferred)
- **Root**: Single merged component in `index.tsx` (no separate app.tsx)
- **Parsing**: Throttled at 300ms in `useConversations`
- **Virtualization**: Deferred until real-world performance testing
