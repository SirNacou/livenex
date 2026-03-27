// Frontend React routes - Root layout with auth context
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { RootLayout } from '~/lib/root-layout'

export const Route = createRootRoute({
  component: RootLayout,
})
