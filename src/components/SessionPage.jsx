import { useState } from 'react'
import { Plus, ChevronDown, Clock, Image as ImageIcon } from 'lucide-react'

const SessionPage = () => {
  const [sortBy, setSortBy] = useState('Date updated')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  const sessions = [
    {
      id: 1,
      title: "Dog with Glasses",
      thumbnail: null,
      lastUpdated: "40 minutes ago",
      generations: 0,
      type: "Icon",
      emoji: "🐕"
    },
    {
      id: 2,
      title: "Game Console",
      thumbnail: null,
      lastUpdated: "2 days ago",
      generations: 1,
      type: "Icon",
      emoji: "🎮"
    },
    {
      id: 3,
      title: "Space Cat",
      thumbnail: null,
      lastUpdated: "1 week ago",
      generations: 3,
      type: "Icon",
      emoji: "🐱"
    },
    {
      id: 4,
      title: "Robot Friend",
      thumbnail: null,
      lastUpdated: "2 weeks ago",
      generations: 2,
      type: "Icon",
      emoji: "🤖"
    },
    {
      id: 5,
      title: "Magic Potion",
      thumbnail: null,
      lastUpdated: "3 weeks ago",
      generations: 1,
      type: "Icon",
      emoji: "🧪"
    },
    {
      id: 6,
      title: "Flying Dragon",
      thumbnail: null,
      lastUpdated: "4 weeks ago",
      generations: 2,
      type: "Icon",
      emoji: "🐉"
    }
  ]

  const sortOptions = [
    'Date updated',
    'Date created',
    'Name',
    'Type',
    'Generations'
  ]

  return (
    <main className="flex-1 p-4 sm:p-6 overflow-y-auto pt-8 h-full bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Sessions</h1>
          <button className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            New Session
          </button>
        </div>

        {/* Sort Section */}
        <div className="mb-6">
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500" 
            >
              <option>Sort by: Last updated</option>
              <option>Sort by: Name</option>
              <option>Sort by: Type</option>
              <option>Sort by: Generations</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className="h-48 bg-slate-50 border-b border-slate-200 flex items-center justify-center overflow-hidden relative">
                <img 
                  src="/images/homepage/background.png" 
                  alt="Background"
                  className="w-full h-full object-cover absolute inset-0"
                />
                <div className="text-6xl relative z-10">{session.emoji}</div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 mb-2">{session.title}</h3>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                  <span>{session.lastUpdated}</span>
                  <span>{session.generations} generations</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                    {session.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default SessionPage 