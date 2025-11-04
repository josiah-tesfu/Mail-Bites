# React Interface Map

This document provides a detailed tabular breakdown of all React components, their props interfaces, state dependencies, and relationships. Based on the [React Migration Proposal (Revised)](./react-migration-proposal.md).

---

## Root Component

### index.tsx (MailBitesApp)

**Description:** Root component that merges app initialization logic and overlay rendering. Single entry point that injects into Gmail DOM.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | None (root component) |
| **Zustand Stores** | • `useConversationStore` (conversations, expandedId)<br>• `useToolbarStore` (isSearchActive)<br>• `useComposerStore` (composeBoxCount, expandedComposeIndex) |
| **Custom Hooks** | • `useConversations(mainElement)` - Parses Gmail DOM (throttled 300ms)<br>• `useClickOutside()` - Handles click-outside for search/composer |
| **Local State** | • `mainElement: HTMLElement \| null` - Gmail conversation list container<br>• `isOverlayVisible: boolean` - Controls root visibility |
| **Child Components** | • `<Toolbar />`<br>• `<ComposerBox />` (rendered N times for standalone compose drafts)<br>• `<ConversationList />` |
| **Event Handlers** | • Click delegation on root overlay<br>• MutationObserver for Gmail navigation changes |
| **Notes** | • Z-index: 2147483646<br>• Observes `viewTracker` for Gmail route changes<br>• Injects directly into `document.body` |

---

## Toolbar Components

### Toolbar.tsx

**Description:** Container for toolbar elements (new email, search, filters). Manages layout and gradient overlay.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | None |
| **Zustand Stores** | • `useToolbarStore` (isSearchActive, isFilterCollapsed)<br>• `useComposerStore` (addComposeBox, isComposingAnimating) |
| **Custom Hooks** | • `useAnimations()` - For compose button rotation |
| **Local State** | • `isNewEmailAnimating: boolean` - Transient animation state for new email button |
| **Child Components** | • `<ToolbarButton type="new-email" />`<br>• `<ToolbarButton type="search" />` → `<SearchInput />`<br>• `<FilterButtons />` |
| **Event Handlers** | • `handleNewEmailClick()` → calls `addComposeBox()` + animation |
| **Notes** | • Gradient overlay at z-index: 2147483647<br>• Sticky positioning at top of overlay |

---

### ToolbarButton.tsx

