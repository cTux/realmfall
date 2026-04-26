import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import {
  BASE_ENEMY_XP,
  MASTERY_BASE_XP_REQUIREMENT,
  MASTERY_XP_GROWTH_RATE,
  MAX_PLAYER_LEVEL,
  PLAYER_FIRST_LEVEL_XP_REQUIREMENT,
  PLAYER_LAST_LEVEL_XP_REQUIREMENT,
} from '../../../game/config';
import {
  levelThreshold,
  masteryLevelThreshold,
} from '../../../game/progression';
import { storySurfaceDecorator } from './storybookHelpers';

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const ORDINARY_GROWTH_FACTOR = Math.pow(
  PLAYER_LAST_LEVEL_XP_REQUIREMENT / PLAYER_FIRST_LEVEL_XP_REQUIREMENT,
  1 / Math.max(1, MAX_PLAYER_LEVEL - 2),
);

const meta = {
  title: 'Catalogs/Progression XP',
  decorators: [storySurfaceDecorator],
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LevelRequirements: Story = {
  render: () => <ProgressionTablesStory />,
};

function ProgressionTablesStory() {
  const ordinaryRows = buildOrdinaryRows();
  const masteryRows = buildMasteryRows(20);

  return (
    <div
      style={{
        display: 'grid',
        gap: '24px',
        maxWidth: '1200px',
      }}
    >
      <section style={sectionStyle}>
        <header style={{ display: 'grid', gap: '8px' }}>
          <h1 style={titleStyle}>Player XP Progression</h1>
          <p style={paragraphStyle}>
            Base enemy reward: <strong>{formatNumber(BASE_ENEMY_XP)} XP</strong>
            . Level 1 to 2 needs{' '}
            <strong>{formatNumber(levelThreshold(1))} XP</strong>. Level 99 to
            100 needs <strong>{formatNumber(levelThreshold(99))} XP</strong>,
            which is <strong>{formatNumber(1_000_000)}</strong> enemy kills.
          </p>
          <p style={paragraphStyle}>
            Ordinary level formula:
            <code style={codeStyle}>
              XP(level) = round(
              {formatNumber(PLAYER_FIRST_LEVEL_XP_REQUIREMENT)}
              {' * '}
              {ORDINARY_GROWTH_FACTOR.toFixed(9)}
              ^(level - 1))
            </code>
          </p>
        </header>
        <Table
          columns={[
            'Current Level',
            'Next Level',
            'Required XP',
            'Enemy Kills',
            'Cumulative XP',
          ]}
          rows={ordinaryRows.map((row) => [
            `${row.currentLevel}`,
            row.nextLevel ? `${row.nextLevel}` : 'Cap',
            row.requiredXp ? formatNumber(row.requiredXp) : 'Cap',
            row.enemyKills ? formatNumber(row.enemyKills) : 'Cap',
            formatNumber(row.cumulativeXp),
          ])}
        />
      </section>

      <section style={sectionStyle}>
        <header style={{ display: 'grid', gap: '8px' }}>
          <h2 style={subtitleStyle}>Mastery XP Progression</h2>
          <p style={paragraphStyle}>
            Mastery formula:
            <code style={codeStyle}>
              XP(mastery) = round({formatNumber(MASTERY_BASE_XP_REQUIREMENT)}
              {' * '}
              {(1 + MASTERY_XP_GROWTH_RATE).toFixed(2)}^masteryLevel)
            </code>
          </p>
        </header>
        <Table
          columns={[
            'Current Mastery',
            'Next Mastery',
            'Required XP',
            'Enemy Kills',
          ]}
          rows={masteryRows.map((row) => [
            `${row.currentMastery}`,
            `${row.nextMastery}`,
            formatNumber(row.requiredXp),
            formatNumber(row.enemyKills),
          ])}
        />
      </section>
    </div>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148, 163, 184, 0.22)',
        borderRadius: '18px',
        overflow: 'auto',
        background:
          'linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.92))',
        boxShadow: '0 18px 42px rgba(2, 6, 23, 0.26)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '760px',
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={headerCellStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row[0]}-${row[1] ?? index}`}
              style={{
                backgroundColor:
                  index % 2 === 0 ? 'rgba(15, 23, 42, 0.26)' : 'transparent',
              }}
            >
              {row.map((value, valueIndex) => (
                <td key={`${value}-${valueIndex}`} style={bodyCellStyle}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildOrdinaryRows() {
  let cumulativeXp = 0;

  return Array.from({ length: MAX_PLAYER_LEVEL }, (_, index) => {
    const currentLevel = index + 1;
    const requiredXp =
      currentLevel < MAX_PLAYER_LEVEL ? levelThreshold(currentLevel) : null;
    cumulativeXp += requiredXp ?? 0;

    return {
      currentLevel,
      nextLevel: currentLevel < MAX_PLAYER_LEVEL ? currentLevel + 1 : null,
      requiredXp,
      enemyKills:
        requiredXp == null ? null : Math.round(requiredXp / BASE_ENEMY_XP),
      cumulativeXp,
    };
  });
}

function buildMasteryRows(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const requiredXp = masteryLevelThreshold(index);

    return {
      currentMastery: index,
      nextMastery: index + 1,
      requiredXp,
      enemyKills: Math.round(requiredXp / BASE_ENEMY_XP),
    };
  });
}

function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

const sectionStyle = {
  display: 'grid',
  gap: '16px',
} satisfies CSSProperties;

const titleStyle = {
  margin: 0,
  color: '#f8fafc',
  fontSize: '28px',
} satisfies CSSProperties;

const subtitleStyle = {
  margin: 0,
  color: '#f8fafc',
  fontSize: '22px',
} satisfies CSSProperties;

const paragraphStyle = {
  margin: 0,
  color: '#cbd5e1',
  lineHeight: 1.6,
} satisfies CSSProperties;

const codeStyle = {
  display: 'inline-block',
  marginLeft: '8px',
  padding: '2px 8px',
  borderRadius: '999px',
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  color: '#f8fafc',
} satisfies CSSProperties;

const headerCellStyle = {
  position: 'sticky',
  top: 0,
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#cbd5e1',
  backgroundColor: 'rgba(15, 23, 42, 0.98)',
  borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
} satisfies CSSProperties;

const bodyCellStyle = {
  padding: '12px 16px',
  color: '#f8fafc',
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  fontVariantNumeric: 'tabular-nums',
} satisfies CSSProperties;
