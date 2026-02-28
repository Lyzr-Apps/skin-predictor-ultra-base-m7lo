'use client'

import React, { useState } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

interface DisclaimerBannerProps {
  className?: string
}

export default function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className={`w-full bg-amber-50 border-b border-amber-200 ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-start gap-3">
        <FiAlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed flex-1" style={{ letterSpacing: '-0.01em', lineHeight: '1.55' }}>
          <span className="font-semibold">Medical Disclaimer:</span> This tool is for informational purposes only and is not a substitute for professional medical diagnosis. Always consult a healthcare professional for any skin concerns.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0 p-0.5"
          aria-label="Dismiss disclaimer"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
