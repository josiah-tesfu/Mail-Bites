# Mail Bites
Mail Bites is an application designed to reduce the time and effort spent checking emails.

## Getting Started
Follow `docs/setup.md` for build and loading instructions, review the current architecture in `docs/architecture.md`, and check `docs/updates.md` for a concise history of repository changes. Testing guidance lives in `docs/testing.md`.

## Features
### Email Summarization
Leveraging the power of the OpenAI API, Mail Bites will summarize emails into concise bullet-point summaries. This feature allows users to quickly absorb the key points without the need to read the entire email. Customization options will be available to adjust the level of summarization based on user preferences and needs.

### Single-Email Focus
To avoid context-switching and maintain user focus, the interface is designed to display one email at a time. Once a user completes an action on the email, the email is replaced by the next one in the queue.

### Priority-Based Filtering
Mail Bites will prioritize user attention by only displaying unread emails under the 'primary' label. This cuts through the noise and clutter of less important or irrelevant emails.

### Minimized Distractions
The design philosophy revolves around minimizing context-switching and maintaining user focus. The interface will be clean, intuitive, and streamlined. Redundant information and unnecessary options would be eliminated, leaving only the most crucial actions and details in view.

## Use Cases
Mail Bites is particularly beneficial for those with a busy inbox. If you frequently receive a large volume of emails and need to process them efficiently without distraction or overwhelm, Mail Bites offers a refreshing solution.

## Technologies Used
Mail Bites is built using modern web technologies, including JavaScript (Node.js and React), Express.js for the backend server, and the Gmail API for managing email interactions. For secure user authentication, the application uses Google OAuth 2.0.

## Potential UI 1:
![mail-bites](https://github.com/josiah-tesfu/Mail-Bites/assets/71205057/392081e8-b48b-4972-9abe-e9f9cd075691)

## Potential UI 2:
![all-email-view](https://github.com/josiah-tesfu/Mail-Bites/assets/71205057/e03851cf-32ed-49ee-b80e-ffd3e6aa80a0)


## Current Progress:

Current phase: Build basic backend framework:

- Implemented user authentication using passport.js. Add error handling, improve routes, improve session management, handle refresh tokens.
- Next step: use oath2Client to handle Gmail data. Access emails for a logged in user; store data in the session; perform actions, including delete, archive, mark as unread etc.; iterate through all relevant emails.


Stay tuned for more updates as I continue to build and improve Mail Bites, making email management faster and more efficient!
