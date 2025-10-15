import { useState, useEffect } from 'react'

export interface CouncilMember {
  name: string
  role: string
  opinion: string
}

export interface CouncilResponse {
  question: string
  members: CouncilMember[]
}

export function useWidgetProps(): CouncilResponse | null {
  const [data, setData] = useState<CouncilResponse | null>(null)

  useEffect(() => {
    // Listen for messages from the parent window (ChatGPT)
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== 'https://chatgpt.com' && event.origin !== 'https://web-sandbox.oaiusercontent.com') {
        return
      }

      if (event.data && event.data.type === 'widget-props') {
        setData(event.data.props as CouncilResponse)
      }
    }

    window.addEventListener('message', handleMessage)

    // Request props from parent
    window.parent.postMessage({ type: 'request-props' }, '*')

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return data
}
