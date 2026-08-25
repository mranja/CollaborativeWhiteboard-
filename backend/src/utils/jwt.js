const DEFAULT_SECRET = 'supersecretkey123';

let warned = false;

/**
 * Single source of truth for the JWT signing secret.
 *
 * The controllers and the socket layer already fell back to a development
 * default when JWT_SECRET was unset, but the HTTP auth middleware rejected
 * every request with a 500 instead. That combination let users register and log
 * in and then fail on every authenticated call. All three now agree.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (!warned) {
    warned = true;
    console.warn('⚠️  JWT_SECRET is not set. Falling back to the development default — set JWT_SECRET in production.');
  }
  return DEFAULT_SECRET;
};

module.exports = { getJwtSecret, DEFAULT_SECRET };
