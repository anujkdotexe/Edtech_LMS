import { LeaderboardRepository } from './leaderboard.repository';
import { LeaderboardResponse } from './leaderboard.types';

export class LeaderboardService {
  static async getLeaderboard(currentUserId: string | null = null): Promise<LeaderboardResponse> {
    const topStudents = await LeaderboardRepository.getTopStudents(100);

    const rankedList = topStudents.map((student, idx) => ({
      rank: idx + 1,
      id: student.id,
      name: student.name,
      avatarUrl: student.avatarUrl,
      totalXp: student.totalXp,
      level: student.level,
    }));

    let currentUserRank: number | null = null;
    let currentUserXp = 0;

    if (currentUserId) {
      const foundInTop100 = rankedList.find((s) => s.id === currentUserId);
      if (foundInTop100) {
        currentUserRank = foundInTop100.rank;
        currentUserXp = foundInTop100.totalXp;
      } else {
        const userXp = await LeaderboardRepository.getUserXp(currentUserId);
        if (userXp) {
          currentUserXp = userXp.totalXp;
          const higherCount = await LeaderboardRepository.countStudentsWithHigherXp(currentUserXp);
          currentUserRank = higherCount + 1;
        }
      }
    }

    return {
      leaderboard: rankedList,
      currentUserRank,
      currentUserXp,
    };
  }
}
