<script setup lang="ts">
import type { ModuleTreeNode } from '@/types/module'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@sse-wiki/ui'
import { ChevronRight, Edit2, MoreHorizontal, Plus, Trash2, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModulePermission } from '@/composables/useModulePermission'
import { ModuleAction } from '@/types/module'

interface Props {
  node: ModuleTreeNode
  isEditMode?: boolean
  level?: number
}

interface Emits {
  (e: 'moduleAction', payload: { action: ModuleAction, module: ModuleTreeNode, parentModule?: ModuleTreeNode }): void
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  level: 1,
})

const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()

const isExpanded = ref(true)
const isHovered = ref(false)

// 使用权限检查 composable
const {
  canEdit,
  canDelete,
  canManageCollaborators,
  canCreateChild: hasCreateChildPermission,
} = useModulePermission(props.node)

// 判断当前节点是否被选中
const isActive = computed(() => {
  return route.params.moduleId === String(props.node.id)
})

// 判断是否可以创建子模块（最大4级 + 权限检查）
const canCreateChild = computed(() => {
  return props.level < 4 && hasCreateChildPermission.value
})

// 判断当前用户是否有权限管理此模块（任意操作权限）
const hasPermission = computed(() => {
  return canEdit.value || canDelete.value || canManageCollaborators.value
})

// 是否有子节点
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

// 点击节点跳转到模块详情页
function handleNodeClick() {
  router.push({
    name: 'ModuleDetail',
    params: { moduleId: props.node.id },
  })
}

// 管理操作
function createChild() {
  emit('moduleAction', {
    action: ModuleAction.CREATE,
    module: props.node,
    parentModule: props.node,
  })
}

function rename() {
  emit('moduleAction', {
    action: ModuleAction.EDIT,
    module: props.node,
  })
}

function manageCollaborators() {
  emit('moduleAction', {
    action: ModuleAction.MANAGE_COLLABORATORS,
    module: props.node,
  })
}

function deleteModule() {
  emit('moduleAction', {
    action: ModuleAction.DELETE,
    module: props.node,
  })
}
</script>

<template>
  <!-- 根级别或子级别的菜单项 -->
  <SidebarMenuItem
    v-if="!hasChildren"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 没有子节点的项目 -->
    <SidebarMenuButton
      :is-active="isActive"
      @click="handleNodeClick"
    >
      <span>{{ node.name }}</span>

      <!-- 编辑模式下的操作菜单 -->
      <DropdownMenu v-if="hasPermission && isEditMode">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="ml-auto h-7 w-7 rounded-md transition-all duration-200"
            :class="{
              'opacity-0 -translate-x-1': !isHovered,
              'opacity-100 translate-x-0': isHovered,
            }"
            title="模块操作"
            @click.stop
          >
            <MoreHorizontal class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem v-if="canCreateChild" @click="createChild">
            <Plus class="mr-2 w-4 h-4" />
            <span class="text-sm">创建子模块</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canEdit" @click="rename">
            <Edit2 class="mr-2 w-4 h-4" />
            <span class="text-sm">编辑信息</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canManageCollaborators" @click="manageCollaborators">
            <Users class="mr-2 w-4 h-4" />
            <span class="text-sm">管理协作者</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canDelete" />
          <DropdownMenuItem v-if="canDelete" class="text-destructive focus:text-destructive focus:bg-destructive/10" @click="deleteModule">
            <Trash2 class="mr-2 w-4 h-4" />
            <span class="text-sm">删除模块</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <!-- 有子节点的可折叠项目 -->
  <SidebarMenuItem
    v-else
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <SidebarMenuButton
      :is-active="isActive"
      @click="isExpanded = !isExpanded"
    >
      <ChevronRight
        class="transition-transform duration-200"
        :class="{ 'rotate-90': isExpanded }"
      />
      <span @click.stop="handleNodeClick">{{ node.name }}</span>

      <!-- 编辑模式下的操作菜单 -->
      <DropdownMenu v-if="hasPermission && isEditMode">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="ml-auto h-7 w-7 rounded-md transition-all duration-200"
            :class="{
              'opacity-0 -translate-x-1': !isHovered,
              'opacity-100 translate-x-0': isHovered,
            }"
            title="模块操作"
            @click.stop
          >
            <MoreHorizontal class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem v-if="canCreateChild" @click="createChild">
            <Plus class="mr-2 w-4 h-4" />
            <span class="text-sm">创建子模块</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canEdit" @click="rename">
            <Edit2 class="mr-2 w-4 h-4" />
            <span class="text-sm">编辑信息</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canManageCollaborators" @click="manageCollaborators">
            <Users class="mr-2 w-4 h-4" />
            <span class="text-sm">管理协作者</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canDelete" />
          <DropdownMenuItem v-if="canDelete" class="text-destructive focus:text-destructive focus:bg-destructive/10" @click="deleteModule">
            <Trash2 class="mr-2 w-4 h-4" />
            <span class="text-sm">删除模块</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuButton>

    <!-- 子菜单 - 添加流畅的展开/收起动画 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-[2000px]"
      leave-from-class="opacity-100 translate-y-0 max-h-[2000px]"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <SidebarMenuSub v-show="isExpanded" class="overflow-hidden">
        <ModuleTree
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :is-edit-mode="isEditMode"
          @module-action="$emit('moduleAction', $event)"
        />
      </SidebarMenuSub>
    </Transition>
  </SidebarMenuItem>
</template>

<style scoped>
:deep([data-sidebar='menu-button']) {
  transition:
    color 200ms ease-in-out,
    background-color 150ms ease-in-out,
    font-weight 200ms ease-in-out;
}

:deep([data-sidebar='menu-button'][data-active='true']) {
  color: #f97316 !important;
  font-weight: 600 !important;
  background: transparent !important;
}

:deep([data-sidebar='menu-button']:hover) {
  color: #3b82f6 !important;
  background: hsl(var(--sidebar-accent) / 0.5) !important;
}

:deep(.lucide-chevron-right) {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.ml-auto.transition-all) {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
