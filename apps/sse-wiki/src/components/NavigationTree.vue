<script setup lang="ts">
import type { ModuleTreeNode } from '@/types/module'
import {
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
          <button
            class="ml-auto hover:bg-sidebar-accent rounded p-1 transition-opacity"
            :class="{ 'opacity-0': !isHovered, 'opacity-100': isHovered }"
            @click.stop
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem v-if="canCreateChild" @click="createChild">
            <Plus class="mr-2 w-4 h-4" />
            <span>创建子模块</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canEdit" @click="rename">
            <Edit2 class="mr-2 w-4 h-4" />
            <span>编辑信息</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canManageCollaborators" @click="manageCollaborators">
            <Users class="mr-2 w-4 h-4" />
            <span>管理协作者</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canDelete" />
          <DropdownMenuItem v-if="canDelete" class="text-destructive focus:text-destructive" @click="deleteModule">
            <Trash2 class="mr-2 w-4 h-4" />
            <span>删除模块</span>
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
          <button
            class="ml-auto hover:bg-sidebar-accent rounded p-1 transition-opacity"
            :class="{ 'opacity-0': !isHovered, 'opacity-100': isHovered }"
            @click.stop
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem v-if="canCreateChild" @click="createChild">
            <Plus class="mr-2 w-4 h-4" />
            <span>创建子模块</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canEdit" @click="rename">
            <Edit2 class="mr-2 w-4 h-4" />
            <span>编辑信息</span>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="canManageCollaborators" @click="manageCollaborators">
            <Users class="mr-2 w-4 h-4" />
            <span>管理协作者</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canDelete" />
          <DropdownMenuItem v-if="canDelete" class="text-destructive focus:text-destructive" @click="deleteModule">
            <Trash2 class="mr-2 w-4 h-4" />
            <span>删除模块</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuButton>

    <!-- 子菜单 -->
    <SidebarMenuSub v-show="isExpanded">
      <NavigationTree
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :is-edit-mode="isEditMode"
        @module-action="$emit('moduleAction', $event)"
      />
    </SidebarMenuSub>
  </SidebarMenuItem>
</template>
