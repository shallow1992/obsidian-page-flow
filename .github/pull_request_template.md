## Summary

<!-- Briefly describe the purpose and scope of this pull request -->

## Related Issues

<!-- Closes #123, Fixes #456 -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 📝 Documentation update
- [ ] 🎨 Style / Refactor (code cleanup, formatting)
- [ ] 🧪 Tests (adding or fixing tests)
- [ ] 🔧 Maintenance / Chore (dependencies, CI/CD, build tools)

## Checklist

- [ ] All commands were tested inside Docker (`docker compose run --rm page-flow npm test`)
- [ ] Type check and production build succeeded (`docker compose run --rm page-flow npm run build`)
- [ ] No Node.js built-ins (`fs`, `path`, `crypto`) used in runtime plugin code (maintains mobile compatibility)
- [ ] Unit tests added or updated for new features/bug fixes
- [ ] Documentation updated if applicable
