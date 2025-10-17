<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const leftPupilOffsetX = ref(0)
const leftPupilOffsetY = ref(0)
const rightPupilOffsetX = ref(0)
const rightPupilOffsetY = ref(0)

function handleMouseMove(event: MouseEvent) {
  const leftEye = document.querySelector('.left-eye')
  const rightEye = document.querySelector('.right-eye')

  if (!leftEye || !rightEye) {
    return
  }

  const maxOffset = 6

  // Left eye
  const leftEyeRect = leftEye.getBoundingClientRect()
  const leftEyeCenterX = leftEyeRect.left + leftEyeRect.width / 2
  const leftEyeCenterY = leftEyeRect.top + leftEyeRect.height / 2
  const deltaXLeft = event.clientX - leftEyeCenterX
  const deltaYLeft = event.clientY - leftEyeCenterY
  const angleLeft = Math.atan2(deltaYLeft, deltaXLeft)
  leftPupilOffsetX.value = Math.cos(angleLeft) * maxOffset
  leftPupilOffsetY.value = Math.sin(angleLeft) * maxOffset

  // Right eye
  const rightEyeRect = rightEye.getBoundingClientRect()
  const rightEyeCenterX = rightEyeRect.left + rightEyeRect.width / 2
  const rightEyeCenterY = rightEyeRect.top + rightEyeRect.height / 2
  const deltaXRight = event.clientX - rightEyeCenterX
  const deltaYRight = event.clientY - rightEyeCenterY
  const angleRight = Math.atan2(deltaYRight, deltaXRight)
  rightPupilOffsetX.value = Math.cos(angleRight) * maxOffset
  rightPupilOffsetY.value = Math.sin(angleRight) * maxOffset
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="flex items-center justify-center w-full h-full bg-gray-100">
    <svg width="250" height="250" viewBox="0 0 250 250" class="robot">
      <!-- Head -->
      <rect x="50" y="50" width="150" height="130" rx="20" fill="#D1D5DB" />
      <rect x="45" y="45" width="160" height="140" rx="22" fill="none" stroke="#9CA3AF" stroke-width="2" />

      <!-- Antenna -->
      <line x1="125" y1="50" x2="125" y2="20" stroke="#9CA3AF" stroke-width="5" />
      <circle cx="125" cy="15" r="8" fill="#F87171" />

      <!-- Eyes -->
      <g class="eyes">
        <!-- Left Eye -->
        <circle cx="95" cy="110" r="20" fill="white" class="eye left-eye" />
        <circle :cx="95 + leftPupilOffsetX" :cy="110 + leftPupilOffsetY" r="10" fill="#1F2937" class="pupil" />
        <!-- Right Eye -->
        <circle cx="155" cy="110" r="20" fill="white" class="eye right-eye" />
        <circle :cx="155 + rightPupilOffsetX" :cy="110 + rightPupilOffsetY" r="10" fill="#1F2937" class="pupil" />
      </g>

      <!-- Mouth -->
      <rect x="90" y="150" width="70" height="10" rx="5" fill="#9CA3AF" />
    </svg>
  </div>
</template>
