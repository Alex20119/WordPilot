import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { BookSection } from '@/types/database.types'

export type ExportScope = 'current' | 'specific' | 'all'
export type ExportFormat = 'docx' // PDF can be added later
export type ExportOptions = {
  includeTitles: boolean
  includeTOC: boolean
  includeWordCount: boolean
}

/**
 * Convert HTML content to docx Paragraph elements
 */
function htmlToParagraphs(html: string): Paragraph[] {
  if (!html) return [new Paragraph({ text: '' })]

  // Create a temporary DOM element to parse HTML
  const div = document.createElement('div')
  div.innerHTML = html

  const paragraphs: Paragraph[] = []
  
  // Process each node
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        paragraphs.push(new Paragraph({ text: text }))
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()

      if (tagName === 'p') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ text: text }))
        }
      } else if (tagName === 'h1') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ text: text, heading: HeadingLevel.HEADING_1 }))
        }
      } else if (tagName === 'h2') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ text: text, heading: HeadingLevel.HEADING_2 }))
        }
      } else if (tagName === 'h3') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ text: text, heading: HeadingLevel.HEADING_3 }))
        }
      } else if (tagName === 'strong' || tagName === 'b') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: text, bold: true })] }))
        }
      } else if (tagName === 'em' || tagName === 'i') {
        const text = element.textContent?.trim()
        if (text) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: text, italics: true })] }))
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        const items = element.querySelectorAll('li')
        items.forEach((item) => {
          const text = item.textContent?.trim()
          if (text) {
            paragraphs.push(new Paragraph({ text: `• ${text}`, bullet: { level: 0 } }))
          }
        })
      } else {
        // For other elements, process children
        Array.from(element.childNodes).forEach(processNode)
      }
    }
  }

  Array.from(div.childNodes).forEach(processNode)

  // If no paragraphs were created, add empty paragraph
  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ text: '' }))
  }

  return paragraphs
}

/**
 * Get sections in hierarchical order for export
 */
function getSectionsInOrder(sections: BookSection[]): BookSection[] {
  const sorted: BookSection[] = []
  const topLevel = sections.filter((s) => !s.parent_id).sort((a, b) => a.order_number - b.order_number)

  const addSectionAndChildren = (section: BookSection) => {
    sorted.push(section)
    const children = sections
      .filter((s) => s.parent_id === section.id)
      .sort((a, b) => a.order_number - b.order_number)
    children.forEach(addSectionAndChildren)
  }

  topLevel.forEach(addSectionAndChildren)
  return sorted
}

/**
 * Build table of contents from sections
 */
function buildTableOfContents(sections: BookSection[]): Paragraph[] {
  const toc: Paragraph[] = [
    new Paragraph({ text: 'Table of Contents', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: '' }),
  ]

  const addTOCEntry = (section: BookSection, level: number) => {
    const indent = '  '.repeat(level)
    toc.push(new Paragraph({ text: `${indent}${section.title}` }))
    
    const children = sections
      .filter((s) => s.parent_id === section.id)
      .sort((a, b) => a.order_number - b.order_number)
    
    children.forEach((child) => addTOCEntry(child, level + 1))
  }

  const topLevel = sections.filter((s) => !s.parent_id).sort((a, b) => a.order_number - b.order_number)
  topLevel.forEach((section) => addTOCEntry(section, 0))

  toc.push(new Paragraph({ text: '' }))
  return toc
}

/**
 * Export sections to DOCX format
 */
export async function exportToDocx(
  sections: BookSection[],
  selectedSectionIds: string[],
  scope: ExportScope,
  options: ExportOptions
): Promise<void> {
  let sectionsToExport: BookSection[]

  // Determine which sections to export
  if (scope === 'all') {
    sectionsToExport = getSectionsInOrder(sections)
  } else if (scope === 'specific') {
    const selectedSet = new Set(selectedSectionIds)
    const allInOrder = getSectionsInOrder(sections)
    sectionsToExport = allInOrder.filter((s) => selectedSet.has(s.id))
  } else {
    // 'current' - export first selected section (should be only one)
    const selectedSet = new Set(selectedSectionIds)
    const allInOrder = getSectionsInOrder(sections)
    sectionsToExport = allInOrder.filter((s) => selectedSet.has(s.id))
  }

  if (sectionsToExport.length === 0) {
    throw new Error('No sections selected for export')
  }

  const docContent: Paragraph[] = []

  // Add title
  docContent.push(new Paragraph({ text: 'Word Pilot Export', heading: HeadingLevel.TITLE }))
  docContent.push(new Paragraph({ text: '' }))

  // Add table of contents if requested
  if (options.includeTOC && sectionsToExport.length > 1) {
    docContent.push(...buildTableOfContents(sectionsToExport))
    docContent.push(new Paragraph({ text: '' }))
  }

  // Add sections
  sectionsToExport.forEach((section) => {
    const level = section.parent_id ? 2 : 1

    if (options.includeTitles) {
      docContent.push(
        new Paragraph({
          text: section.title,
          heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        })
      )
      docContent.push(new Paragraph({ text: '' }))
    }

    // Convert HTML content to paragraphs
    const contentParagraphs = htmlToParagraphs(section.content || '')
    docContent.push(...contentParagraphs)
    docContent.push(new Paragraph({ text: '' }))
  })

  // Add word count if requested
  if (options.includeWordCount) {
    const totalWords = sectionsToExport.reduce((sum, s) => sum + s.word_count, 0)
    docContent.push(new Paragraph({ text: '' }))
    docContent.push(new Paragraph({ text: `Total word count: ${totalWords.toLocaleString()}` }))
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        children: docContent,
      },
    ],
  })

  // Generate and download
  const blob = await Packer.toBlob(doc)
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `Word-Pilot-Export-${dateStr}.docx`
  saveAs(blob, filename)
}
