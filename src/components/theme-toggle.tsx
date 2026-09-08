import { useEffect, useState } from "react"
import { Moon, Sun } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  window.localStorage.setItem("theme", theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    applyTheme(next)
    setTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative overflow-hidden"
    >
      <Sun
        weight="regular"
        className={`absolute size-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        weight="regular"
        className={`absolute size-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </Button>
  )
}
