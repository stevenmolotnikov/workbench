import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Code, Play } from "lucide-react"

type WorkbenchMode = "logit-lens" | "activation-patching";

interface WorkbenchModeProps {
  handleRun: () => void;
  workbenchMode: WorkbenchMode;
  setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function WorkbenchMode({ workbenchMode, setWorkbenchMode, handleRun }: WorkbenchModeProps) {
  return (

    <div className="p-4 border-b flex items-center justify-between">

      <Select value={workbenchMode} onValueChange={setWorkbenchMode} defaultValue="activation-patching">
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={true}>
          <Code size={16} />
          Code
        </Button>
        <Button
          size="sm"
          onClick={handleRun}
        >
          <Play size={16} />
          Run
        </Button>
      </div>
    </div>

  )
}
