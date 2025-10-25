<script setup lang="ts">
import type { Ref } from 'vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'

defineProps<{
  maxwidth?: string
}>()

const animationSpeed: Ref<number> = ref(2)
let animationIntervalId: number | undefined

let animate: () => void = () => {}

watch(animationSpeed, (newValue) => {
  if (animationIntervalId) {
    clearInterval(animationIntervalId)
  }
  const speed = newValue > 0 ? newValue : 0.1
  animationIntervalId = window.setInterval(animate, 100 / speed)
})

onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const width = canvas.parentElement?.offsetWidth || 0
  const height = canvas.parentElement?.offsetHeight || 0
  canvas.width = width
  canvas.height = height

  const columns = Math.floor(width / 20)
  const drops: number[] = Array.from({ length: columns }, () => 1)
  const characters = '0123456789ABCDEF'

  function draw() {
    if (!ctx)
      return
    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#22d3ee' // 青色
    ctx.font = '15px monospace'

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i]
      if (drop === undefined)
        continue
      const text = characters.charAt(Math.floor(Math.random() * characters.length))
      ctx.fillText(text, i * 20, drop * 20)

      if (drop * 20 > height && Math.random() > 0.975) {
        drops[i] = 0
      }
      else if (typeof drops[i] === 'number') {
        drops[i]!++
      }
    }
  }

  animate = () => {
    draw()
  }

  // Initial animation start
  const speed = animationSpeed.value > 0 ? animationSpeed.value : 0.1
  animationIntervalId = window.setInterval(animate, 100 / speed)

  onUnmounted(() => {
    clearInterval(animationIntervalId)
  })
})
</script>

<template>
  <div class="animation-container" :style="{ maxWidth: maxwidth }">
    <canvas id="canvas" />
    <div class="speed-control">
      <label for="speed">动画速度</label>
      <input id="speed" v-model.number="animationSpeed" type="number" min="0.1" step="0.1">
    </div>
  </div>
</template>

<style scoped>
.animation-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.animation-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.speed-control {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: hsl(var(--background) / 0.8);
  backdrop-filter: blur(8px);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.speed-control label {
  margin-right: 10px;
  font-size: 0.875rem;
}

.speed-control input {
  width: 60px;
  background-color: hsl(var(--input));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 0.875rem;
}
</style>
