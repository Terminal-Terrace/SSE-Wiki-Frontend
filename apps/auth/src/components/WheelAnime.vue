<script setup lang="ts">
defineProps<{
  maxwidth?: string
}>()
</script>

<template>
  <div class="gears-container" :style="{ maxWidth: maxwidth }">
    <img src="../assets/cogwheel.png" class="gear gear1" alt="gear">
    <img src="../assets/cogwheel.png" class="gear gear2" alt="gear">
    <img src="../assets/cogwheel.png" class="gear gear3" alt="gear">
    <img src="../assets/cogwheel.png" class="gear gear4" alt="gear">
    <img src="../assets/cogwheel.png" class="gear gear5" alt="gear">
  </div>
</template>

<style scoped>
.gears-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.gear {
  position: absolute;
  opacity: 0.2;
  filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.4));
}

.gear1 {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 15%;
  animation: rotate 10s linear infinite;
}

.gear2 {
  width: 100px;
  height: 100px;
  top: 30%;
  left: 60%;
  animation: rotate-reverse 8s linear infinite;
}

.gear3 {
  width: 200px;
  height: 200px;
  bottom: 5%;
  left: 30%;
  animation: rotate 15s linear infinite;
}

.gear4 {
  width: 80px;
  height: 80px;
  top: 50%;
  left: 15%;
  animation: rotate-reverse 6s linear infinite;
}

.gear5 {
  width: 120px;
  height: 120px;
  top: 60%;
  left: 65%;
  animation: rotate 12s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes rotate-reverse {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}
</style>
