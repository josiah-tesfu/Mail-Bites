/**
 * AnimationController - Centralized animation timing management
 */
export class AnimationController {
  // Collapse animation timing
  static readonly COLLAPSE_TRANSITION_DURATION = 360;

  // More-things expansion timing
  static readonly MORE_THINGS_SLIDE_OUT_DURATION = 300;
  static readonly MORE_THINGS_ICON_SHOW_DELAY = 150; // 50% of slide-out

  // Search button animation timing
  static readonly SEARCH_ROTATION_DURATION = 300;
  static readonly SEARCH_SHRINK_DELAY = 150; // 50% of rotation
  static readonly SEARCH_TRANSFORM_DELAY = 300; // After rotation completes

  // Search input restoration timing
  static readonly SEARCH_RESTORE_DELAY = 10;

  private activeAnimations = new Map<string, number>();
  private completionCallbacks = new Map<string, () => void>();

  /**
   * Register an animation with tracking
   * @param id Unique identifier for the animation
   * @param timeoutId The timeout ID returned by setTimeout
   * @param onComplete Optional callback to execute when animation completes
   */
  private registerAnimation(id: string, timeoutId: number, onComplete?: () => void): void {
    this.activeAnimations.set(id, timeoutId);
    if (onComplete) {
      this.completionCallbacks.set(id, onComplete);
    }
  }

  /**
   * Cancel a specific animation
   * @param id The animation identifier
   */
  cancelAnimation(id: string): void {
    const timeoutId = this.activeAnimations.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.activeAnimations.delete(id);
      this.completionCallbacks.delete(id);
    }
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    for (const timeoutId of this.activeAnimations.values()) {
      clearTimeout(timeoutId);
    }
    this.activeAnimations.clear();
    this.completionCallbacks.clear();
  }

  /**
   * Complete an animation and trigger its callback
   * @param id The animation identifier
   */
  private completeAnimation(id: string): void {
    this.activeAnimations.delete(id);
    const callback = this.completionCallbacks.get(id);
    if (callback) {
      this.completionCallbacks.delete(id);
      callback();
    }
  }

  /**
   * Schedule callback after more-things slide-out delay
   */
  scheduleMoreThingsIconShow(callback: () => void): void {
    const timeoutId = window.setTimeout(() => {
      callback();
    }, AnimationController.MORE_THINGS_ICON_SHOW_DELAY);
    this.registerAnimation('more-things-icon-show', timeoutId);
  }

  /**
   * Orchestrate search button rotation + shrink + transform sequence
   * @param button The search button element
   * @param onShrink Callback when shrinking starts (halfway through rotation)
   * @param onTransform Callback when transformation should occur (after rotation)
   */
  animateSearchButtonToInput(
    button: HTMLButtonElement,
    onShrink: () => void,
    onTransform: () => void
  ): void {
    // Start rotation immediately
    button.classList.add('is-rotating');

    // Schedule shrink halfway through rotation
    const shrinkTimeoutId = window.setTimeout(() => {
      onShrink();
    }, AnimationController.SEARCH_SHRINK_DELAY);
    this.registerAnimation('search-shrink', shrinkTimeoutId);

    // Schedule transform after rotation completes
    const transformTimeoutId = window.setTimeout(() => {
      onTransform();
    }, AnimationController.SEARCH_TRANSFORM_DELAY);
    this.registerAnimation('search-transform', transformTimeoutId);
  }

  /**
   * Schedule callback after search restore delay
   * @param callback Function to execute after delay
   */
  scheduleSearchRestore(callback: () => void): void {
    const timeoutId = window.setTimeout(() => {
      callback();
    }, AnimationController.SEARCH_RESTORE_DELAY);
    this.registerAnimation('search-restore', timeoutId);
  }

  /**
   * Schedule collapse animation timeout fallback
   * @param callback Function to execute after collapse duration
   */
  scheduleCollapseTimeout(callback: () => void): void {
    const timeoutId = window.setTimeout(() => {
      callback();
    }, AnimationController.COLLAPSE_TRANSITION_DURATION);
    this.registerAnimation('collapse-timeout', timeoutId);
  }
}
