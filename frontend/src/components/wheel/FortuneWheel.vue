<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  prizes:      { type: Array,   default: () => [] },
  spinning:    { type: Boolean, default: false },
  targetIndex: { type: Number,  default: -1 },
});
const emit = defineEmits(['spin-end']);

const ITEM_W  = 96;
const GAP     = 8;
const STEP    = ITEM_W + GAP;
const REPS    = 40;

const containerRef = ref(null);
const tx = ref(0);

const track = computed(() => {
  const n = props.prizes.length;
  if (!n) return [];
  const out = [];
  for (let r = 0; r < REPS; r++)
    props.prizes.forEach((p, i) => out.push({ ...p, _uid: r * n + i, _i: i }));
  return out;
});

// ── animation ─────────────────────────────────────────────────────────────────
let raf   = null;
let phase = 'idle';
let prev  = null;
let t0    = null;
let from  = 0;
let to    = 0;

const IDLE_SPD = 45;    // px / sec during idle (чуть медленнее фона)
const SPIN_MS  = 10000; // полная длительность анимации (10 сек)
const LAPS     = 12;    // минимум оборотов

// Двухфазное замедление:
// 0–72% времени — быстрая линейная фаза (95% пути)
// 72–100%       — очень плавная остановка (последние 5%)
function easeSpinOut(t) {
  const split = 0.72;
  const fast  = 0.95;
  if (t <= split) {
    return (t / split) * fast;
  }
  const t2 = (t - split) / (1 - split);
  return fast + (1 - fast) * (1 - Math.pow(1 - t2, 6));
}

function frame(now) {
  const dt = prev != null ? (now - prev) / 1000 : 0;
  prev = now;

  if (phase === 'idle') {
    tx.value -= IDLE_SPD * dt;
    const n = props.prizes.length;
    if (n > 0) {
      const loopLen = n * STEP;
      // seamless jump: shift one prize-cycle forward, visually identical
      if (tx.value < -(loopLen * 20)) tx.value += loopLen;
    }
  } else if (phase === 'spin') {
    if (!t0) t0 = now;
    const t = Math.min((now - t0) / SPIN_MS, 1);
    tx.value = from + (to - from) * easeSpinOut(t);
    if (t >= 1) {
      phase = 'idle';
      prev  = null;
      t0    = null;
      emit('spin-end');
    }
  }

  raf = requestAnimationFrame(frame);
}

function cw() {
  return containerRef.value?.offsetWidth ?? 375;
}

function initIdle() {
  const n = props.prizes.length;
  if (!n || raf) return;
  // Start 10 full prize-cycles into the track so there's runway on both sides
  tx.value = cw() / 2 - ITEM_W / 2 - 10 * n * STEP;
  phase = 'idle';
  prev  = null;
  raf   = requestAnimationFrame(frame);
}

function startSpin(winIdx) {
  const n = props.prizes.length;
  if (!n) return;

  const center    = cw() / 2 - ITEM_W / 2;
  const minTravel = LAPS * n * STEP;

  phase = 'spin';
  t0    = null;
  from  = tx.value;
  to    = from - (LAPS + 3) * n * STEP; // fallback target

  for (let i = 0; i < track.value.length; i++) {
    if (track.value[i]._i !== winIdx) continue;
    const candidate = center - i * STEP;
    if (candidate < from - minTravel) { to = candidate; break; }
  }
}

watch(
  () => [props.spinning, props.targetIndex],
  ([spinning, idx]) => { if (spinning && idx >= 0) startSpin(idx); },
);

watch(() => props.prizes.length, () => initIdle());

onMounted(() => initIdle());
onUnmounted(() => { if (raf) cancelAnimationFrame(raf); raf = null; });
</script>

<template>
  <div class="case-wrap">
    <!-- top pointer arrow -->
    <div class="case-arrow case-arrow--top">
      <svg width="22" height="13" viewBox="0 0 22 13">
        <path d="M11 13 L0 0 L22 0 Z" fill="var(--accent)" />
      </svg>
    </div>

    <!-- reel -->
    <div ref="containerRef" class="case-reel">
      <div class="case-center-line" />
      <div class="case-fade case-fade--l" />
      <div class="case-fade case-fade--r" />

      <div class="case-track" :style="{ transform: `translateX(${tx}px)` }">
        <div
          v-for="item in track"
          :key="item._uid"
          class="case-item"
          :style="{ '--c': item.color || '#ff9000' }"
        >
          <img v-if="item.image" :src="item.image" class="case-item__img" alt="" />
          <div v-else class="case-item__no-img" />
          <span class="case-item__label">
            {{ item.label.length > 18 ? item.label.slice(0, 16) + '…' : item.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- bottom pointer arrow -->
    <div class="case-arrow case-arrow--bot">
      <svg width="22" height="13" viewBox="0 0 22 13">
        <path d="M11 0 L0 13 L22 13 Z" fill="var(--accent)" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.case-wrap {
  position: relative;
  margin: 12px 0;
  user-select: none;
  /* stop the translated track from creating page-level horizontal scroll */
  overflow: clip;
}

/* ── pointer arrows ── */
.case-arrow {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 20;
  filter: drop-shadow(0 0 5px var(--accent));
}

/* ── reel container ── */
.case-reel {
  position: relative;
  overflow: hidden;
  border-top: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
  background: #0d0d0d;
  padding: 10px 0;
  box-shadow:
    0 0 28px rgba(255, 144, 0, 0.12) inset,
    0 0 1px rgba(255, 144, 0, 0.4);
}

/* center marker line */
.case-center-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
  transform: translateX(-50%);
  box-shadow: 0 0 10px var(--accent);
  opacity: 0.85;
  z-index: 10;
  pointer-events: none;
}

/* edge fade-out gradients */
.case-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  z-index: 5;
  pointer-events: none;
}
.case-fade--l { left:  0; background: linear-gradient(to right, #0d0d0d 20%, transparent); }
.case-fade--r { right: 0; background: linear-gradient(to left,  #0d0d0d 20%, transparent); }

/* ── scrolling track ── */
.case-track {
  display: flex;
  gap: 8px;
  will-change: transform;
}

/* ── individual item card ── */
.case-item {
  flex-shrink: 0;
  width: 96px;
  height: 106px;
  background: #181818;
  border-radius: 8px;
  border-bottom: 3px solid var(--c);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px 4px;
  gap: 6px;
  overflow: hidden;
}

.case-item__img {
  width: 62px;
  height: 62px;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}

.case-item__no-img {
  width: 62px;
  height: 62px;
  border-radius: 6px;
  background: var(--c);
  opacity: 0.25;
  flex-shrink: 0;
}

.case-item__label {
  font-size: 10px;
  font-weight: 700;
  color: #c0c0c0;
  text-align: center;
  line-height: 1.2;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