**Description:** Reusable button component for toolbar actions (new email, search, filter types).

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ToolbarButtonProps {`<br>&nbsp;&nbsp;`type: 'new-email' \| 'search' \| 'unread' \| 'read' \| 'draft'`<br>&nbsp;&nbsp;`isActive?: boolean`<br>&nbsp;&nbsp;`isDisabled?: boolean`<br>&nbsp;&nbsp;`onClick?: () => void`<br>&nbsp;&nbsp;`ariaLabel?: string`<br>&nbsp;&nbsp;`className?: string`<br>`}` |
| **Zustand Stores** | None (receives state via props) |
| **Custom Hooks** | None |
| **Local State** | • `isHovered: boolean` - Hover feedback (CSS classes) |
| **Child Components** | • SVG icon (from `constants.ts` icon map)<br>• Optional badge (for filter count) |
| **Event Handlers** | • `onClick` (passed from parent)<br>• `onMouseEnter`, `onMouseLeave` for hover |
| **Notes** | • Uses `ICON_URLS` from `constants.ts`<br>• Applies `mail-bites-toolbar-button` class |

---

### SearchInput.tsx

**Description:** Animated search input that transforms from toolbar button. Handles search query with debouncing.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `LegacyToolbarHandlers` slice (onSearchClose, onSearchQueryChange) |
| **Zustand Stores** | • `useToolbarStore` (searchQuery, setSearchQuery, setSearchActive) |
| **Custom Hooks** | • `useAnimations()` (triggered upstream) |
| **Local State** | • `value: string` - Debounced input value<br>• `inputRef: RefObject<HTMLInputElement>` - Focus management |
| **Child Components** | • Native `<input>` element |
| **Event Handlers** | • `onChange` → debounced `onSearchQueryChange()` (300ms)<br>• `onBlur` → `onSearchClose()` if empty<br>• `onKeyDown` → Escape key closes search |
| **Notes** | • Auto-focuses when mounted<br>• Closing clears query and restores search button animation |

---

### FilterButtons.tsx

**Description:** Button group for conversation filters (unread/read/draft). Implements rotation reordering on click.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | None |
| **Zustand Stores** | • `useToolbarStore` (filterButtonOrder, rotateFilterButtons, isFilterCollapsed, toggleFilterCollapse) |
| **Custom Hooks** | • `useAnimations()` - For rotation animation feedback |
| **Local State** | • `rotatingType: 'unread' \\| 'read' \\| 'draft' \\| null` - Locks buttons during animation |
| **Child Components** | • `<ToolbarButton type={buttonType} />` (3x, dynamically ordered)<br>• `<Divider />` (vertical separator) |
| **Event Handlers** | • `handleFilterClick(type)` → `rotateFilterButtons(type)` + `setFilterCollapsed()` |
| **Notes** | • Reads `filterButtonOrder`/`isFilterCollapsed` from store<br>• Applies `mail-bites-filter-rotate` class via `useAnimations()`<br>• Collapse state controls visibility |

---

## Conversation List Components

### ConversationList.tsx

**Description:** Container for conversation cards. Applies filtering (search, filter type) and manages scroll behavior.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | None |
| **Zustand Stores** | • `useConversationStore` (conversations, dismissedIds)<br>• `useToolbarStore` (searchQuery, filterButtonOrder) |
| **Custom Hooks** | None |
| **Local State** | • `containerRef: RefObject<HTMLDivElement>` - For scroll restoration |
| **Child Components** | • `<ConversationItem />` (rendered for each filtered conversation) |
| **Event Handlers** | None (passive container) |
| **Notes** | • Filters conversations based on `searchQuery` + active filter<br>• Uses `React.memo` on children to prevent re-renders<br>• Virtualization deferred (react-window) |

---

### ConversationItem.tsx

**Description:** Individual conversation card with expand/collapse, action buttons, and nested composer.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ConversationItemProps {`<br>&nbsp;&nbsp;`conversation: ConversationData`<br>&nbsp;&nbsp;`isExpanded: boolean`<br>&nbsp;&nbsp;`isHighlighted: boolean`<br>&nbsp;&nbsp;`isCollapsing: boolean`<br>&nbsp;&nbsp;`mode: 'read' \| 'reply' \| 'forward' \| null`<br>`}` |
| **Zustand Stores** | • `useConversationStore` (expandConversation, collapseConversation, dismissConversation, setConversationMode) |
| **Custom Hooks** | • `useAnimations()` - For collapse timeout + bezel animation |
| **Local State** | • `isHovered: boolean` - Hover state for reveal effects<br>• `collapseTimeoutId: number \| null` - Tracks scheduled collapse |
| **Child Components** | • `<ActionButtons />` (archive/delete)<br>• `<ConversationDetails />` (preview + metadata)<br>• `<ComposerBox />` (if mode is 'reply' or 'forward') |
| **Event Handlers** | • `onClick` → `expandConversation()` if collapsed<br>• `onMouseEnter` → schedules collapse cancel<br>• `onMouseLeave` → schedules collapse via `scheduleCollapseTimeout()` |
| **Notes** | • Wrapped in `React.memo` for performance<br>• Applies `mail-bites-card` class<br>• Auto-collapses after 600ms hover exit |

---

### ConversationDetails.tsx

