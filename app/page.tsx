'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FiActivity, FiClock, FiShield } from 'react-icons/fi'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import DisclaimerBanner from './sections/DisclaimerBanner'
import UploadSection from './sections/UploadSection'
import type { AnalysisResult } from './sections/UploadSection'
import ResultsSection from './sections/ResultsSection'
import HistorySidebar from './sections/HistorySidebar'

const AGENT_ID = '69a2937542fb78f6798a6c12'
const HISTORY_KEY = 'skinsense_history'
const MAX_HISTORY = 20

const SAMPLE_RESULT: AnalysisResult = {
  id: 'sample-1',
  timestamp: '2025-01-15T10:30:00Z',
  conditionName: 'Contact Dermatitis',
  confidenceScore: 82,
  urgencyLevel: 'Moderate',
  imageDataUrl: '',
  fullResult: {
    prediction: {
      condition_name: 'Contact Dermatitis',
      confidence_score: 82,
      urgency_level: 'Moderate',
    },
    condition_details: {
      description: 'Contact dermatitis is a type of inflammation of the skin that occurs when substances touching the skin cause irritation or an allergic reaction. The resulting red, itchy rash is not contagious or life-threatening, but it can be very uncomfortable.',
      symptoms: [
        'Red, itchy rash on affected area',
        'Dry, cracked, or scaly skin',
        'Bumps and blisters that may ooze or crust',
        'Swelling, burning, or tenderness',
        'Skin may appear darkened or leathery',
      ],
      possible_causes: [
        'Direct contact with irritants (soaps, detergents, chemicals)',
        'Allergic reaction to metals (nickel), latex, or cosmetics',
        'Exposure to certain plants (poison ivy, poison oak)',
        'Prolonged exposure to water or wet conditions',
        'Friction from clothing or accessories',
      ],
      treatment_options: [
        'Identify and avoid the triggering substance',
        'Apply over-the-counter hydrocortisone cream',
        'Use moisturizers to restore the skin barrier',
        'Take oral antihistamines for itching relief',
        'Apply cool, wet compresses to soothe affected areas',
        'Prescription corticosteroid creams for severe cases',
      ],
      when_to_see_doctor: 'Seek medical attention if the rash is severe, widespread, or does not improve within 2-3 weeks. See a doctor immediately if you develop signs of infection such as increasing pain, swelling, warmth, pus, or fever.',
    },
    disclaimer: 'This AI analysis is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.',
  },
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const saveHistory = useCallback((newHistory: AnalysisResult[]) => {
    const trimmed = newHistory.slice(0, MAX_HISTORY)
    setHistory(trimmed)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    } catch {
      // storage full, ignore
    }
  }, [])

  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    setCurrentResult(result)
    saveHistory([result, ...history])
  }, [history, saveHistory])

  const handleReset = useCallback(() => {
    setCurrentResult(null)
  }, [])

  const handleSelectHistory = useCallback((entry: AnalysisResult) => {
    setCurrentResult(entry)
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      // ignore
    }
  }, [])

  const handleSampleToggle = useCallback((checked: boolean) => {
    setSampleMode(checked)
    if (checked) {
      setCurrentResult(SAMPLE_RESULT)
    } else {
      setCurrentResult(null)
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(0 0% 99%) 0%, hsl(210 10% 98%) 35%, hsl(0 0% 98%) 70%, hsl(220 8% 99%) 100%)' }}>
        <DisclaimerBanner />

        <header className="border-b border-border/40 backdrop-blur-[16px] bg-white/60 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
                <FiShield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                  SkinSense
                </h1>
                <p className="text-[11px] text-muted-foreground -mt-0.5">AI Skin Disease Prediction</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sample Data</span>
                <Switch
                  checked={sampleMode}
                  onCheckedChange={handleSampleToggle}
                  aria-label="Toggle sample data"
                />
              </div>

              <button
                onClick={() => setSidebarOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-accent/60 transition-colors text-sm"
                aria-label="Open history"
              >
                <FiClock className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">History</span>
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {history.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UploadSection
              onAnalysisComplete={handleAnalysisComplete}
              onReset={handleReset}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              setActiveAgentId={setActiveAgentId}
            />
            <ResultsSection
              result={currentResult}
              onNewAnalysis={handleReset}
            />
          </div>

          <div className="mt-10 p-4 rounded-xl backdrop-blur-[16px] bg-white/50 border border-white/[0.18]">
            <div className="flex items-center gap-2 mb-2">
              <FiActivity className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agent Status</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
              <span className="text-sm font-medium">Skin Analysis Agent</span>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {activeAgentId ? 'Processing' : 'Idle'}
              </Badge>
              <span className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
                ID: {AGENT_ID}
              </span>
            </div>
          </div>
        </main>

        <HistorySidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          history={history}
          onSelectEntry={handleSelectHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </ErrorBoundary>
  )
}
