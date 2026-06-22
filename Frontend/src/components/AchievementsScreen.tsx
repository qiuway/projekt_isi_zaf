import { achievements } from '../data/mockData';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface AchievementsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function AchievementsScreen({ onNavigate }: AchievementsScreenProps) {
  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">OSIĄGNIĘCIA</div>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement) => (
          <section className="achievement-card" key={achievement.id}>
            <div className="achievement-icon" aria-hidden="true">
              {achievement.icon}
            </div>

            <div className="achievement-content">
              <div className="achievement-line">
                <span>Nazwa osiągnięcia</span>
                <strong>{achievement.name}</strong>
              </div>
              <div className="achievement-line">
                <span>Opis osiągnięcia</span>
                <strong>{achievement.description}</strong>
              </div>
              <div className="achievement-line two-up">
                <div>
                  <span>Data zdobycia</span>
                  <strong>{achievement.earnedAt}</strong>
                </div>
                <div>
                  <span>Ilość punktów</span>
                  <strong>{achievement.points} pkt</strong>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
