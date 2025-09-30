<script setup lang="ts">
import { Button } from '@sse-wiki/ui'

function handleClick() {
  console.log('点击按钮')
}
</script>

<template>
  <div>
    <h1>HomeView</h1>
    <Button @click="handleClick">
      点击我
    </Button>
  </div>
</template>
