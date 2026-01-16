/**
 * Parse research output from Claude into structured JSON
 * Expected format:
 * FIELD_NAME_1:
 * Content for field 1...
 * FIELD_NAME_2:
 * Content for field 2...
 * SOURCES:
 * List of sources...
 */
export function parseResearchOutput(content: string): Record<string, string> | null {
  try {
    const lines = content.split('\n')
    const result: Record<string, string> = {}
    let currentField: string | null = null
    let currentContent: string[] = []

    for (const line of lines) {
      // Check if line is a field header (ends with colon and is uppercase or has underscores)
      const fieldMatch = line.match(/^([A-Z_][A-Z0-9_]*):\s*$/)
      
      if (fieldMatch) {
        // Save previous field if exists
        if (currentField) {
          result[currentField.toLowerCase()] = currentContent.join('\n').trim()
        }
        
        // Start new field
        currentField = fieldMatch[1].toLowerCase()
        currentContent = []
      } else if (currentField) {
        // Add line to current field content
        currentContent.push(line)
      }
    }

    // Save last field
    if (currentField) {
      result[currentField] = currentContent.join('\n').trim()
    }

    // Return null if no fields were found
    if (Object.keys(result).length === 0) {
      return null
    }

    return result
  } catch (error) {
    console.error('Error parsing research output:', error)
    return null
  }
}

/**
 * Extract item name from user message
 * Handles formats like:
 * - "Research [item name]"
 * - "research [item name]"
 * - "Research: [item name]"
 */
export function extractItemName(message: string): string | null {
  // Remove leading/trailing whitespace
  const trimmed = message.trim()
  
  // Try to match "Research [item name]" pattern
  const patterns = [
    /^research\s*:?\s*(.+)$/i,
    /^research\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Extract edit command information from user message
 * Handles formats like:
 * - "Edit [item name]"
 * - "Fix the [field name] in [item name]"
 * - "Update [item name]"
 * - "Edit: [item name]"
 * 
 * Returns { itemName: string, fieldName?: string } or null
 */
export function extractEditCommand(message: string): { itemName: string; fieldName?: string } | null {
  const trimmed = message.trim()
  
  // Pattern: "Fix the [field] in [item]"
  const fixPattern = /^fix\s+the\s+(.+?)\s+in\s+(.+)$/i
  const fixMatch = trimmed.match(fixPattern)
  if (fixMatch && fixMatch[1] && fixMatch[2]) {
    return {
      itemName: fixMatch[2].trim(),
      fieldName: fixMatch[1].trim().toLowerCase().replace(/\s+/g, '_'),
    }
  }
  
  // Pattern: "Edit [item name]" or "Update [item name]"
  const editPatterns = [
    /^(?:edit|update)\s*:?\s*(.+)$/i,
    /^(?:edit|update)\s+(.+)$/i,
  ]
  
  for (const pattern of editPatterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return {
        itemName: match[1].trim(),
      }
    }
  }

  return null
}
