import { motion } from 'framer-motion';
import { getAnchorRect } from '../animation/anchors';
import type { AnimationItem } from '../animation/types';
import { useAnimationStore } from '../store/animationStore';
import { CardView } from './cards/Card';
import { CARD_SIZE_PX, COLOR_HEX } from './cards/cardTheme';

const TOKEN_CLASS: Record<string, string> = {
  info: 'bg-slate-800/90 text-white ring-white/20',
  uno: 'bg-amber-400 text-amber-950 ring-white/60',
  danger: 'bg-rose-600 text-white ring-rose-200/60',
};

function centerFallback(): { cx: number; cy: number } {
  return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
}

function FlyingCard({ item }: { item: AnimationItem }) {
  const from = getAnchorRect(item.from) ?? centerFallback();
  const to = getAnchorRect(item.to) ?? from;
  const { w, h } = CARD_SIZE_PX.md;
  const startX = from.cx - w / 2;
  const startY = from.cy - h / 2;
  const endX = to.cx - w / 2;
  const endY = to.cy - h / 2;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{ width: w, height: h }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 0.85, rotate: item.kind === 'play' ? -8 : 8 }}
      animate={{ x: endX, y: endY, opacity: [0, 1, 1, 0], scale: 1, rotate: 0 }}
      transition={{
        duration: item.duration / 1000,
        delay: item.delay / 1000,
        ease: 'easeOut',
        times: [0, 0.18, 0.78, 1],
      }}
    >
      <CardView card={item.card ?? undefined} faceDown={item.faceDown} />
    </motion.div>
  );
}

function Burst({ item }: { item: AnimationItem }) {
  const at = getAnchorRect(item.from) ?? centerFallback();
  const tone = TOKEN_CLASS[item.tone ?? 'info'] ?? TOKEN_CLASS.info;

  return (
    <div
      className="pointer-events-none fixed z-[70]"
      style={{ left: at.cx, top: at.cy }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.span
          className={`inline-block rounded-full px-4 py-2 text-lg font-black uppercase tracking-wide shadow-2xl ring-2 ${tone}`}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.25, 1, 0.9] }}
          transition={{
            duration: item.duration / 1000,
            delay: item.delay / 1000,
            ease: 'easeOut',
            times: [0, 0.2, 0.62, 1],
          }}
        >
          {item.label}
        </motion.span>
      </div>
    </div>
  );
}

function WildFlash({ item }: { item: AnimationItem }) {
  const at = getAnchorRect(item.from) ?? centerFallback();
  const color = item.color ? COLOR_HEX[item.color] : '#ffffff';

  return (
    <div className="pointer-events-none fixed z-[70]" style={{ left: at.cx, top: at.cy }}>
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.span
          className="block h-24 w-24 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.6, 2.1] }}
          transition={{
            duration: item.duration / 1000,
            delay: item.delay / 1000,
            ease: 'easeOut',
            times: [0, 0.35, 1],
          }}
        />
      </div>
    </div>
  );
}

/** Full-screen overlay that plays the queued animations. Mounted once. */
export function AnimationLayer() {
  const items = useAnimationStore((store) => store.items);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[45]" aria-hidden>
      {items.map((item) => {
        if (item.kind === 'play' || item.kind === 'draw' || item.kind === 'deal') {
          return <FlyingCard key={item.id} item={item} />;
        }
        if (item.kind === 'wild') {
          return <WildFlash key={item.id} item={item} />;
        }
        return <Burst key={item.id} item={item} />;
      })}
    </div>
  );
}
