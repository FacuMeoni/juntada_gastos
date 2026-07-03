"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const theme = (mounted ? resolvedTheme : "light") as ToasterProps["theme"]

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-[var(--toast-success-icon)]" />
        ),
        info: (
          <InfoIcon className="size-4 text-[var(--toast-success-icon)]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-[var(--toast-fg)]" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-[var(--toast-error-icon)]" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-[var(--toast-fg)]" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--toast-bg)",
          "--normal-text": "var(--toast-fg)",
          "--normal-border": "var(--toast-border)",
          "--success-bg": "var(--toast-bg)",
          "--success-text": "var(--toast-fg)",
          "--success-border": "var(--toast-border)",
          "--info-bg": "var(--toast-bg)",
          "--info-text": "var(--toast-fg)",
          "--info-border": "var(--toast-border)",
          "--error-bg": "var(--toast-bg)",
          "--error-text": "var(--toast-fg)",
          "--error-border": "var(--toast-border)",
          "--warning-bg": "var(--toast-bg)",
          "--warning-text": "var(--toast-fg)",
          "--warning-border": "var(--toast-border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
