# Publishing the Peppol UBL check

The Action and CLI are developed in `peppol-ubl-check/` in the InvoiceVerify
project and published as the public repository
[kalmwerk/peppol-ubl-check](https://github.com/kalmwerk/peppol-ubl-check),
used as `uses: kalmwerk/peppol-ubl-check@v1`. The website's tool page
(`/tools/peppol-github-action`) links the repository and offers the same
folder as a zip with its SHA-256 checksum.

The repository, the zip and this folder hold the same files: everything here
except `node_modules/` and `coverage/`.

Status (17 Nov 2026): public on GitHub since v1.0.0 and ready for the GitHub
Marketplace listing (see below), which waits on the account owner; the npm
package is still to do.

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
   - Attach the zip and `.sha256` file from `public/downloads/`.
   - Tick **Set as a pre-release**, then **Publish release**. The Release
     workflow writes the notes; `v1` stays where it is.
4. Check the pre-release: the tag points at the main commit CI passed on, the
   notes match the changelog, and the attached zip's SHA-256 is the one in
   `src/lib/peppol-action.ts`. Then edit the release, untick **Set as a
   pre-release**, tick **Set as the latest release** and save. That fires the
   Release workflow's `released` event, which moves the `v1` tag, so
   `uses: kalmwerk/peppol-ubl-check@v1` picks the release up. Check that `v1`
   points at the new tag. (Publishing straight as a full release also works:
   then `v1` moves right away.)
5. Publish the website. A breaking change gets `v2.0.0`, and the docs and
   examples move to `@v2`.

## GitHub Marketplace (once)

GitHub lists an Action straight away, without review, when its repository is
public, holds a single `action.yml` at the root, and its `name` isn't already
used by another listing, a GitHub user or organisation, a Marketplace category
or a GitHub feature. Workflow files no longer stand in the way (GitHub dropped
that rule from its docs). `test/metadata.test.ts` checks the rest: the one
`action.yml`, a supported badge icon and colour, a description of at most 125
characters with the words people search for (Peppol, UBL, EN 16931 / EN16931,
e-invoice), and a README that starts with the workflow, then the conformance
statement and the disclosure of the links to InvoiceVerify.

Checked 17 Nov 2026: no listing, user or organisation uses the name
`Peppol UBL check by InvoiceVerify`
(`https://github.com/marketplace/actions/peppol-ubl-check-by-invoiceverify`
was free).

Signed in as kalmwerk, the first time (about 15 minutes):

1. Two-factor authentication: **Settings → Password and authentication →
   Enable two-factor authentication**, with an authenticator app; keep the
   recovery codes. GitHub asks for it when publishing to Marketplace, and the
   account needs it before 28 Dec 2026 anyway.
2. Open the release to list, the newest `v1.x.y` (not the release called `v1`,
   which only describes the moving tag), and choose **Edit** (or, for a draft,
   open it).
3. Under **Release Action**, tick **Publish this Action to the GitHub
   Marketplace**. The first time the box is greyed out: follow the link
   **accept the GitHub Marketplace Developer Agreement**, accept it, and come
   back to the release.
4. Wait for **Everything looks good!** If GitHub says the name is taken,
   change `name:` in `action.yml` and `ACTION_NAME` in
   `src/lib/peppol-action.ts` together, rebuild, and release again.
5. **Primary Category: Continuous integration. Another Category: Code
   quality** (what the other e-invoice validators use).
6. **Update release** (or **Publish release** for a draft) and confirm with
   the two-factor code.
7. Copy the Marketplace link, set `ACTION_MARKETPLACE_URL` to it in
   `src/lib/peppol-action.ts`, update the status check in
   `src/lib/peppol-action.test.ts` and publish the site. The status line on
   every page ("On GitHub now; Marketplace listing coming soon") becomes "On
   GitHub Marketplace", the page gets a Marketplace button and the structured
   data lists the listing.

Later releases appear on the listing by ticking the same box when publishing
them (step 3 of "Release v1.x.y"); the agreement and categories are kept.

## npm, for `npx peppol-ubl-check` (later)

1. An npm account `kalmwerk` (kalmwerk@gmail.com) with two-factor
   authentication. The name `peppol-ubl-check` was free on 12 Nov 2026.
2. Inside the published repository: `npm pack --dry-run` lists what goes out
   (`dist/cli.js` and the docs, nothing else), then `npm publish --access public`.
3. In `src/lib/peppol-action.ts` set `CLI_ON_NPM` to `true`: the page then
   shows `npx peppol-ubl-check` instead of "planned". Publish the site.
