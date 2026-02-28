'use client'

import React from 'react'
import { FiActivity, FiShield, FiInfo } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface ResultsSectionProps {
  result: any | null
  onNewAnalysis: () => void
}

function ConfidenceCircle({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke="hsl(0 0% 92%)" strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-[10px] text-muted-foreground">confidence</span>
      </div>
    </div>
  )
}

function UrgencyBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Urgent: 'bg-red-100 text-red-800 border-red-200',
  }
  const classes = config[level] ?? config['Low']

  return (
    <Badge variant="outline" className={`${classes} text-xs font-medium px-3 py-1`}>
      {level} Urgency
    </Badge>
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

/**
 * Deep-search for the prediction data through all nesting levels.
 * Handles cases where fullResult may have data nested under result/response/data keys.
 */
function findAnalysisData(obj: any, depth: number = 0): { prediction: any; condition_details: any; disclaimer: string } | null {
  if (depth > 6 || !obj) return null

  if (typeof obj === 'string') {
    try { return findAnalysisData(JSON.parse(obj), depth + 1) } catch { return null }
  }

  if (typeof obj !== 'object') return null

  // Direct match: has prediction with condition_name
  if (obj.prediction && typeof obj.prediction === 'object' && obj.prediction.condition_name) {
    return {
      prediction: obj.prediction,
      condition_details: obj.condition_details || {},
      disclaimer: typeof obj.disclaimer === 'string' ? obj.disclaimer : '',
    }
  }

  // Search nested keys
  for (const key of ['result', 'response', 'data', 'output', 'content', 'text', 'message']) {
    if (obj[key]) {
      let val = obj[key]
      if (typeof val === 'string') {
        try { val = JSON.parse(val) } catch { continue }
      }
      const found = findAnalysisData(val, depth + 1)
      if (found) return found
    }
  }

  return null
}

export default function ResultsSection({ result, onNewAnalysis }: ResultsSectionProps) {
  if (!result) {
    return (
      <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-md flex items-center justify-center min-h-[400px]">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <FiActivity className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
            No Analysis Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Upload a photo of a skin condition to receive an AI-powered analysis with predictions and recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Use deep search to find prediction data regardless of nesting
  const analysisData = findAnalysisData(result?.fullResult) || findAnalysisData(result)

  const prediction = analysisData?.prediction ?? result?.fullResult?.prediction ?? {}
  const conditionName = prediction?.condition_name ?? result?.conditionName ?? 'Unknown Condition'
  const confidenceScore = typeof prediction?.confidence_score === 'number' ? prediction.confidence_score : (result?.confidenceScore ?? 0)
  const urgencyLevel = prediction?.urgency_level ?? result?.urgencyLevel ?? 'Low'

  const details = analysisData?.condition_details ?? result?.fullResult?.condition_details ?? {}
  const description = details?.description ?? ''
  const symptoms = Array.isArray(details?.symptoms) ? details.symptoms : []
  const causes = Array.isArray(details?.possible_causes) ? details.possible_causes : []
  const treatments = Array.isArray(details?.treatment_options) ? details.treatment_options : []
  const whenToSeeDoctor = details?.when_to_see_doctor ?? ''
  const disclaimer = analysisData?.disclaimer || result?.fullResult?.disclaimer || 'This is for informational purposes only. Consult a healthcare professional.'

  return (
    <div className="space-y-5">
      <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Predicted Condition</p>
              <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.01em' }}>
                {conditionName}
              </h2>
              <UrgencyBadge level={urgencyLevel} />
            </div>
            <ConfidenceCircle score={confidenceScore} />
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-md">
        <CardContent className="p-6">
          <Accordion type="multiple" defaultValue={['description', 'symptoms']} className="space-y-1">
            {description && (
              <AccordionItem value="description" className="border-b border-border/50">
                <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">Description</AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                  {renderMarkdown(description)}
                </AccordionContent>
              </AccordionItem>
            )}

            {symptoms.length > 0 && (
              <AccordionItem value="symptoms" className="border-b border-border/50">
                <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">Symptoms</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-1.5">
                    {symptoms.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {causes.length > 0 && (
              <AccordionItem value="causes" className="border-b border-border/50">
                <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">Possible Causes</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-1.5">
                    {causes.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {treatments.length > 0 && (
              <AccordionItem value="treatments" className="border-b border-border/50">
                <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">Treatment Options</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-1.5">
                    {treatments.map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {whenToSeeDoctor && (
              <AccordionItem value="doctor" className="border-none">
                <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">When to See a Doctor</AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                  {renderMarkdown(whenToSeeDoctor)}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-[16px] bg-amber-50/60 border border-amber-200/40 shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          <FiShield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">{disclaimer}</p>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={onNewAnalysis} className="w-full">
        New Analysis
      </Button>
    </div>
  )
}