**Description:** Expanded conversation preview with sender, subject, snippet, and action links (reply/forward).

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ConversationDetailsProps {`<br>&nbsp;&nbsp;`conversation: ConversationData`<br>&nbsp;&nbsp;`isExpanded: boolean`<br>&nbsp;&nbsp;`mode: 'read' \| 'reply' \| 'forward' \| null`<br>`}` |
| **Zustand Stores** | • `useConversationStore` (setConversationMode) |
| **Custom Hooks** | None |
| **Local State** | None |
| **Child Components** | • `<PreviewActions />` (reply/forward buttons) |
| **Event Handlers** | • `handleReplyClick()` → `setConversationMode(id, 'reply')`<br>• `handleForwardClick()` → `setConversationMode(id, 'forward')` |
| **Notes** | • Only renders if `isExpanded === true`<br>• Displays `conversation.snippet` + metadata<br>• Truncates long snippets |

---

### ActionButtons.tsx

**Description:** Archive and delete buttons that appear on card hover.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ActionButtonsProps {`<br>&nbsp;&nbsp;`conversationId: string`<br>&nbsp;&nbsp;`isVisible: boolean`<br>`}` |
| **Zustand Stores** | • `useConversationStore` (dismissConversation) |
| **Custom Hooks** | • `useAnimations()` - For bezel feedback on action |
| **Local State** | • `isAnimating: boolean` - Transient fade-out animation |
| **Child Components** | • SVG icons (archive, delete) |
| **Event Handlers** | • `handleArchive()` → `dismissConversation()` + Gmail API call<br>• `handleDelete()` → `dismissConversation()` + Gmail API call |
| **Notes** | • Opacity transitions on `isVisible` change<br>• Prevents click propagation to card |

---

## Composer Components

### ComposerBox.tsx

**Description:** Multi-mode composer for reply/forward/compose. Supports collapse, draft persistence, and send actions.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ComposerBoxProps {`<br>&nbsp;&nbsp;`mode: 'compose' \| 'reply' \| 'forward'`<br>&nbsp;&nbsp;`conversationId?: string`<br>&nbsp;&nbsp;`boxIndex?: number`<br>&nbsp;&nbsp;`isStandalone: boolean`<br>`}` |
| **Zustand Stores** | • `useComposerStore` (composeDrafts, sentEmails, saveDraft, sendEmail, removeComposeBox, expandedComposeIndex, setExpandedComposeIndex) |
| **Custom Hooks** | • `useAnimations()` - For rotation animation + bezel pulse (empty draft feedback) |
| **Local State** | • `isExpanded: boolean` - Controlled by props or store<br>• `isDirty: boolean` - Tracks unsaved changes<br>• `formRef: RefObject<HTMLFormElement>` - For form validation |
| **Child Components** | • `<CollapsedDraft />` (if collapsed)<br>• `<ComposerField name="to" />` (recipient)<br>• `<ComposerField name="subject" />` (subject line)<br>• `<ComposerField name="body" />` (message body)<br>• `<ComposerActions />` (send/close/attach) |
| **Event Handlers** | • `onExpand()` → `setExpandedComposeIndex(boxIndex)`<br>• `onCollapse()` → `setExpandedComposeIndex(null)` + save draft<br>• `onFieldChange()` → debounced `saveDraft()`<br>• `onSend()` → validate + `sendEmail()` + Gmail API call |
| **Notes** | • Standalone boxes positioned at bottom-right<br>• Nested boxes inside `<ConversationItem />`<br>• Empty draft validation triggers bezel pulse |

---

### ComposerField.tsx

**Description:** Reusable input/textarea field with label and validation state.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ComposerFieldProps {`<br>&nbsp;&nbsp;`name: 'to' \| 'subject' \| 'body'`<br>&nbsp;&nbsp;`label: string`<br>&nbsp;&nbsp;`value: string`<br>&nbsp;&nbsp;`onChange: (value: string) => void`<br>&nbsp;&nbsp;`placeholder?: string`<br>&nbsp;&nbsp;`isTextarea?: boolean`<br>&nbsp;&nbsp;`isRequired?: boolean`<br>&nbsp;&nbsp;`errorMessage?: string`<br>`}` |
| **Zustand Stores** | None (controlled via props) |
| **Custom Hooks** | None |
| **Local State** | • `isFocused: boolean` - Focus state for styling |
| **Child Components** | • `<input>` or `<textarea>` element<br>• Error message `<span>` (if `errorMessage` set) |
| **Event Handlers** | • `onChange` → calls parent `onChange(value)`<br>• `onFocus`, `onBlur` → updates `isFocused` |
| **Notes** | • Applies `mail-bites-composer-field` class<br>• Required fields show red border if empty on blur |

---

### ComposerActions.tsx

