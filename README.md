# TAble

Hello! This is my 6.1040 personal project "TAble".

It's a tool for courses to manage scheduling, attendance, and covers for student workers in classes with labs or office hours.

It's deployed at [table.mit-sdg.dev](https://table.mit-sdg.dev/).

## P1
- You can see the design documentation for TAble [here](milestones/p1/design_doc.md).

## P2
- You can read the MVP documentation and watch the demo video [here](milestones/p2/user_journey.md)

## P3
- You can read the updated user journey and watch the updated demo video [here](milestones/p3/user_journey.md)
- You can see the visual design study [here](milestones/p3/visual_design_study.md)

## P4
- You can read the final design document and watch the final demo video [here](milestones/p4/final_design_document.md)

- You can read the final concept specifications [here](design/concepts/) and the final compositions (endpoints, reactions, and access rules) [here](design/compositions/)

## P5
- You can read my final deliverables [here](milestones/p5/personal_reflection.md)

## Setting up the app locally

This repo has all that you need to run TAble locally on your computer.

1. Pull the latest commit in this repo
2. Install dependencies: `bun install`
3. Copy `.env.example` to `.env`
4. Start MongoDB in a container (needs Podman running): `bun run db:up`
5. Run `bun run dev` to spin it up locally and try it out yourself.
6. Open the site at [http://localhost:3000](http://localhost:3000)

## Running the tests locally

The tests use Bun and a local DB.

1. Install dependencies: `bun install`
2. Copy `.env.example` to `.env`
3. Start MongoDB in a container (needs Podman running): `bun run db:up`.
4. Run the tests: `bun run test`

Each test file uses its own database (named `test_…`), which it empties before each test and drops when it finishes, so the tests never touch the app data. Concept tests are in `tests/concepts/`; tests of the full API (endpoints, permissions, and reactions) are in `tests/compositions/`.

<!-- to generate test file: cmd /c "bun run test > tests\output.txt 2>&1" -->

The output of the latest run is saved in [tests/output.txt](tests/output.txt).
