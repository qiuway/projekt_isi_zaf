import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface HelpScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function HelpScreen({ onNavigate }: HelpScreenProps) {
  const { t } = useTranslation();

  const helpItems = [
    {
      title: t('help.items.order.title'),
      description: t('help.items.order.description'),
    },
    {
      title: t('help.items.account.title'),
      description: t('help.items.account.description'),
    },
    {
      title: t('help.items.points.title'),
      description: t('help.items.points.description'),
    },
    {
      title: t('help.items.contact.title'),
      description: t('help.items.contact.description'),
    },
  ];

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">{t('help.title')}</div>
      </div>

      <section className="help-card">
        {helpItems.map((item, index) => (
          <article className="help-item" key={index}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
