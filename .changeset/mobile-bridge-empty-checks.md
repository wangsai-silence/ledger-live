---
"live-mobile": patch
---

Migrate mobile empty-account checks (account/portfolio screens, asset screen, select-account, quick-actions, transfer drawer, analytics operations list, device-scan add-account flow) from the deprecated isAccountEmpty top-level helper to bridge-resolved equivalents. Replace areAccountsEmptySelector with the new useAreAccountsEmpty hook.
