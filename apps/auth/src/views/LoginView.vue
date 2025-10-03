<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { RouterLink } from 'vue-router'
</script>

<template>
  <h1>登录界面</h1>
  <Button>
    <RouterLink to="/register">
      跳转注册
    </RouterLink>
  </Button>
</template>
