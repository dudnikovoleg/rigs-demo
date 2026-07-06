# Discovery

One plan-mode session turned a deliberately vague client brief into an
implementation-ready [spec.md](../spec.md). Closed by [`ea40c72`](https://github.com/dudnikovoleg/rigs-demo/commit/ea40c72).

## The prompt (verbatim)

```
Context: fresh repo, only CLAUDE.md exists.
Goal: understand the problem and produce an implementation-ready spec.
No implementation in this session.
Constraints: see CLAUDE.md. Output: docs/spec.md

Project context: The overall project is software for delivery of goods. It's not directly about it, but there are various oil rigs scattered across a certain area, and goods need to be ordered and delivered to them for various purposes — work, repairs, etc. ("for whatever is needed").
Task (test assignment): Build not a full app, just one screen as a baseline. If there's enough inspiration, it can be expanded, but that's not required.
Screen 1 — List of rigs: Display a list ("listing") of oil rigs scattered across a geographic region/sea. The exact display format is up to the developer — for example, a map showing the geographic region with rigs placed on it, or another approach, whatever the developer thinks works best.
Screen/popup for a specific rig: Each rig should have its own screen (or popup/child screen) containing general service information about the rig. Since the whole app is about the movement of goods, each rig is essentially a warehouse. It should show (display method is up to the developer — popup, child screen, etc.):

- What is currently at the warehouse (on the rig)
- What is currently on its way to the rig
- What is currently supposed to leave the rig
Displaying shipments/transfers: At the developer's discretion — either as a separate element/separate tab on the same rig screen, or in some other way — show shipments:
- What shipments currently exist
- Progress — where the cargo currently is
- What status the shipment is in
Important clarifications about the assignment format: The client deliberately did not provide a detailed list of fields — no need to "throw in a list of fields," because the goal is to see:
- Ability to work with implementation
- Overall vision of how this could look
The real level of detail on the actual project is deeper, but for the test assignment it doesn't need to be described that way.
Questions from the developer and the client's answers:
Question: In what form should the test assignment be delivered — as a file, in a repository? Does the code matter, or just the UI itself?
Answer: Preferably push it to a repository (a repo link), and if possible, additionally host it somewhere so the client can view it.
Question: What level of backend integration is expected?
Answer: If there's a place to host it, host it. Backend is not the developer's main skill, so not all entities need to be generated with real data persistence. It's enough to indicate that a certain entity/part actually pulls from a database (e.g. through some backend service). Example: a backend service that returns a basic fixture based on an existing file.
Submission format: A link to the repository (required). Preferably also a link to the hosted version (if possible).

Don't design the solution yet. Interview me using the AskUserQuestion tool — skip questions a good engineer would answer themselves, focus on: - ambiguous product requirements - UX decisions that materially affect implementation - data model boundaries - success criteria for the demo When you have enough: 1. Summarize your understanding. 2. List assumptions that remain. 3. Highlight decisions you made on my behalf. Then write docs/spec.md: what we're building, files and interfaces involved, what's out of scope, and an end-to-end verification step that proves the app works. Do not generate any code.
```

## Confirmed by the client (from the call)

The call fixed only the shape: one screen — a listing of rigs on a sea, each
rig a warehouse (on it / inbound / due to leave), shipments with progress and
status; display format and fields deliberately left to the developer.
Follow-up: repo link, hosted if possible, fixture-backed backend is enough.