**Description:** Action buttons for sending email, closing composer, and attaching files.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface ComposerActionsProps {`<br>&nbsp;&nbsp;`onSend: () => void`<br>&nbsp;&nbsp;`onClose: () => void`<br>&nbsp;&nbsp;`onAttach?: () => void`<br>&nbsp;&nbsp;`isSending: boolean`<br>&nbsp;&nbsp;`canSend: boolean`<br>`}` |
| **Zustand Stores** | None (callbacks passed via props) |
| **Custom Hooks** | None |
| **Local State** | None |
| **Child Components** | • Send button (primary CTA)<br>• Close button (×)<br>• Attach button (📎 icon) - optional |
| **Event Handlers** | • `onClick` for each button → calls respective prop callback |
| **Notes** | • Send button disabled if `!canSend` or `isSending`<br>• Shows spinner on send button when `isSending` |

---

### CollapsedDraft.tsx

**Description:** Collapsed composer header showing recipient/subject preview. Click to expand.

| **Category** | **Details** |
|--------------|-------------|
| **Props** | `interface CollapsedDraftProps {`<br>&nbsp;&nbsp;`recipient: string`<br>&nbsp;&nbsp;`subject: string`<br>&nbsp;&nbsp;`onExpand: () => void`<br>`}` |
| **Zustand Stores** | None (controlled via props) |
| **Custom Hooks** | None |
| **Local State** | • `isHovered: boolean` - Hover feedback |
| **Child Components** | • Recipient preview `<span>`<br>• Subject preview `<span>`<br>• Expand icon (↕) |
| **Event Handlers** | • `onClick` → calls `onExpand()` |
| **Notes** | • Truncates long recipient/subject with ellipsis<br>• Applies `mail-bites-collapsed-draft` class |

---

## Custom Hooks

### useConversations

**Description:** Observes Gmail DOM and parses conversation data. Throttled to 300ms to prevent excessive re-renders.

| **Category** | **Details** |
|--------------|-------------|
| **Parameters** | `mainElement: HTMLElement \| null` - Gmail conversation list container |
| **Returns** | `void` (updates store directly) |
| **Zustand Stores** | • `useConversationStore` (setConversations) |
| **Dependencies** | • `conversationParser.ts` (extractConversationData)<br>• `throttle` utility |
| **Side Effects** | • Creates MutationObserver on `mainElement`<br>• Parses Gmail rows on DOM mutations<br>• Calls `setConversations()` with parsed data |
| **Cleanup** | • Disconnects MutationObserver on unmount |
| **Notes** | • Throttles parsing to 300ms<br>• Runs initial parse on mount<br>• Listens for childList/subtree changes |

---

### useAnimations

**Description:** Unified animation orchestration hook consolidating logic from AnimationController.ts.

| **Category** | **Details** |
|--------------|-------------|
| **Parameters** | None |
| **Returns** | `{`<br>&nbsp;&nbsp;`scheduleCollapseTimeout: (callback, delay?) => () => void`<br>&nbsp;&nbsp;`animateSearchTransform: (button, onHalfway, onComplete) => void`<br>&nbsp;&nbsp;`animateComposeRotation: (button, direction, onComplete) => void`<br>&nbsp;&nbsp;`animateBezelPulse: (element) => void`<br>&nbsp;&nbsp;`cancelAll: () => void`<br>`}` |
| **Zustand Stores** | None (pure animation utility) |
| **Dependencies** | • CSS animation classes from `animations.css` |
| **Side Effects** | • Schedules timeouts (tracked in `timeoutRefs`)<br>• Adds/removes CSS classes on DOM elements |
| **Cleanup** | • Cancels all pending timeouts on unmount |
| **Notes** | • `scheduleCollapseTimeout`: Returns cleanup function<br>• `animateSearchTransform`: 300ms rotation + shrink<br>• `animateComposeRotation`: +/x icon rotation<br>• `animateBezelPulse`: Empty draft feedback |

---

### useClickOutside

**Description:** Detects clicks outside a specified element. Used to close search/composer on outside click.

| **Category** | **Details** |
|--------------|-------------|
| **Parameters** | `ref: RefObject<HTMLElement>`, `handler: () => void` |
| **Returns** | `void` |
| **Zustand Stores** | None |
| **Dependencies** | None |
| **Side Effects** | • Attaches global `mousedown` listener<br>• Calls `handler` if click is outside `ref.current` |
| **Cleanup** | • Removes listener on unmount |
| **Notes** | • Uses `contains()` check for outside detection<br>• Common pattern for dropdown/modal close behavior |

---

## Zustand Store Interfaces

### useConversationStore

| **State Property** | **Type** | **Description** |
|--------------------|----------|-----------------|
| `conversations` | `ConversationData[]` | Parsed Gmail conversation data |
| `expandedId` | `string \| null` | ID of currently expanded card |
| `highlightedId` | `string \| null` | ID of highlighted card (keyboard nav) |
| `dismissedIds` | `Set<string>` | Set of archived/deleted conversation IDs |
| `conversationModes` | `Map<string, 'read' \| 'reply' \| 'forward'>` | Active mode per conversation |
| `collapsingId` | `string \| null` | ID of card currently collapsing (animation in progress) |
| `pendingHoverId` | `string \| null` | ID of card with pending collapse timeout |

| **Action** | **Signature** | **Description** |
|------------|---------------|-----------------|
| `setConversations` | `(conversations: ConversationData[]) => void` | Replaces conversation list with new data |
| `expandConversation` | `(id: string) => void` | Sets `expandedId` to `id`, clears collapse timeout |
| `collapseConversation` | `(id: string) => void` | Sets `expandedId` to `null`, triggers collapse animation |
| `dismissConversation` | `(id: string) => void` | Adds `id` to `dismissedIds`, removes from view |
| `setConversationMode` | `(id: string, mode: 'read' \| 'reply' \| 'forward') => void` | Sets active mode for conversation (opens composer) |

---

### useToolbarStore

| **State Property** | **Type** | **Description** |
|--------------------|----------|-----------------|
| `isSearchActive` | `boolean` | Whether search input is visible/active |
| `searchQuery` | `string` | Current search query text |
| `filterButtonOrder` | `('unread' \| 'read' \| 'draft')[]` | Current order of filter buttons (reorders on click) |
| `isFilterCollapsed` | `boolean` | Whether filter buttons are collapsed |

| **Action** | **Signature** | **Description** |
|------------|---------------|-----------------|
| `toggleSearch` | `() => void` | Toggles `isSearchActive`, clears `searchQuery` on close |
| `setSearchQuery` | `(query: string) => void` | Updates `searchQuery` value |
| `rotateFilterButtons` | `(clickedType: 'unread' \| 'read' \| 'draft') => void` | Moves clicked button to first position in `filterButtonOrder` |
| `toggleFilterCollapse` | `() => void` | Toggles `isFilterCollapsed` state |

---

### useComposerStore

| **State Property** | **Type** | **Description** |
|--------------------|----------|-----------------|
| `composeBoxCount` | `number` | Number of standalone compose boxes |
| `expandedComposeIndex` | `number \| null` | Index of expanded standalone box (null = all collapsed) |
| `composeDrafts` | `Map<number, DraftData>` | Draft data per compose box index |
| `sentEmails` | `Set<number>` | Indexes of boxes that have sent emails (for cleanup) |
| `isComposingAnimating` | `boolean` | Whether compose button rotation is in progress |

| **Action** | **Signature** | **Description** |
|------------|---------------|-----------------|
| `addComposeBox` | `() => void` | Increments `composeBoxCount`, triggers rotation animation |
| `removeComposeBox` | `(index: number) => void` | Removes draft + decrements count |
| `setExpandedComposeIndex` | `(index: number \| null) => void` | Expands/collapses standalone box at `index` |
| `saveDraft` | `(index: number, draft: DraftData) => void` | Saves draft data to `composeDrafts` map |
| `sendEmail` | `(index: number) => void` | Marks email as sent, adds to `sentEmails` set |

---

## Type Definitions (Shared)

### ConversationData

```ts
interface ConversationData {
  id: string                      // Gmail thread ID
  sender: string                  // Display name or email
  subject: string                 // Email subject line
  snippet: string                 // Preview text
  timestamp: string               // Formatted time (e.g., "10:30 AM")
  isUnread: boolean               // Unread status
  isDraft: boolean                // Draft status
  labels: string[]                // Gmail labels/categories
  hasAttachments: boolean         // Attachment indicator
}
```

### DraftData

```ts
interface DraftData {
  to: string                      // Recipient email(s)
  subject: string                 // Email subject
  body: string                    // Email body (plain text)
  attachments?: File[]            // Optional file attachments
  isDirty: boolean                // Has unsaved changes
  timestamp: number               // Last saved timestamp
}
```

---

## Component Interaction Flow

### Expand/Collapse Conversation

```
User hovers ConversationItem
  → isHovered = true
  → Cancels pending collapse timeout

