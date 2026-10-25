# 2035 Virtual Reunion

A static speaking activity for Unit 2 future tenses. Eight groups of three share a career and choose one of three project directions. The original five careers are retained, with clean energy, coastal restoration and urban farming added.

## Classroom behaviour

- A group receives one profession on its first reveal. Reopening that group reads its saved profession instead of drawing another one.
- Every group has a different profession. A selected project direction stays with that group.
- Assignments, project choices and recorded votes are saved in local storage on the current browser and site. They survive a refresh; they are not synchronised across devices.
- **Start a new class** clears the current class only after confirmation.
- Expanded briefs include project descriptions, a practical decision, a problem to solve, three speaking prompts and an optional model conversation.

## Files and deployment

Serve `index.html`, `styles.css`, `projects.js`, `app.js` and `assets/` together. No build step or external scripts are required. The Netlify publish directory is the repository root.

## Images

The two locally bundled image atlases were created with the built-in image generation tool as photorealistic illustrations of fictional project teams. Their original pixels are retained; CSS selects a quadrant for each career. [Asset details and prompts](assets/README.md).

## Validation

JavaScript syntax and all 24 project records were checked. Browser checks cover eight distinct assignments, reopening a saved group, retaining its selected project after refresh, challenge questions, votes, results and cancelling a new-class reset. A 390px embedded viewport is used to inspect the mobile layout.
