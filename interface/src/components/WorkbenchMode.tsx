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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutGrid } from "lucide-react"
import { Layout } from "@/types/layout";

type WorkbenchMode = "logit-lens" | "activation-patching";

interface WorkbenchModeProps {
  setLayout: (layout: Layout) => void;
  handleRun: () => void;
  workbenchMode: WorkbenchMode;
  setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function WorkbenchMode({ setLayout, workbenchMode, setWorkbenchMode, handleRun }: WorkbenchModeProps) {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <LayoutGrid size={16} />
              Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setLayout("1x1")}>
              1x1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLayout("2x1")}>
              2x1
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
