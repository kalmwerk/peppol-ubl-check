# Publishing the Peppol UBL check

The Action and CLI are developed in `peppol-ubl-check/` in the InvoiceVerify
project and published as the public repository
[kalmwerk/peppol-ubl-check](https://github.com/kalmwerk/peppol-ubl-check),
used as `uses: kalmwerk/peppol-ubl-check@v1`. The website's tool page
(`/tools/peppol-github-action`) links the repository and offers the same
folder as a zip with its SHA-256 checksum.

The repository, the zip and this folder hold the same files: everything here
except `node_modules/` and `coverage/`.

Status (12 Nov 2026): public on GitHub since v1.0.0; the GitHub Marketplace
listing and the npm package are still to do.

## Before every release

1. The Kalmwerk GitHub account (kalmwerk@gmail.com) with two-factor
   authentication turned on: Marketplace requires it.
2. In the InvoiceVerify project:
   - add the version's section to `peppol-ubl-check/CHANGELOG.md` and bump the
     version in `peppol-ubl-check/package.json`, `package-lock.json` and
     `src/version.ts` (a test keeps them equal);
   - run `bun scripts/build-peppol-ubl-check.ts`. It refreshes the engine copy,
     the test invoices and `dist/`, and writes the new versioned zip and
     `.sha256` file to `public/downloads/`. Delete the previous version's two
     files and put the new checksum and size into `src/lib/peppol-action.ts`
     (the test prints both when they're stale);
   - `bunx vitest run src/lib/peppol-action.test.ts`, and inside
     `peppol-ubl-check/`: `npm ci && npm run check`.

## Release v1.x.y

1. Put the folder into the repository, including hidden files, without
   `node_modules/` (unzipping the new download gives exactly that folder):

   ```sh
   git clone https://github.com/kalmwerk/peppol-ubl-check.git /tmp/peppol-ubl-check-repo
   rsync -a --delete --exclude .git --exclude node_modules --exclude coverage \
     peppol-ubl-check/ /tmp/peppol-ubl-check-repo/
   cd /tmp/peppol-ubl-check-repo
   git add -A
   git commit -m "Peppol UBL check 1.x.y"
   git push origin main
   ```

2. Open the repository's **Actions** tab and wait for **CI** to go green. It
   type-checks, rebuilds `dist/` and fails if it differs, runs the tests
   (unit tests and end-to-end runs of `dist/index.js` and `dist/cli.js`), and
   runs the Action itself on a real runner against the test invoices: the
   valid ones must pass, the invalid ones must fail with the expected outputs.
3. Go to **Releases → Draft a new release**:
   - Tick **Publish this Action to the GitHub Marketplace** (see below for the
     first time).
   - **Choose a tag**: type `v1.x.y` and pick "Create new tag on publish",
     target `main`.
   - Release title: `v1.x.y`. Leave the description empty: the Release
     workflow fills it in from `CHANGELOG.md` with Kalmwerk's own
     `kalmwerk/release-notes-action`.
   - Attach the zip and `.sha256` file from `public/downloads/` if you like;
     the website keeps offering them either way.
   - **Publish release**.
4. The Release workflow writes the notes and moves the `v1` tag, so
   `uses: kalmwerk/peppol-ubl-check@v1` picks the release up. Check the release
   page shows the notes and that `v1` points at the new tag.
5. Publish the website. A breaking change gets `v2.0.0`, and the docs and
   examples move to `@v2`.

## GitHub Marketplace (once)

1. Signed in as kalmwerk, open the newest release, choose **Edit**, tick
   **Publish this Action to the GitHub Marketplace** and accept the GitHub
   Marketplace Developer Agreement when asked.
2. GitHub checks `action.yml` here. If it says the name is taken, change
   `name:` in `action.yml` and `ACTION_NAME` in `src/lib/peppol-action.ts`
   together, rebuild, and release again.
3. Primary category: **Continuous integration**. Secondary: **Code quality**.
4. Copy the Marketplace link (it looks like
   `https://github.com/marketplace/actions/peppol-ubl-check-by-invoiceverify`),
   set `ACTION_MARKETPLACE_URL` to it in `src/lib/peppol-action.ts`, update the
   status check in `src/lib/peppol-action.test.ts` and publish the site. The
   status line on every page ("On GitHub now; Marketplace listing coming
   soon") becomes "On GitHub Marketplace", the page gets a Marketplace button
   and the structured data lists the listing.

## npm, for `npx peppol-ubl-check` (later)

1. An npm account `kalmwerk` (kalmwerk@gmail.com) with two-factor
   authentication. The name `peppol-ubl-check` was free on 12 Nov 2026.
2. Inside the published repository: `npm pack --dry-run` lists what goes out
   (`dist/cli.js` and the docs, nothing else), then `npm publish --access public`.
3. In `src/lib/peppol-action.ts` set `CLI_ON_NPM` to `true`: the page then
   shows `npx peppol-ubl-check` instead of "planned". Publish the site.
