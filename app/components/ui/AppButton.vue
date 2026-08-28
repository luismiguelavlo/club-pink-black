<script setup lang="ts">
import type { ButtonShape, ButtonSize, ButtonVariant } from '~/types/site'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    shape?: ButtonShape
    type?: 'button' | 'submit' | 'reset'
    href?: string
    block?: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    shape: 'rounded',
    type: 'button',
    block: false,
    disabled: false,
  },
)

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container hover:shadow-[0_0_20px_rgba(255,71,156,0.6)]',
  'primary-container':
    'bg-primary-container text-on-primary-container hover:neon-glow-pink-strong',
  outline:
    'bg-transparent border border-secondary text-on-surface hover:border-primary hover:text-primary neon-box-glow',
  ghost: 'bg-transparent text-secondary hover:text-primary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-6 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
}

const shapeClasses: Record<ButtonShape, string> = {
  rounded: 'rounded',
  chamfer: 'chamfer-clip scale-105 hover:scale-110 font-bold',
  pill: 'rounded-full tracking-widest',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 font-label-sm text-label-sm uppercase tracking-wider transition-all duration-300',
  variantClasses[props.variant],
  sizeClasses[props.size],
  shapeClasses[props.shape],
  props.block ? 'w-full tracking-widest' : '',
  props.disabled ? 'pointer-events-none opacity-50' : '',
])
</script>

<template>
  <NuxtLink
    v-if="href"
    :to="href"
    :class="classes"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="classes"
    :aria-label="ariaLabel"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
