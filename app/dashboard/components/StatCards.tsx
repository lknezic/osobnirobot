'use client';

interface StatCard {
  label: string;
  value: string | number;
  color?: string;
}

interface StatCardsProps {
  cards: StatCard[];
}

export function StatCards({ cards }: StatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(24px)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            className="text-2xl font-bold mb-1"
            style={{ color: card.color || '#fff' }}
          >
            {card.value}
          </div>
          <div className="text-xs" style={{ color: '#888' }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
