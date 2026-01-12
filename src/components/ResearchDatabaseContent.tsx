import SandwichResearchDB from '@/components/SandwichResearchDB'

interface ResearchDatabaseContentProps {
  embedded?: boolean
}

export default function ResearchDatabaseContent({ embedded = false }: ResearchDatabaseContentProps) {
  return <SandwichResearchDB embedded={embedded} />
}
