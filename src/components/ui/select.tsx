"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
  defaultValue?: string
}

interface SelectTriggerProps {
  children?: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children?: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  className?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className,
  defaultValue 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '')

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <SelectContext.Provider value={{ 
      value: selectedValue, 
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen 
    }}>
      <div className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className 
}) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder = "Select...", 
  className 
}) => {
  const { value } = React.useContext(SelectContext)

  return (
    <span className={cn("text-left", className)}>
      {value || placeholder}
    </span>
  )
}

export const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className 
}) => {
  const { isOpen } = React.useContext(SelectContext)

  if (!isOpen) return null

  return (
    <div className={cn(
      "absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-600",
      className
    )}>
      {children}
    </div>
  )
}

export const SelectItem: React.FC<SelectItemProps> = ({ 
  value, 
  children, 
  className 
}) => {
  const { onValueChange } = React.useContext(SelectContext)

  return (
    <div
      onClick={() => onValueChange?.(value)}
      className={cn(
        "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors dark:text-gray-100 dark:hover:bg-gray-700",
        className
      )}
    >
      {children}
    </div>
  )
}

export default Select;