// src/utils/matchScore.js
export const getMatchScore = (userA, userB) => {
  const countMatches = (arr1, arr2) =>
    arr1.filter((tag) => arr2.includes(tag)).length;

  let score = 0;
  score += countMatches(userA.interests, userB.interests) * 3;
  score += countMatches(userA.hobbies, userB.hobbies) * 2;
  score += countMatches(userA.skills, userB.skills) * 2;
  score += countMatches(userA.goals, userB.goals) * 1;

  return score;
};