User moves mouse away
  → onMouseLeave
  → scheduleCollapseTimeout(600ms)
  → After 600ms: collapseConversation(id)
  → ConversationItem receives isCollapsing = true
  → CSS animation plays
  → expandedId set to null
```

### Search Activation

```
User clicks Search ToolbarButton
  → toggleSearch() in useToolbarStore
  → isSearchActive = true
  → Toolbar re-renders with <SearchInput />
  → animateSearchTransform() plays rotation
  → Input auto-focuses
  
User types query
  → onChange → debounced setSearchQuery(300ms)
  → ConversationList filters conversations
```

### Compose Email

```
User clicks New Email ToolbarButton
  → addComposeBox() in useComposerStore
  → composeBoxCount increments
  → animateComposeRotation('open')
  → New <ComposerBox mode="compose" /> renders at bottom-right
  
User fills fields
  → onChange → debounced saveDraft()
  → composeDrafts map updated
  
User clicks Send
  → Validates fields
  → If empty: animateBezelPulse() for feedback
  → If valid: sendEmail() → Gmail API → removeComposeBox()
```

### Reply to Conversation

```
User expands ConversationItem
  → expandConversation(id)
  → expandedId = id
  → <ConversationDetails /> renders

User clicks Reply button
  → setConversationMode(id, 'reply')
  → conversationModes map updated
  → <ComposerBox mode="reply" /> renders inside ConversationItem
