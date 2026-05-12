/**
 * Format expected by @nestjs/jwt for expiration strings.
 * Examples: '15m', '7d', '1h', '30s'
 */
export type JwtDuration = `${number}${'s' | 'm' | 'h' | 'd'}`;