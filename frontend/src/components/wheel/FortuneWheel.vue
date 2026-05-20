<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  prizes: { type: Array, default: () => [] },
  spinning: { type: Boolean, default: false },
  targetIndex: { type: Number, default: -1 },
});

const emit = defineEmits(['spin-end']);

const rotation = ref(0);
const isAnimating = ref(false);
const size = 340;
const cx = size / 2;
const cy = size / 2;
const radius = size / 2 - 10;

const segments = computed(() => {
  const n = props.prizes.length || 1;
  const angle = 360 / n;
  const imgR = Math.min(28, 360 / n / 2.2);

  return props.prizes.map((prize, i) => {
    const startAngle = i * angle - 90;
    const endAngle = (i + 1) * angle - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const midAngle = startAngle + angle / 2;
    const midRad = (midAngle * Math.PI) / 180;

    const imgDist = radius * 0.52;
    const imgCx = cx + imgDist * Math.cos(midRad);
    const imgCy = cy + imgDist * Math.sin(midRad);

    const labelR = radius * 0.78;
    const tx = cx + labelR * Math.cos(midRad);
    const ty = cy + labelR * Math.sin(midRad);

    return {
      prize,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: prize.color || '#ff9000',
      label: prize.label,
      image: prize.image,
      imgCx,
      imgCy,
      imgR,
      imgX: imgCx - imgR,
      imgY: imgCy - imgR,
      imgSize: imgR * 2,
      tx,
      ty,
      textRotate: midAngle + 90,
      fontSize: n > 6 ? 7 : 8,
    };
  });
});

watch(
  () => [props.spinning, props.targetIndex],
  ([spinning, index]) => {
    if (spinning && index >= 0) startSpin(index);
  }
);

function startSpin(targetIndex) {
  const n = props.prizes.length;
  if (!n) return;

  const segmentAngle = 360 / n;
  const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
  const totalRotation = 5 * 360 + targetAngle;

  isAnimating.value = true;
  rotation.value = rotation.value % 360;
  requestAnimationFrame(() => {
    rotation.value += totalRotation;
    setTimeout(() => {
      isAnimating.value = false;
      emit('spin-end');
    }, 4500);
  });
}
</script>

<template>
  <div class="fortune-wheel">
    <div class="fortune-wheel__pointer">
      <svg width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 36 L0 0 L28 0 Z" fill="#ff9000" />
        <path d="M14 32 L4 6 L24 6 Z" fill="#ff7700" />
      </svg>
    </div>

    <div
      class="fortune-wheel__container"
      :class="{ 'fortune-wheel__container--spinning': isAnimating }"
      :style="{ transform: `rotate(${rotation}deg)` }"
    >
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
        <defs>
          <clipPath v-for="(seg, i) in segments" :key="`clip-${i}`" :id="`wheel-img-clip-${i}`">
            <circle :cx="seg.imgCx" :cy="seg.imgCy" :r="seg.imgR" />
          </clipPath>
        </defs>

        <circle :cx="cx" :cy="cy" :r="radius + 4" fill="none" stroke="#ff9000" stroke-width="4" />

        <g v-for="(seg, i) in segments" :key="i">
          <path :d="seg.path" :fill="seg.color" stroke="#000" stroke-width="1.5" opacity="0.95" />

          <image
            v-if="seg.image"
            :href="seg.image"
            :x="seg.imgX"
            :y="seg.imgY"
            :width="seg.imgSize"
            :height="seg.imgSize"
            :clip-path="`url(#wheel-img-clip-${i})`"
            preserveAspectRatio="xMidYMid slice"
          />

          <circle
            v-if="seg.image"
            :cx="seg.imgCx"
            :cy="seg.imgCy"
            :r="seg.imgR"
            fill="none"
            stroke="#000"
            stroke-width="1.5"
            opacity="0.4"
          />

          <text
            :x="seg.tx"
            :y="seg.ty"
            :transform="`rotate(${seg.textRotate}, ${seg.tx}, ${seg.ty})`"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#fff"
            :font-size="seg.fontSize"
            font-weight="700"
            stroke="#000"
            stroke-width="0.3"
            paint-order="stroke"
          >
            {{ seg.label.length > 16 ? seg.label.slice(0, 14) + '…' : seg.label }}
          </text>
        </g>

        <circle :cx="cx" :cy="cy" r="32" fill="#111" stroke="#ff9000" stroke-width="3" />
        <text :x="cx" :y="cy" text-anchor="middle" dominant-baseline="middle" fill="#ff9000" font-size="20" font-weight="900">
          GO
        </text>
      </svg>
    </div>

    <div class="fortune-wheel__glow" />
  </div>
</template>

<style scoped>
.fortune-wheel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
}

.fortune-wheel__pointer {
  position: relative;
  z-index: 10;
  margin-bottom: -12px;
  filter: drop-shadow(0 2px 8px rgba(255, 144, 0, 0.5));
}

.fortune-wheel__container {
  transition: none;
  filter: drop-shadow(0 0 24px rgba(255, 144, 0, 0.25));
}

.fortune-wheel__container--spinning {
  transition: transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.fortune-wheel__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(255, 144, 0, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}
</style>
