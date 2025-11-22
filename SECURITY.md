# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Suggestman, please report it by emailing the maintainers. Please do **NOT** open a public issue for security vulnerabilities.

When reporting, please include:
- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)

We will respond to security reports within 48 hours and work with you to address the issue promptly.

## Security Best Practices

### Environment Variables

**Never commit sensitive information to the repository:**
- `.dev.vars` contains secrets and is excluded from Git via `.gitignore`
- Use `.dev.vars.example` as a template (contains no actual secrets)
- For production deployments, use Cloudflare Workers secrets:
  ```bash
  wrangler secret put GITHUB_CLIENT_ID
  wrangler secret put GITHUB_CLIENT_SECRET
  wrangler secret put JWT_SECRET
  ```

### Authentication

- **GitHub OAuth**: Used for user authentication
  - Register your OAuth app at: https://github.com/settings/developers
  - Keep your `GITHUB_CLIENT_SECRET` secure and rotate it periodically
  - Use different OAuth apps for development and production

- **JWT Tokens**: Used for session management
  - Generate a strong random secret using: `openssl rand -base64 32`
  - JWT tokens expire after 1 hour for security
  - Tokens are stored as HttpOnly cookies to prevent XSS attacks

### Password Security

- Passwords are hashed using SHA-256 before storage
- Password requirements:
  - Minimum 8 characters
  - Must include uppercase and lowercase letters
  - Must include at least one number

### Database Security

- Cloudflare D1 database is isolated per environment
- Use different `database_id` for development and production
- Never expose database IDs or connection strings publicly

## Known Security Considerations

1. **SHA-256 for Password Hashing**: While functional, consider migrating to bcrypt or Argon2 for production use.
2. **CORS Configuration**: Ensure proper CORS headers are set for production deployments.
3. **Rate Limiting**: Implement rate limiting for authentication endpoints to prevent brute force attacks.

## Updates and Patches

Security patches will be released as soon as possible after discovery. Users are encouraged to:
- Keep dependencies up to date: `npm update`
- Monitor for security advisories: `npm audit`
- Review Cloudflare Workers security best practices

## Responsible Disclosure

We appreciate the security research community's efforts in keeping Suggestman secure. Security researchers who responsibly disclose vulnerabilities will be acknowledged in release notes (if desired).
