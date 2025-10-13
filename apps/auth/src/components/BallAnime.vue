<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let dpr = 1
let width = 0
let height = 0
let rafId = 0

const eyeConfig = {
  eyeRadius: 24,
  pupilRadius: 8,
  pupilMaxOffset: 8,
  // offsets will be calculated relative to fixed circle radius
  eyeOffsetX: 46,
  eyeOffsetY: 8,
}

// Fixed circle radius in CSS pixels (won't scale with container)
const FIXED_RADIUS = 120

const eyes: Array<any> = [
  { x: 0, y: 0, px: 0, py: 0, tx: 0, ty: 0 },
  { x: 0, y: 0, px: 0, py: 0, tx: 0, ty: 0 },
]

const mouse = { x: 0, y: 0, inside: false }

function resize() {
  if (!canvas.value)
    return
  const el = canvas.value
  dpr = window.devicePixelRatio || 1
  width = el.clientWidth
  height = el.clientHeight
  el.width = Math.floor(width * dpr)
  el.height = Math.floor(height * dpr)
  ctx = el.getContext('2d')
  if (ctx)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // place the fixed-size semicircle horizontally centered, vertically centered in container
  const cx = width / 2
  const cy = height / 2

  // eyes are positioned relative to the fixed circle center
  eyes[0].x = cx - eyeConfig.eyeOffsetX
  eyes[0].y = cy + eyeConfig.eyeOffsetY
  eyes[1].x = cx + eyeConfig.eyeOffsetX
  eyes[1].y = cy + eyeConfig.eyeOffsetY
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function draw() {
  if (!ctx)
    return
  const c = ctx
  c.clearRect(0, 0, width, height)

  // semicircle (top half) with fixed radius
  const cx = width / 2
  const cy = height / 2
  const radius = FIXED_RADIUS
  // draw only if radius fits horizontally; otherwise it will still draw but may clip
  c.fillStyle = '#60A5FA'
  c.beginPath()
  c.moveTo(cx - radius, cy)
  c.arc(cx, cy, radius, Math.PI, 0, false)
  c.lineTo(cx + radius, cy)
  c.closePath()
  c.fill()

  // bottom semicircle (opposite color) with same fixed radius
  c.fillStyle = '#dbeafe'
  c.beginPath()
  c.moveTo(cx - radius, cy)
  c.arc(cx, cy, radius, 0, Math.PI, false)
  c.lineTo(cx + radius, cy)
  c.closePath()
  c.fill()

  // eyes
  eyes.forEach((eye) => {
    let dx = mouse.x - eye.x
    let dy = mouse.y - eye.y
    if (!mouse.inside) {
      dx = 0
      dy = 0
    }
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = dx / dist
    const ny = dy / dist
    const tx = nx * eyeConfig.pupilMaxOffset
    const ty = ny * eyeConfig.pupilMaxOffset
    eye.tx = tx
    eye.ty = ty
    eye.px = lerp(eye.px, eye.tx, 0.18)
    eye.py = lerp(eye.py, eye.ty, 0.18)

    // eyeball
    c.beginPath()
    c.fillStyle = '#fff'
    c.arc(eye.x, eye.y, eyeConfig.eyeRadius, 0, Math.PI * 2)
    c.fill()
    c.lineWidth = 2
    c.strokeStyle = '#333'
    c.stroke()

    // pupil
    c.beginPath()
    c.fillStyle = '#111'
    c.arc(eye.x + eye.px, eye.y + eye.py, eyeConfig.pupilRadius, 0, Math.PI * 2)
    c.fill()
  })
}

function animate() {
  draw()
  rafId = requestAnimationFrame(animate)
}

function onPointerMove(e: PointerEvent) {
  if (!canvas.value)
    return
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  mouse.inside = true
}

function onPointerLeave() {
  mouse.inside = false
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerleave', onPointerLeave)
  rafId = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="relative w-full h-48">
    <canvas ref="canvas" class="w-full h-full" />
  </div>
</template>

<style scoped>
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