```

---

## Migration Checklist

### Phase 1: Foundation (5 steps)
- 1.1 Install React dependencies and update Vite config with React plugin
- 1.2 Create Zustand store slices (useConversationStore, useToolbarStore, useComposerStore) with all state properties and actions
- 1.3 Create unified useAnimations hook with all animation functions (scheduleCollapseTimeout, animateSearchTransform, animateComposeRotation, animateBezelPulse, cancelAll)
- 1.4 Create root component skeleton in index.tsx with React.StrictMode, mainElement state, and isOverlayVisible state
- 1.5 Set up store index.ts to export all stores

### Phase 2: Toolbar (8 steps)
- 2.1 Create ToolbarButton component with ToolbarButtonProps interface, icon rendering from constants.ts, and hover state
- 2.2 Create Toolbar container with gradient overlay, wire up useToolbarStore and useComposerStore, implement handleNewEmailClick with useAnimations
- 2.3 Create SearchInput with controlled input, debounced onChange (300ms), inputRef auto-focus, Escape key handler, and onBlur close behavior
- 2.4 Wire up useToolbarStore actions (setSearchQuery, toggleSearch) in SearchInput
- 2.5 Create FilterButtons with rotatingType state, wire up useToolbarStore (filterButtonOrder, isFilterCollapsed), implement handleFilterClick with rotation animation
- 2.6 Render dynamically ordered ToolbarButton components and vertical divider in FilterButtons
- 2.7 Render complete Toolbar in root index.tsx component
- 2.8 Test toolbar interactions (new email, search transform, filter rotation)

### Phase 3: Conversation List (10 steps)
- 3.1 Create ConversationList container, wire up useConversationStore and useToolbarStore, implement search and filter logic with containerRef
- 3.2 Create ConversationItem with ConversationItemProps, wire up useConversationStore actions, add isHovered and collapseTimeoutId state
- 3.3 Implement expand/collapse behavior in ConversationItem (onClick, onMouseEnter, onMouseLeave with useAnimations scheduleCollapseTimeout)
- 3.4 Create ActionButtons with ActionButtonsProps, wire up dismissConversation and animateBezelPulse, render archive/delete SVG icons with opacity transitions
- 3.5 Render ActionButtons inside ConversationItem with conversationId and isHovered props, position top-right with click propagation prevention
- 3.6 Create ConversationDetails with ConversationDetailsProps, wire up setConversationMode, render sender/subject/snippet/timestamp with truncation
- 3.7 Add reply and forward action links to ConversationDetails with conditional rendering based on isExpanded
- 3.8 Render ConversationDetails inside ConversationItem with conversation and isExpanded props
- 3.9 Create useConversations hook with throttled (300ms) MutationObserver, import extractConversationData, wire up setConversations, add cleanup
- 3.10 Wire useConversations into root index.tsx, add Gmail container query, wrap ConversationItem/ActionButtons/ConversationDetails with React.memo, render ConversationList

### Phase 4: Composer (9 steps)
- 4.1 Create ComposerField with ComposerFieldProps, isFocused state, render input/textarea based on prop, implement onChange/onFocus/onBlur, add error message and validation styling
- 4.2 Create ComposerActions with ComposerActionsProps, render Send/Close/Attach buttons with disabled logic and spinner when isSending
- 4.3 Create CollapsedDraft with CollapsedDraftProps, isHovered state, render recipient/subject previews with truncation and expand icon, implement onClick → onExpand
- 4.4 Create ComposerBox skeleton with ComposerBoxProps, wire up useComposerStore (all draft/send/expand actions), import useAnimations
- 4.5 Add isExpanded, isDirty, formRef state to ComposerBox, implement onExpand/onCollapse/onFieldChange handlers with debounced saveDraft
- 4.6 Implement form validation and onSend handler in ComposerBox with empty draft validation, animateBezelPulse feedback, sendEmail + removeComposeBox sequence
- 4.7 Render CollapsedDraft and ComposerField components (to/subject/body) in ComposerBox with conditional logic, add ComposerActions at bottom
- 4.8 Add standalone positioning (bottom-right) and nested positioning (inside card) styles to ComposerBox
- 4.9 Render standalone ComposerBox instances in root index.tsx (map composeBoxCount), render nested ComposerBox inside ConversationItem with conditional mode rendering

### Phase 5: Integration & Testing (16 steps)
- 5.1 Create useClickOutside hook with ref and handler parameters, implement mousedown listener with contains() check, add cleanup
- 5.2 Import and wire useClickOutside for SearchInput in Toolbar and standalone ComposerBox in index.tsx
- 5.3 Remove legacy files (EventCoordinator.ts, UIState.ts, ToolbarBuilder.ts, ConversationItemBuilder.ts, ResponseBoxBuilder.ts, AnimationController.ts, minimalInboxRenderer.ts)
- 5.4 Update build script to use React JSX transform
- 5.5 Test toolbar interactions (new email → compose box, search → transform animation, filter rotation)
- 5.6 Test conversation interactions (expand on click, collapse on hover exit after 600ms)
- 5.7 Test action buttons (archive/delete → dismissConversation)
- 5.8 Test conversation details (reply/forward → composer opens in card)
- 5.9 Test composer field interactions (changes → debounced saveDraft)
- 5.10 Test composer send validation (empty fields → bezel pulse, valid fields → email sent + box removed)
- 5.11 Test composer close (draft persisted)
- 5.12 Test click outside behavior (search closes, composer stays open)
- 5.13 Run React DevTools profiler, verify React.memo prevents re-renders on ConversationItem/ActionButtons/ConversationDetails
- 5.14 Verify 300ms throttle on useConversations parsing, check for excessive re-renders
- 5.15 Test keyboard navigation (Tab, Enter, Escape), verify Gmail navigation updates conversations
- 5.16 Audit z-index layering and verify no style conflicts with Gmail UI, compare bundle size vs vanilla implementation

---

## Notes

- **Performance:** All components wrapped in `React.memo` where appropriate. Throttle parsing at 300ms.
- **Animations:** CSS-first with `useAnimations` hook. Framer Motion deferred.
- **State:** Zustand slices replace `UIState` class. No localStorage initially.
- **Testing:** Defer virtualization (react-window) until real-world performance issues observed.
- **Gmail Constraints:** High z-index (2147483646), no Shadow DOM, event delegation on root.

---

**Last Updated:** Based on React Migration Proposal (Revised) - 2024
