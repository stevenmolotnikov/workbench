import type React from "react"
import type { SelectionBoxProps } from "../types"
import { getSelectionBoxStyle } from "../utils"

const SelectionBox: React.FC<SelectionBoxProps> = ({ selectionBox }) => {
  if (!selectionBox) return null

  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
      style={getSelectionBoxStyle(selectionBox)}
    />
  )
}

export default SelectionBox
