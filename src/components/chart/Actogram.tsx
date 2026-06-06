import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  Bar,
} from 'recharts';
import type { ActogramData, ActogramCycle, SleepBlock, TimeRange } from '@/hooks/useActogramData';

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGES: TimeRange[] = ['1W', '2W', '1M', '3M', '6M', '1Y', 'All'];

const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 56 };
const COL_WIDTH = 56; // pixels per cycle column

// Fixed chrome heights subtracted when computing chart height from window.innerHeight.
// TAB_BAR:     64px  — BottomTabBar (fixed, always present)
// PAGE_HEADER: 68px  — "Chart" heading + "N cycles" subtitle + pt-5/pb-2 padding
// RANGE_ROW:   52px  — the six range filter buttons
// BUFFER:      16px  — breathing room so the last Y tick label isn't clipped
const TAB_BAR     = 64;
const PAGE_HEADER = 68;
const RANGE_ROW   = 52;
const BUFFER      = 16;
const CHROME      = TAB_BAR + PAGE_HEADER + RANGE_ROW + BUFFER;

// Floor so the SVG never collapses on very small screens or during the brief
// window before the first resize event fires.
const MIN_CHART_HEIGHT = 280;

// ── Height hook ───────────────────────────────────────────────────────────────

// Derives a stable chart height from window.innerHeight minus all fixed chrome.
// Using window.innerHeight avoids the ResizeObserver feedback loop that occurs
// when the observer watches the chart's own container: SVG grows → container
// grows → observer fires → SVG grows again → infinite scroll.
function useChartHeight(): number {
  const calculate = () =>
    Math.max(window.innerHeight - CHROME, MIN_CHART_HEIGHT);

  // useState(calculate) runs calculate() once at mount as the initial value —
  // no useEffect needed for the initial measurement.
  const [height, setHeight] = useState(calculate);

  useEffect(() => {
    // Only update on subsequent window resize events.
    // The initial value is already correct from useState(calculate) above.
    const handler = () => setHeight(calculate());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return height;
}

// ── Helper functions ──────────────────────────────────────────────────────────

function formatYTick(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const rem  = minutes % 1440;
  const h    = Math.floor(rem / 60).toString().padStart(2, '0');
  const m    = (rem % 60).toString().padStart(2, '0');
  return days > 0 ? `(+${days}d) ${h}:${m}` : `${h}:${m}`;
}

function formatCalendarDate(yyyyMmDd: string): string {
  const [, mm, dd] = yyyyMmDd.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(dd).padStart(2, '0')} ${months[mm - 1]}`;
}

function formatLocalTime(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}

function formatDuration(startUtc: string, endUtc: string): string {
  const ms    = new Date(endUtc).getTime() - new Date(startUtc).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const mins  = Math.floor((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// ── Custom X axis tick (built as a closure inside Actogram) ──────────────────
//
// cyclesLookup is NOT passed as a prop — doing so produces a TS error because
// Recharts' TickProp<XAxisTickContentProps> doesn't include cyclesLookup, and
// TypeScript's contravariant function-parameter check rejects a required extra
// field.  Instead, makeXTick returns a closure that captures the lookup map,
// giving the returned function a prop type compatible with Recharts.

function makeXTick(lookup: Map<number, ActogramCycle>) {
  return function XAxisTick({
    x = 0,
    y = 0,
    payload,
  }: {
    x?: string | number;
    y?: string | number;
    payload?: { value: number };
  }) {
    if (!payload) return null;
    const cycle   = lookup.get(payload.value);
    const dateStr = cycle ? formatCalendarDate(cycle.calendarDate) : '';

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} fill="var(--circa-text-secondary)"
          textAnchor="middle" style={{ fontSize: 11 }}>
          {payload.value}
        </text>
        {dateStr && (
          <text x={0} y={0} dy={27} fill="var(--circa-text-muted)"
            textAnchor="middle" style={{ fontSize: 10 }}>
            {dateStr}
          </text>
        )}
      </g>
    );
  };
}

// ── Quality dots ──────────────────────────────────────────────────────────────

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Quality ${quality} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}
          className={i <= quality ? 'text-circa-accent-light' : 'text-circa-text-muted'}
          aria-hidden="true">●</span>
      ))}
    </div>
  );
}

// ── Tooltip overlay ───────────────────────────────────────────────────────────

interface TooltipOverlayProps {
  block: SleepBlock;
  cycle: ActogramCycle | undefined;
  onClose: () => void;
}

function TooltipOverlay({ block, cycle, onClose }: TooltipOverlayProps) {
  const tz        = block.ianaTimezone;
  const startTime = formatLocalTime(block.sleepStartUtc, tz);
  const wakeTime  = formatLocalTime(block.wakeUtc, tz);
  const duration  = formatDuration(block.sleepStartUtc, block.wakeUtc);
  const typeLabel = block.sessionType === 'nap' ? 'Nap' : 'Main Sleep';
  const dateStr   = cycle ? formatCalendarDate(cycle.calendarDate) : '';

  return (
    <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true">
      <div
        className="absolute bottom-20 left-4 right-4 bg-circa-surface border border-circa-border rounded-xl p-4 shadow-xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Sleep session details"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-circa-accent-subtle text-circa-accent-light text-xs font-semibold px-2 py-0.5 rounded-full">
              #{block.cycleNumber}
            </span>
            <span className="text-circa-text-secondary text-xs">{dateStr}</span>
          </div>
          <button onClick={onClose}
            className="text-circa-text-muted hover:text-circa-text-primary text-xl leading-none min-h-8 min-w-8 flex items-center justify-center"
            aria-label="Close">×</button>
        </div>
        <p className="text-circa-text-muted text-xs mb-2">{typeLabel}</p>
        <p className="text-circa-text-primary text-sm font-medium mb-3">
          {startTime} → {wakeTime}
          <span className="text-circa-text-secondary font-normal ml-2">· {duration}</span>
        </p>
        <QualityDots quality={block.quality} />
      </div>
    </div>
  );
}

// ── Main Actogram component ───────────────────────────────────────────────────

interface ActogramProps {
  data: ActogramData;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export default function Actogram({ data, selectedRange, onRangeChange }: ActogramProps) {
  const [selectedBlock, setSelectedBlock] = useState<SleepBlock | null>(null);

  // Width: measured from the container so horizontal scroll works correctly.
  // Height: derived from window.innerHeight (see useChartHeight above).
  //         Deliberately NOT measured from the chart container — doing so
  //         creates a feedback loop where SVG height drives container height
  //         drives SVG height, causing the chart to scroll endlessly downward.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(360);
  const chartHeight = useChartHeight();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { cycles, yMax } = data;

  // cyclesLookup for the tooltip overlay — built once per render from cycles.
  const cyclesLookup = new Map(cycles.map(c => [c.cycleNumber, c]));

  // renderXTick is recreated when cycles changes so the closure always has the
  // current cyclesLookup. makeXTick returns a function whose prop type contains
  // no extra fields, so it satisfies Recharts' TickProp<XAxisTickContentProps>.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderXTick = useMemo(() => makeXTick(cyclesLookup), [cycles]);

  // ── No data in range ───────────────────────────────────────────────────────

  if (cycles.length === 0) {
    return (
      <div>
        <RangeButtons selected={selectedRange} onChange={onRangeChange} />
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-circa-text-secondary text-sm">No sessions in this period.</p>
          <button type="button" onClick={() => onRangeChange('All')}
            className="text-circa-accent-light text-sm mt-2">
            Show all
          </button>
        </div>
      </div>
    );
  }

  // ── Chart sizing ───────────────────────────────────────────────────────────

  const minCycle   = cycles[0].cycleNumber;
  const maxCycle   = cycles[cycles.length - 1].cycleNumber;
  const chartWidth = Math.max(cycles.length * COL_WIDTH, containerWidth);

  const yTicks: number[] = [];
  for (let t = 0; t <= yMax; t += 360) yTicks.push(t);

  const allBlocks = cycles.flatMap(c => c.blocks);

  return (
    <div>
      <RangeButtons selected={selectedRange} onChange={onRangeChange} />

      {/* containerRef tracks width for horizontal scroll sizing */}
      <div ref={containerRef} style={{ overflowX: 'auto' }}>
        <ComposedChart
          width={chartWidth}
          height={chartHeight}
          margin={CHART_MARGIN}
          data={cycles.map(c => ({ x: c.cycleNumber }))}
        >
          <CartesianGrid vertical={false} stroke="var(--circa-border)" strokeDasharray="3 3" />

          <XAxis
            dataKey="x"
            type="number"
            domain={[minCycle - 0.5, maxCycle + 0.5]}
            ticks={cycles.map(c => c.cycleNumber)}
            tick={renderXTick}
            height={44}
            tickLine={false}
            axisLine={{ stroke: 'var(--circa-border)' }}
          />

          <YAxis
            type="number"
            domain={[0, yMax]}
            reversed={true}
            ticks={yTicks}
            tickFormatter={formatYTick}
            width={56}
            tick={{ fontSize: 10, fill: 'var(--circa-text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />

          {/*
            Invisible anchor Bar — required by Recharts 3.x.
            Without a real data series present, ReferenceArea has no internal
            scale to map x1/x2/y1/y2 into pixel positions and renders nothing.
          */}
          <Bar dataKey="x" opacity={0} isAnimationActive={false} />

          {allBlocks.map(block => (
            <ReferenceArea
              key={block.entryId}
              x1={block.cycleNumber - 0.4}
              x2={block.cycleNumber + 0.4}
              y1={block.startMinute}
              y2={block.endMinute}
              ifOverflow="visible"
              fill="var(--circa-accent)"
              fillOpacity={block.sessionType === 'nap' ? 0.35 : 0.85}
              stroke={block.sessionType === 'nap' ? 'var(--circa-accent)' : 'none'}
              strokeDasharray={block.sessionType === 'nap' ? '4 2' : undefined}
              style={{ cursor: 'pointer' }}
              // The click event from ReferenceArea carries Recharts internal
              // data we don't need — we capture the block directly from closure.
              onClick={() => setSelectedBlock(block)}
            />
          ))}
        </ComposedChart>
      </div>

      {selectedBlock && (
        <TooltipOverlay
          block={selectedBlock}
          cycle={cyclesLookup.get(selectedBlock.cycleNumber)}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}

// ── Range buttons ─────────────────────────────────────────────────────────────

function RangeButtons({ selected, onChange }: {
  selected: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto whitespace-nowrap">
      {RANGES.map(r => (
        <button key={r} type="button" onClick={() => onChange(r)}
          className={`rounded-full text-xs px-3 border min-h-9 ${
            selected === r
              ? 'text-circa-accent-light border-circa-accent-light'
              : 'text-circa-text-secondary border-circa-border'
          }`}>
          {r}
        </button>
      ))}
    </div>
  );
}
