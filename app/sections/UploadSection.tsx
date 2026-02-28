'use client'

import React, { useState, useRef, useCallback } from 'react'
import { FiUploadCloud, FiCamera, FiX, FiRefreshCw } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'

const AGENT_ID = '69a2937542fb78f6798a6c12'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE = 10 * 1024 * 1024

export interface AnalysisResult {
  id: string
  timestamp: string
  conditionName: string
  confidenceScore: number
  urgencyLevel: string
  imageDataUrl: string
  fullResult: any
}

interface UploadSectionProps {
  onAnalysisComplete: (result: AnalysisResult) => void
  onReset: () => void
  isAnalyzing: boolean
  setIsAnalyzing: (v: boolean) => void
  setActiveAgentId: (id: string | null) => void
}

export default function UploadSection({
  onAnalysisComplete,
  onReset,
  isAnalyzing,
  setIsAnalyzing,
  setActiveAgentId,
}: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Invalid file type. Please upload a JPG or PNG image.'
    }
    if (f.size > MAX_SIZE) {
      return 'File too large. Maximum size is 10MB.'
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string ?? '')
    }
    reader.readAsDataURL(f)
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFileSelect(selected)
  }, [handleFileSelect])

  const handleClearFile = useCallback(() => {
    setFile(null)
    setPreview('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  /**
   * Deep-search for the prediction object through all nesting levels.
   * The agent response can be wrapped in multiple layers by the API route
   * and parseLLMJson, so we need to search exhaustively.
   */
  const extractAnalysisData = useCallback((raw: any): { prediction: any; condition_details: any; disclaimer: string } | null => {
    if (!raw || typeof raw !== 'object') {
      // raw might be a JSON string
      if (typeof raw === 'string') {
        try {
          return extractAnalysisData(JSON.parse(raw))
        } catch {
          return null
        }
      }
      return null
    }

    // Direct match: object has prediction at this level
    if (raw.prediction && typeof raw.prediction === 'object' && raw.prediction.condition_name) {
      return {
        prediction: raw.prediction,
        condition_details: raw.condition_details || {},
        disclaimer: raw.disclaimer || '',
      }
    }

    // Check nested keys commonly used by normalizeResponse and parseLLMJson
    const searchKeys = ['result', 'response', 'data', 'output', 'content', 'text', 'message']
    for (const key of searchKeys) {
      if (raw[key]) {
        let val = raw[key]
        // If the value is a string, try to parse it as JSON
        if (typeof val === 'string') {
          try { val = JSON.parse(val) } catch { continue }
        }
        const found = extractAnalysisData(val)
        if (found) return found
      }
    }

    return null
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setError('')
    setIsAnalyzing(true)
    setActiveAgentId(AGENT_ID)

    try {
      const uploadResult = await uploadFiles(file)
      if (!uploadResult.success) {
        setError(uploadResult.error ?? 'Failed to upload image. Please try again.')
        setIsAnalyzing(false)
        setActiveAgentId(null)
        return
      }

      const assetIds = Array.isArray(uploadResult.asset_ids) ? uploadResult.asset_ids : []
      const result = await callAIAgent(
        'Analyze this skin condition image and provide a detailed prediction with condition name, confidence score, urgency level, description, symptoms, possible causes, treatment options, and when to see a doctor.',
        AGENT_ID,
        { assets: assetIds }
      )

      if (!result.success) {
        setError(result.error ?? 'Analysis failed. Please try again.')
        setIsAnalyzing(false)
        setActiveAgentId(null)
        return
      }

      // Try multiple extraction strategies to find the prediction data
      // Strategy 1: Parse result.response.result with parseLLMJson
      let analysisData = extractAnalysisData(parseLLMJson(result?.response?.result))

      // Strategy 2: Try result.response directly
      if (!analysisData) {
        analysisData = extractAnalysisData(result?.response)
      }

      // Strategy 3: Try the raw_response string
      if (!analysisData && result?.raw_response) {
        const rawParsed = parseLLMJson(result.raw_response)
        analysisData = extractAnalysisData(rawParsed)
      }

      // Strategy 4: Try the entire result object
      if (!analysisData) {
        analysisData = extractAnalysisData(result)
      }

      const prediction = analysisData?.prediction ?? {}
      const conditionName = prediction?.condition_name ?? 'Unknown Condition'
      const confidenceScore = typeof prediction?.confidence_score === 'number' ? prediction.confidence_score : 0
      const urgencyLevel = prediction?.urgency_level ?? 'Low'

      const fullResult = analysisData ?? parseLLMJson(result?.response?.result) ?? {}

      const analysisResult: AnalysisResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        conditionName,
        confidenceScore,
        urgencyLevel,
        imageDataUrl: preview,
        fullResult,
      }

      onAnalysisComplete(analysisResult)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsAnalyzing(false)
      setActiveAgentId(null)
    }
  }, [file, preview, onAnalysisComplete, setIsAnalyzing, setActiveAgentId, extractAnalysisData])

  return (
    <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <FiCamera className="w-5 h-5 text-foreground/70" />
          <h2 className="text-lg font-semibold tracking-tight" style={{ letterSpacing: '-0.01em' }}>
            Upload Image
          </h2>
        </div>

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-foreground/40 bg-accent/50' : 'border-border hover:border-foreground/30 hover:bg-accent/30'}`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleInputChange}
              className="hidden"
            />
            <FiUploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Uploaded skin image"
                className="w-full h-64 object-contain bg-muted"
              />
              {!isAnalyzing && (
                <button
                  onClick={handleClearFile}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white transition-colors"
                  aria-label="Remove image"
                >
                  <FiX className="w-4 h-4 text-foreground" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {file?.name ?? 'Uploaded image'}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing skin condition...</span>
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        )}

        {preview && !isAnalyzing && (
          <Button
            onClick={handleAnalyze}
            className="w-full mt-5"
            size="lg"
          >
            Analyze Skin Condition
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
