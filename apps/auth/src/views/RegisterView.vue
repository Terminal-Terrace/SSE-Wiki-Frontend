<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { RouterLink } from 'vue-router'
</script>

<template>
  <h1>注册页面</h1>
  <Button>
    <RouterLink to="/login">
      跳转登录
    </RouterLink>
  </Button>
</template>
