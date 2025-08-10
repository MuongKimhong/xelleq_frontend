import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

export function useBreakpoint() {
  const { width } = useWindowSize()

  const xs = computed(() => width.value < 640)
  const sm = computed(() => width.value >= 640 && width.value < 768)
  const md = computed(() => width.value >= 768 && width.value < 1024)
  const lg = computed(() => width.value >= 1024 && width.value < 1280)
  const xl = computed(() => width.value >= 1280)

  const breakPointName = computed(() => {
    if (xs.value) return 'xs'
    if (sm.value) return 'sm'
    if (md.value) return 'md'
    if (lg.value) return 'lg'
    return 'xl'
  })

  const isBreakPointXs = computed(() => {
    return xs.value
  })

  const isBreakPointSmOrXs = computed(() => {
    return sm.value || xs.value
  })

  const isBreakPointMdAndUp = computed(() => {
    return md.value || lg.value || xl.value
  })

  const isBreakPointMdAndDown = computed(() => {
    return md.value || sm.value || xs.value
  })

  const isBreakPointSmAndUp = computed(() => {
    return sm.value || md.value || lg.value || xl.value
  })

  const isBreakPointLgAndUp = computed(() => {
    return lg.value || xl.value
  })

  return {
    width,
    xs,
    sm,
    md,
    lg,
    xl,
    breakPointName,
    isBreakPointSmOrXs,
    isBreakPointMdAndUp,
    isBreakPointSmAndUp,
    isBreakPointLgAndUp,
    isBreakPointMdAndDown,
    isBreakPointXs,
  }
}
