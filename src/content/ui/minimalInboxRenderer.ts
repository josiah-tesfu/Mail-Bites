import type { ViewContext } from '../viewTracker';
import { logger } from '../logger';

/**
 * Extracts and renders the list of visible email subject lines within the Gmail
 * primary inbox. This renderer is intentionally simple—its goal is to validate
 * the architectural scaffolding rather than ship production UI.
 */
export class MinimalInboxRenderer {
  private container: HTMLElement | null = null;

  /**
   * Renders the overlay into the provided root. Repeated calls will re-render
   * the subject list based on the latest Gmail DOM state.
   */
  render(context: ViewContext, overlayRoot: HTMLElement): void {
    if (!context.mainElement) {
      logger.warn('MinimalInboxRenderer: Missing mainElement; skipping render.');
      return;
    }

    const subjects = this.collectSubjects(context.mainElement);
    logger.info('MinimalInboxRenderer: Rendering subjects.', {
      count: subjects.length,
      url: context.url
    });

    this.ensureContainer(overlayRoot);
    this.updateMarkup(subjects);
  }

  /**
   * Clears the overlay contents.
   */
  reset(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private ensureContainer(overlayRoot: HTMLElement): void {
    if (this.container && overlayRoot.contains(this.container)) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'mail-bites-inbox-list';
    overlayRoot.appendChild(container);
    this.container = container;
  }

  private updateMarkup(subjects: string[]): void {
    if (!this.container) {
      return;
    }

    if (subjects.length === 0) {
      this.container.innerHTML =
        '<p class="mail-bites-empty">No conversations detected in the Primary inbox.</p>';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'mail-bites-subjects';

    for (const subject of subjects) {
      const item = document.createElement('li');
      item.textContent = subject;
      list.appendChild(item);
    }

    this.container.innerHTML = '';
    this.container.appendChild(list);
  }

  /**
   * Navigates Gmail's inbox table structure to collect subject lines.
   */
  private collectSubjects(mainElement: HTMLElement): string[] {
    const rows = Array.from(
      mainElement.querySelectorAll<HTMLTableRowElement>('tr.zA')
    );

    const subjects = rows
      .map((row) => {
        // `span.bog` commonly contains the subject text.
        const subjectSpan = row.querySelector<HTMLSpanElement>('span.bog');
        if (subjectSpan && subjectSpan.textContent) {
          return subjectSpan.textContent.trim();
        }

        // Fallback: attempt to read aria-label or title attributes.
        const fallback =
          row.getAttribute('aria-label') ?? row.getAttribute('title') ?? '';
        return fallback.trim();
      })
      .filter((subject) => subject.length > 0);

    return subjects;
  }
}
