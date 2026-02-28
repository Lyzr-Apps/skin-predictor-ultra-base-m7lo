'use client'

import React from 'react'
import { FiClock, FiTrash2 } from 'react-icons/fi'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface HistoryEntry {
  id: string
  timestamp: string
  conditionName: string
  confidenceScore: number
  urgencyLevel: string
  imageDataUrl: string
  fullResult: any
}

interface HistorySidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
  onClearHistory: () => void
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Unknown date'
  }
}

function urgencyColor(level: string): string {
  const map: Record<string, string> = {
    Low: 'bg-green-100 text-green-800',
    Moderate: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
  }
  return map[level] ?? map['Low']
}

export default function HistorySidebar({ open, onOpenChange, history, onSelectEntry, onClearHistory }: HistorySidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[380px] p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FiClock className="w-4 h-4" />
            Analysis History
          </SheetTitle>
        </SheetHeader>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <FiClock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No analyses yet</p>
            <p className="text-xs text-muted-foreground">
              Your past skin analyses will appear here.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
              <div className="p-3 space-y-2">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onSelectEntry(entry)
                      onOpenChange(false)
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-accent/60 transition-colors border border-transparent hover:border-border/50 group"
                  >
                    <div className="flex gap-3">
                      {entry.imageDataUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={entry.imageDataUrl}
                            alt={entry.conditionName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.conditionName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{entry.confidenceScore}%</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${urgencyColor(entry.urgencyLevel)}`}>
                            {entry.urgencyLevel}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border/50 p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="w-full text-xs text-muted-foreground hover:text-destructive"
              >
                <FiTrash2 className="w-3 h-3 mr-1.5" />
                Clear History
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
