import { useTranslation } from 'react-i18next';
import { achievements } from '../data/mockData';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface AchievementsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function AchievementsScreen({ onNavigate }: AchievementsScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">
          {t('achievements.title')}
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement) => (
          <section className="achievement-card" key={achievement.id}>
            <div className="achievement-icon" aria-hidden="true">
              {achievement.icon}
            </div>

            <div className="achievement-content">
              <div className="achievement-line">
                <span>{t('achievements.labels.name')}</span>
                <strong>{achievement.name}</strong>
              </div>
              <div className="achievement-line">
                <span>{t('achievements.labels.description')}</span>
                <strong>{achievement.description}</strong>
              </div>
              <div className="achievement-line two-up">
                <div>
                  <span>{t('achievements.labels.earned_at')} </span>
                  <strong>{achievement.earnedAt}</strong>
                </div>
                <div>
                  <span>{t('achievements.labels.points')} </span>
                  <strong>
                    {achievement.points} {t('achievements.pts')}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}