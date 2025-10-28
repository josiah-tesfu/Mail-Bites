# Known Issues

## Compose Draft Expansion Behavior

**Issue**: When clicking "Compose New Email" multiple times, all draft boxes remain expanded instead of only the most recent one being expanded.

**Expected**: Clicking compose should collapse the previously expanded draft and create the new draft in an expanded state.

**Current**: All drafts appear expanded regardless of `expandedComposeIndex` state.

**Debug Info**:
- State correctly shows only one box should be expanded (e.g., `Box 0: isExpanded=false`, `Box 1: isExpanded=true`)
- UI renders all boxes expanded despite correct state values
- `ResponseBoxBuilder.build()` receives correct `isExpanded` parameter
- Condition `if (isExpanded === false)` should trigger for collapsed state but does not affect rendering

**Next Steps**:
- Investigate CSS `.is-collapsed` class application
- Check if animation classes interfere with collapsed state
- Review DOM structure after render to verify collapsed class is applied
- Consider using display/visibility toggle instead of conditional rendering
