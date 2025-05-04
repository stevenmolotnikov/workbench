import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WorkbenchMode = "logit-lens" | "activation-patching";

interface WorkbenchModeProps {
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function WorkbenchMode({workbenchMode, setWorkbenchMode}: WorkbenchModeProps) {
  return (
    <Select value={workbenchMode} onValueChange={setWorkbenchMode}  defaultValue="activation-patching">
      <SelectTrigger className="w-[180px] -my-1">
        <SelectValue placeholder="Select a mode" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="logit-lens">Logit Lens</SelectItem>
          <SelectItem value="activation-patching">Activation Patching</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
