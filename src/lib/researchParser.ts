export interface Source {
  number: number
  citation: string
  type: 'book' | 'website' | 'article' | 'other'
  url: string | null
}

/**
 * Extract URL from citation text
 */
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/(https?:\/\/[^\s\)]+)/i)
  return urlMatch ? urlMatch[1] : null
}

/**
 * Detect source type from citation text
 */
function detectSourceType(citation: string): 'book' | 'website' | 'article' | 'other' {
  const lower = citation.toLowerCase()
  if (lower.includes('http://') || lower.includes('https://') || lower.includes('www.')) {
    return 'website'
  }
  if (lower.includes('journal') || lower.includes('volume') || lower.includes('issue') || lower.includes('pages')) {
    return 'article'
  }
  if (lower.includes('isbn') || lower.includes('publisher')) {
    return 'book'
  }
  return 'other'
}

/**
 * Parse sources section from research output
 */
function parseSources(sourcesText: string): Source[] {
  const sources: Source[] = []
  
  // Split by numbered references [1], [2], etc.
  const sourceMatches = sourcesText.match(/\[(\d+)\][\s\n]+(.+?)(?=\[\d+\]|$)/gs)
  
  if (sourceMatches) {
    sourceMatches.forEach((match) => {
      const numberMatch = match.match(/\[(\d+)\]/)
      if (numberMatch) {
        const number = parseInt(numberMatch[1], 10)
        const citation = match.replace(/\[\d+\][\s\n]+/, '').trim()
        const url = extractUrl(citation)
        const type = detectSourceType(citation)
        
        sources.push({
          number,
          citation,
          type,
          url,
        })
      }
    })
  } else {
    // Fallback: try to parse line by line if numbered format not found
    const lines = sourcesText.split('\n').filter(line => line.trim())
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed) {
        const url = extractUrl(trimmed)
        const type = detectSourceType(trimmed)
        
        sources.push({
          number: index + 1,
          citation: trimmed,
          type,
          url,
        })
      }
    })
  }
  
  return sources
}

/**
 * Parse research output from Claude into structured JSON
 * Expected format:
 * FIELD_NAME_1:
 * Content for field 1...
 * FIELD_NAME_2:
 * Content for field 2...
 * SOURCES:
 * [1] First source citation...
 * [2] Second source citation...
 */
export function parseResearchOutput(content: string): Record<string, any> | null {
  try {
    const lines = content.split('\n')
    const result: Record<string, any> = {}
    let currentField: string | null = null
    let currentContent: string[] = []

    for (const line of lines) {
      // Check if line is a field header (ends with colon and is uppercase or has underscores)
      const fieldMatch = line.match(/^([A-Z_][A-Z0-9_]*):\s*$/)
      
      if (fieldMatch) {
        // Save previous field if exists
        if (currentField) {
          const fieldName = currentField.toLowerCase()
          const fieldContent = currentContent.join('\n').trim()
          
          // Special handling for SOURCES field
          if (fieldName === 'sources') {
            result.sources = parseSources(fieldContent)
          } else {
            result[fieldName] = fieldContent
          }
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
      const fieldName = currentField.toLowerCase()
      const fieldContent = currentContent.join('\n').trim()
      
      // Special handling for SOURCES field
      if (fieldName === 'sources') {
        result.sources = parseSources(fieldContent)
      } else {
        result[fieldName] = fieldContent
      }
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
