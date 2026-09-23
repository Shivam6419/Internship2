/**
 * Authoritative scoring calculation for skribbl.io clone
 */

/**
 * Calculates points for a player who guessed the word correctly.
 * Formula: Points decay proportionally based on the time remaining when guessed.
 * 
 * @param {number} timeLeft - Seconds remaining when the guess was made
 * @param {number} totalDrawTime - Total allotted draw time for the round in seconds
 * @returns {number} Points awarded (between 50 and 500)
 */
export function calculateGuesserPoints(timeLeft, totalDrawTime) {
  if (totalDrawTime <= 0) return 50;
  const ratio = Math.max(0, Math.min(1, timeLeft / totalDrawTime));
  // Scaled from 50 (last second) to 500 (instant guess)
  return Math.floor(ratio * 450) + 50;
}

/**
 * Calculates bonus points awarded to the drawer at the end of their turn.
 * The drawer is rewarded if other players successfully guess their drawing.
 * 
 * @param {number} correctGuessersCount - How many players guessed the word
 * @param {number} totalEligibleGuessers - Total players in room excluding drawer
 * @returns {number} Bonus points for the drawer (up to 300)
 */
export function calculateDrawerPoints(correctGuessersCount, totalEligibleGuessers) {
  if (totalEligibleGuessers <= 0 || correctGuessersCount <= 0) return 0;
  const ratio = Math.min(1, correctGuessersCount / totalEligibleGuessers);
  return Math.floor(ratio * 300);
}
