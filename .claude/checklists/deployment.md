# Deployment Checklist

Target: [DEPLOYMENT_TARGET]

- [ ] `[LINT_COMMAND]` passes
- [ ] `[TEST_COMMAND]` passes
- [ ] `[BUILD_COMMAND]` succeeds
- [ ] Environment variables configured for target
- [ ] Migrations (if any) ready and reversible
- [ ] Feature flags set correctly
- [ ] Release notes prepared (`templates/release-notes.md`)
- [ ] Rollback plan documented
- [ ] Smoke test plan for post-deploy
