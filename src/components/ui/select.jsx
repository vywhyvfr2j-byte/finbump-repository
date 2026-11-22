"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

// On phones every select opens as a bottom sheet (the same sheet the app's
// ResponsiveSelect uses), so its list sits within thumb reach instead of
// hanging from the top of the screen. Wider screens keep the standard Radix
// menu untouched. On mobile a small context stands in for Radix, and each item
// registers its label so the closed trigger can keep showing the selection.
const MobileSelectContext = React.createContext(null)

const triggerClasses =
  "flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const Select = React.forwardRef(({ value, onValueChange, disabled, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const items = React.useRef(new Map())
  const placeholder = React.useRef("")
  const label = React.useRef("")
  const [, bump] = React.useReducer((n) => n + 1, 0)

  // Items register after they mount, so nudge one extra render once they are
  // known — and again whenever the selection changes.
  React.useEffect(() => {
    if (isMobile) bump()
  }, [isMobile, value])

  if (!isMobile) {
    return (
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} {...props}>
        {children}
      </SelectPrimitive.Root>
    )
  }

  const ctx = {
    value,
    onValueChange,
    disabled,
    open,
    setOpen,
    items,
    placeholder,
    label,
    register: (itemValue, itemLabel, itemDisabled) =>
      items.current.set(itemValue, { label: itemLabel, disabled: itemDisabled }),
    unregister: (itemValue) => items.current.delete(itemValue),
  }

  return <MobileSelectContext.Provider value={ctx}>{children}</MobileSelectContext.Provider>
})
Select.displayName = "Select"

const SelectGroup = React.forwardRef(({ children, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) return <>{children}</>
  return <SelectPrimitive.Group ref={ref} {...props}>{children}</SelectPrimitive.Group>
})
SelectGroup.displayName = SelectPrimitive.Group.displayName

const SelectValue = React.forwardRef(({ className, placeholder, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) {
    ctx.placeholder.current = placeholder || ""
    const selected = ctx.items.current.get(ctx.value)
    return (
      <span className={cn("line-clamp-1 truncate text-left", !selected && "text-muted-foreground", className)}>
        {selected ? selected.label : placeholder}
      </span>
    )
  }
  return <SelectPrimitive.Value ref={ref} placeholder={placeholder} className={className} {...props} />
})
SelectValue.displayName = SelectPrimitive.Value.displayName

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) {
    if (props["aria-label"]) ctx.label.current = props["aria-label"]
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ctx.open}
        onClick={() => {
          if (!ctx.disabled) ctx.setOpen(true)
        }}
        disabled={ctx.disabled}
        className={cn(triggerClasses, className)}
        {...props}>
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    )
  }
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) {
    const options = Array.from(ctx.items.current.entries())
    return (
      <>
        {/* Keeps the items mounted so their labels are known while the sheet is closed. */}
        <div className="hidden">{children}</div>
        <Drawer open={ctx.open} onOpenChange={ctx.setOpen}>
          <DrawerContent className="max-h-[70dvh]">
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-base">
                {ctx.label.current || ctx.placeholder.current || "Choose an option"}
              </DrawerTitle>
            </DrawerHeader>
            <div
              role="listbox"
              aria-label={ctx.label.current || undefined}
              className="overflow-y-auto px-2 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
              {options.map(([optionValue, option]) => {
                const selected = optionValue === ctx.value
                return (
                  <button
                    key={String(optionValue)}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    onClick={() => {
                      ctx.onValueChange?.(optionValue)
                      ctx.setOpen(false)
                    }}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-base disabled:opacity-50",
                      selected ? "bg-primary/10 font-medium" : ""
                    )}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{option.label}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) return null
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props} />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, value, disabled, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)

  // Registered on every render so a relabelled item always shows current text.
  React.useEffect(() => {
    if (!ctx) return undefined
    ctx.register(value, children, disabled)
    return () => ctx.unregister(value)
  })

  if (ctx) return null

  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => {
  const ctx = React.useContext(MobileSelectContext)
  if (ctx) return null
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props} />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}