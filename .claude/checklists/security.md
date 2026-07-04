# Security Checklist

- [ ] No secrets in source or logs
- [ ] `.env`/keys/certs not read or committed
- [ ] Input validated and sanitized
- [ ] AuthN/AuthZ enforced where required
- [ ] Dependencies vetted; no known critical vulns
- [ ] No PII logged
- [ ] Error messages don't leak internals
- [ ] Permissions in `settings.json` still appropriate
