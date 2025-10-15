import React from 'react'
import { createRoot } from 'react-dom/client'
import { useWidgetProps, type CouncilResponse } from '../use-widget-props'
import './index.css'

function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <h2 className="text-xl font-semibold text-gray-900">Consulting the AI Council</h2>
          <p className="text-sm text-gray-600">Gathering wisdom from our expert members...</p>
        </div>
      </div>
    </div>
  )
}

function CouncilMemberCard({ member }: { member: CouncilResponse['members'][0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {member.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
          <p className="text-sm font-medium text-blue-600 mb-3">{member.role}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{member.opinion}</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const data = useWidgetProps()

  if (!data) {
    return <LoadingState />
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your AI Council</h1>
          <p className="text-lg text-gray-600 mb-2">
            Three expert perspectives on: <span className="font-medium text-gray-900">"{data.question}"</span>
          </p>
          <p className="text-sm text-gray-500">
            Each council member brings unique expertise to help guide your decision-making
          </p>
        </div>

        {/* Council Members */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {data.members.map((member, index) => (
            <CouncilMemberCard key={index} member={member} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Consider these perspectives holistically when making your decision
          </p>
        </div>
      </div>
    </div>
  )
}

const rootElement = document.getElementById('your-ai-council-root')

if (rootElement) {
  createRoot(rootElement).render(<App />)
}

export { }
