import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface HelpScreenProps {
  onNavigate: (screen: Screen) => void;
}

const helpItems = [
  {
    title: 'Jak zamówić jedzenie?',
    description: 'Wybierz restaurację, dodaj potrawy do koszyka, a następnie przejdź do ekranu koszyka i złóż zamówienie.',
  },
  {
    title: 'Jak zmienić dane konta?',
    description: 'Przejdź do ekranu ustawień lub profilu, aby zobaczyć sekcje związane z danymi osobowymi i adresem dostawy.',
  },
  {
    title: 'Gdzie znajdę swoje punkty i osiągnięcia?',
    description: 'Punkty są widoczne na górnym pasku, a osiągnięcia można otworzyć z rozwijanego menu pod ikoną trzech kresek.',
  },
  {
    title: 'Kontakt z pomocą',
    description: 'Telefon: +48 123 456 789 | Email: pomoc@foodflow.pl | Godziny wsparcia: 8:00 - 22:00',
  },
];

export function HelpScreen({ onNavigate }: HelpScreenProps) {
  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">POMOC</div>
      </div>

      <section className="help-card">
        {helpItems.map((item) => (
          <article className="help-item" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
