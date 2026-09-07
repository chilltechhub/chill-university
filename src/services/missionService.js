/**
 * ============================================================
 * Mission Service
 * ------------------------------------------------------------
 * Responsible ONLY for mission logic.
 *
 * This service NEVER:
 * - Gives XP
 * - Saves to Supabase
 * - Updates React state
 *
 * It only checks mission progress.
 * ============================================================
 */

/**
 * Update all missions after a game.
 *
 * @param {Array} missions
 * @param {Object} gameResult
 * @returns {{
 *    missions: Array,
 *    completed: Array
 * }}
 */
export function updateMissionProgress(
  missions = [],
  gameResult = {}
) {
  const updated = [];
  const completed = [];

  missions.forEach((mission) => {
    const newMission = { ...mission };

    switch (mission.type) {

      // -----------------------------
      // Play Games
      // -----------------------------
      case "games_played":
        newMission.progress += 1;
        break;

      // -----------------------------
      // Correct Answers
      // -----------------------------
      case "correct_answers":
        newMission.progress +=
          gameResult.correct || 0;
        break;

      // -----------------------------
      // Questions Attempted
      // -----------------------------
      case "questions_attempted":
        newMission.progress +=
          gameResult.attempted || 0;
        break;

      // -----------------------------
      // Earn XP
      // -----------------------------
      case "earn_xp":
        newMission.progress +=
          gameResult.xp || 0;
        break;

      // -----------------------------
      // Earn Points
      // -----------------------------
      case "earn_points":
        newMission.progress +=
          gameResult.points || 0;
        break;

      // -----------------------------
      // Specific Subject
      // -----------------------------
      case "play_subject":

        if (
          mission.subject ===
          gameResult.subject
        ) {
          newMission.progress++;
        }

        break;

      // -----------------------------
      // Perfect Games
      // -----------------------------
      case "perfect_games":

        if (
          gameResult.correct ===
            gameResult.attempted &&
          gameResult.attempted > 0
        ) {
          newMission.progress++;
        }

        break;

      default:
        break;
    }

    // -----------------------------
    // Clamp Progress
    // -----------------------------

    if (
      newMission.progress >
      newMission.goal
    ) {
      newMission.progress =
        newMission.goal;
    }

    // -----------------------------
    // Completion Check
    // -----------------------------

    if (
      !newMission.completed &&
      newMission.progress >=
        newMission.goal
    ) {
      newMission.completed = true;

      newMission.completedAt =
        new Date().toISOString();

      completed.push(newMission);
    }

    updated.push(newMission);
  });

  return {
    missions: updated,
    completed,
  };
}

/**
 * Returns all active missions.
 */
export function getActiveMissions(
  missions = []
) {
  return missions.filter(
    (m) => !m.completed
  );
}

/**
 * Returns all completed missions.
 */
export function getCompletedMissions(
  missions = []
) {
  return missions.filter(
    (m) => m.completed
  );
}

/**
 * Returns missions by category.
 *
 * daily
 * weekly
 * longterm
 */
export function getMissionCategory(
  missions = [],
  category
) {
  return missions.filter(
    (m) => m.category === category
  );
}

/**
 * Returns mission completion percentage.
 */
export function getMissionProgress(
  mission
) {
  if (!mission.goal) return 0;

  return Math.round(
    (mission.progress /
      mission.goal) *
      100
  );
}