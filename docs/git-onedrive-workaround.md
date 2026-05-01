# Git + OneDrive Workaround

When this repo is opened under OneDrive, Git can fail to create `.git/index.lock`.
If that happens, use this flow.

## One-time setup

1. Clone outside OneDrive, for example:
   - `c:/Users/delan/GitHub/amcvaccine`
2. Keep OneDrive as your editing workspace if needed.

## Commit and push workflow

1. Sync working tree from OneDrive into the non-OneDrive clone:
   - `robocopy <onedrive_repo> <local_clone> /MIR /XD .git .vscode`
2. In the non-OneDrive clone:
   - `git status`
   - `git add -A`
   - `git commit -m "..."`
   - `git push origin main`

## Notes

- `/MIR` will propagate deletions from OneDrive to the clone.
- Excluding `.git` is required.
- Excluding `.vscode` avoids editor-specific noise.