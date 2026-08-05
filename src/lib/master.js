export const MASTER_EMAIL = 'luthanogomes@gmail.com'

export function isMasterEmail(email) {
  return String(email || '').trim().toLowerCase() === MASTER_EMAIL
}
