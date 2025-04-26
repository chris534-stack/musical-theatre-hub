# Changelog

## [Stable Release] - 2025-04-25

### Major Features & Improvements
- **Admin Permissions:**
  - The "+ Add Volunteer Request" button and modal are now visible only to admins using the `useIsAdmin` hook.

- **TypeScript & Linting Fixes:**
  - Removed unsupported props (`open`, `onOpen`, `onClose`, `onBlur`) from the `DatePicker` component to resolve type errors.
  - Added explicit types to callback parameters (e.g., `e: any`) to fix implicit `any` errors in API routes.
  - Added missing imports, such as `DatePicker` in `calendar.tsx`.
  - Installed `@types/nodemailer` and resolved dependency issues using `--legacy-peer-deps`.

- **Build & Stability:**
  - Ensured the project builds cleanly with no TypeScript or lint errors.
  - Confirmed that the development server can be started and provided instructions for LAN access.

- **General Improvements:**
  - Streamlined event creation logic for better type safety and clarity.
  - Improved error handling and code maintainability in several API routes and components.

### Other Notable Changes
- Updated git history to reflect all recent stability and permission improvements.
- Added and updated supporting files for new features and bugfixes.

---

For a detailed history of changes, see commit messages in the repository.
